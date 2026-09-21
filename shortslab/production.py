"""Resumable local production. Never publishes or uploads videos."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
STAGES = ('script', 'voice', 'visuals', 'render')
SCRIPTS = dict(zip(STAGES, ('senaryo-claude.js', 'seslendir.js',
                          'gorsel-bul.js', 'video-yap.js')))


def job_path(slug):
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,79}', slug):
        raise ValueError('Job name must contain only lowercase letters, digits and hyphens.')
    path = ROOT / 'uretim' / slug
    if path.resolve().parent != (ROOT / 'uretim').resolve():
        raise ValueError('Job must be inside uretim.')
    return path


def save(path, value):
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')
    tmp.replace(path)


def fingerprint(files):
    digest = hashlib.sha256()
    for path in sorted(files):
        digest.update(str(path.relative_to(ROOT)).encode())
        with path.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(chunk)
    return digest.hexdigest()


def outputs(job, stage):
    if stage == 'script':
        return [job / 'Voice/SESLENDIRME-TAM-METIN.txt']
    if stage == 'voice':
        text = (job / 'Voice/SESLENDIRME-TAM-METIN.txt').read_text()
        count = len([p for p in re.split(r'\n\s*\n', text.strip()) if p.strip()])
        return [job / f'Voice/parts/{i:03d}.mp3' for i in range(count)]
    if stage == 'visuals':
        return sorted(p for p in (job / 'Visuals').glob('*/*')
                      if p.suffix.lower() in ('.png', '.jpg'))
    return [job / 'Videos' / (job.name + '.mp4')]


def valid(files):
    return bool(files) and all(p.is_file() and p.stat().st_size > 0 for p in files)


def doctor(job):
    missing = [name for name in ('node', 'ffmpeg', 'ffprobe') if not shutil.which(name)]
    if not (ROOT / 'node_modules/msedge-tts').is_dir():
        missing.append('npm install (msedge-tts)')
    if not valid(outputs(job, 'script')):
        if not (ROOT / 'node_modules/@anthropic-ai/sdk').is_dir():
            missing.append('npm install (@anthropic-ai/sdk)')
        for name in ('ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL'):
            if not os.environ.get(name):
                missing.append(name + ' environment variable')
    return missing


def initialize(slug, title, brief, script=None):
    job = job_path(slug)
    job.mkdir(parents=True, exist_ok=False)
    (job / 'Voice').mkdir()
    save(job / 'konu.json', {
        'kanal': 'Failure Reconstructed', 'baslik_en': title, '_not': brief,
        'format': 'long', 'aspect': '16:9', 'hedefSaniye': 480,
        'ses': 'en-US-ChristopherNeural', 'sesHizi': '+0%',
        'geriSayim': 0, 'intro': 0, 'konuKarti': 0, 'outro': 3,
        'muzikSeviyesi': 0, 'renk': 'sinematik', 'gecis': 'fade',
    })
    if script:
        shutil.copyfile(script, outputs(job, 'script')[0])
    return job


def run(job, until='render', runner=subprocess.run):
    # Exclusive creation prevents two workers charging for the same job.
    lock = job / '.production.lock'
    with lock.open('x') as stream:
        stream.write(str(os.getpid()))
    try:
        state_path = job / 'production-state.json'
        state = json.loads(state_path.read_text()) if state_path.exists() else {}
        for stage in STAGES[:STAGES.index(until) + 1]:
            files = outputs(job, stage)
            input_files = [job / 'konu.json', ROOT / SCRIPTS[stage]]
            if stage != 'script':
                input_files += outputs(job, 'script')
            if stage == 'render':
                input_files += outputs(job, 'voice') + outputs(job, 'visuals')
            signature = fingerprint(input_files)
            old = state.get(stage, {})
            # Imported or hand-reviewed narration is authoritative, never overwritten.
            if stage == 'script' and valid(files):
                print('script: supplied narration retained')
                continue
            if (valid(files) and old.get('status') == 'complete'
                    and old.get('input') == signature
                    and old.get('output') == fingerprint(files)):
                print(stage + ': already complete')
                continue
            state[stage] = {'status': 'running', 'input': signature}
            save(state_path, state)
            print(stage + ': running', flush=True)
            try:
                # No shell, no raw provider logs in persisted reports.
                result = runner(['node', SCRIPTS[stage], job.name], cwd=ROOT,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                timeout=7200, check=False)
                files = outputs(job, stage)
                if result.returncode or not valid(files):
                    raise ValueError('stage failed or output missing')
                if stage == 'render':
                    probe = runner(['ffprobe', '-v', 'error', '-show_streams',
                                    '-of', 'json', str(files[0])], capture_output=True,
                                   text=True, timeout=30, check=True)
                    streams = json.loads(probe.stdout)['streams']
                    if not {'audio', 'video'} <= {s['codec_type'] for s in streams}:
                        raise ValueError('render needs audio and video streams')
                state[stage].update(status='complete', output=fingerprint(files))
                save(state_path, state)
            except Exception:
                state[stage]['status'] = 'failed'
                save(state_path, state)
                raise ValueError(stage + ' failed; inspect locally, then rerun the same job.') from None
        return state
    finally:
        lock.unlink()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('init', 'doctor', 'run', 'status'))
    parser.add_argument('job')
    parser.add_argument('--title')
    parser.add_argument('--brief')
    parser.add_argument('--script', type=Path)
    parser.add_argument('--until', choices=STAGES, default='render')
    args = parser.parse_args(argv)
    try:
        if args.command == 'init':
            if not args.title or not args.brief:
                parser.error('init requires --title and --brief')
            if args.script and not valid([args.script]):
                parser.error('--script must be a non-empty local text file')
            print(initialize(args.job, args.title, args.brief, args.script))
            return 0
        job = job_path(args.job)
        if not (job / 'konu.json').is_file():
            raise ValueError('Initialize the job first.')
        if args.command == 'status':
            path = job / 'production-state.json'
            print(path.read_text() if path.exists() else 'Not started')
            return 0
        if args.command == 'doctor':
            missing = doctor(job)
            print(json.dumps({'missing': missing, 'upload': 'not implemented',
                              'visual_mode': 'archival stills, not 3D animation'}, indent=2))
            return 1 if missing else 0
        run(job, args.until)
        print('Requested stages complete. Nothing uploaded or published.')
        return 0
    except (ValueError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
