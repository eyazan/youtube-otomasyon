# Skills installation report

Date: 2026-10-19. Claude Code version used for verification: 2.1.303.

## Installed (project-local, `.claude/skills/`)

| Skill | Invocation | Role |
|---|---|---|
| `premium-video-producer` | `/premium-video-producer --channel behind-the-ordinary --topic <id>` | Master orchestration (+ `reference.md` file map and commands) |
| `visual-director` | `/visual-director <id>` | Treatment and schema-valid storyboard |
| `motion-design` | auto / `/motion-design` | Deterministic motion, component authoring |
| `technical-animation` | auto / `/technical-animation` | Accurate mechanisms; conceptual labelling |
| `cinematic-composition` | auto / `/cinematic-composition` | Camera, hierarchy, zones, transitions |
| `audio-director` | auto / `/audio-director` | Approved voice, synthesised SFX, mix |
| `video-quality-review` | `/video-quality-review <id>` | Objective vs subjective review, revision list |

**Format:** `SKILL.md` with YAML frontmatter on line 1, following the current Claude Code skills documentation (code.claude.com/docs/en/skills, read in this session). Fields used:

- `name`
- `description`
- `argument-hint`
- `arguments`: positional names, giving `$channel` and `$topic`
- `allowed-tools`: narrow pre-approvals, e.g. `Bash(node scripts/bto-studio/*)`

The Skills hold instructions only. All software is in the shared modules under `scripts/bto-studio/`, which every Skill references, so no code is duplicated.

## Verification (performed, with output)

| Check | Method | Result |
|---|---|---|
| Frontmatter valid; name = directory; description length; referenced files exist | `tests/js/bto-studio.test.js` (skills test) | pass |
| Discovery | Fresh headless `claude -p` process asked to list the seven skills it sees | `visual-director, motion-design, technical-animation, cinematic-composition, audio-director, video-quality-review, premium-video-producer` |
| Invocation + argument substitution | `claude -p "/premium-video-producer --channel behind-the-ordinary --topic BTO-301 …"` | `SKILL_LOADED channel=behind-the-ordinary topic=BTO-301` |
| This already-running session | `Skill("video-quality-review")` | "Unknown skill": the session indexed Skills at startup, before they existed. A new session sees them. |

## External Skills and plugins

- **No external Skill was installed. No remote install script was run.**
- The Remotion skills (`remotion:*`) visible in this session come from a user-level plugin that was already present. They were not installed by this work, and the studio does not depend on them.
- Remotion itself was evaluated and not adopted (see `architecture-audit.md` §8).
- Reference articles `movez.substack.com/p/how-to-build-motion-design-studio` and `x.com/beamnxw/status/2111079523089322438`: **not accessible** (DNS blocked by the session proxy). A web search did not find the Movez post. Nothing in this work is based on their contents.

## Dependencies added

None to `package.json` dependencies; only scripts were added.

The pilot used two Python packages, pinned and installed with pip for the QR asset and its decode check:

| Package | Version | Licence |
|---|---|---|
| `segno` | 1.6.6 | BSD-3-Clause |
| `zxing-cpp` | 2.3.0 | Apache-2.0 |

The Kokoro preview fallback uses the repository's existing pins: `kokoro-onnx==0.6.1`, with the model files sha256-verified as in `quality-preview.yml`.
