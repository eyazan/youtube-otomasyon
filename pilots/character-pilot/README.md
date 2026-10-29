# Character pilot: rigged CC0 mannequin driven by the kit's motion library (review only)

Never published and not wired into production. Its purpose is to test whether a free, licence-verified rigged character can replace the kit's
primitive v2 figure without hand-animating each topic.

## Assets (pinned, repeatable)

| Asset | Source | Licence (from the archive's own License.txt) | Pin |
|---|---|---|---|
| Universal Animation Library, Standard (Quaternius): mannequin, 13,744 triangles, 53-bone rig, 46 clips | opengameart.org/content/universal-animation-library | CC0 1.0 Universal | sha256 18ff1a72… (`scripts/pilot-assets/manifest.json`) |
| Universal Animation Library 2, Standard (Quaternius): 65-bone rig, 43 clips, female mannequin | opengameart.org/content/universal-animation-library-2 | CC0 1.0 Universal | sha256 ec0e40d6… |

- `scripts/pilot-assets/fetch.sh` downloads, verifies the sha256 and unpacks.
- `inspect-gltf.js` lists meshes, bones and clips.
- The `pilot-assets` workflow copies the files to the separate `pilot/assets-vendor` branch so a local review can load them.
- Kenney (Animated/Blocky Characters, CC0) has no direct download link on its pages, so it could not be pinned automatically.
- Mixamo-derived files (three.js Xbot and Soldier) are not used, because their licence is unclear.

## Approach

`scene.html` retargets the kit's pose parameters (`pilots/kit/football.js` MOTION: kick, chip, keeper ready, dive, and
the feint's chest/head turn) onto the mannequin's skeleton. Each pose is applied as world-space rotations over a neutral
standing base, so **the same motion library drives both figures and no topic-specific animation is written**. The run-up
plays the motion-captured `Sprint_Loop` and `Jog_Fwd_Loop` clips, rate-matched to the root speed so the stance foot stays planted. The
measured native ground speeds are 6.4 and 3.8 m/s.

`node pilots/character-pilot/render.js --seq rc|pk --fig ual|v2 --mp4` renders the sequence and reports foot skate.

## What it does and does not solve

| Movement | Mannequin (this pilot) | Kit v2 figure | Professional? |
|---|---|---|---|
| Run-up | Motion-captured sprint/jog, rate-matched; foot skate median 2.2 m/s (RC), 1.2 m/s (Panenka). The residual is the toe joint rolling during push-off. | Procedural gait with no stride sync; foot skate median 8.4 m/s (RC) | Yes for the run-up |
| Approach / plant | Blend from the last clip frame into the kick pose over 0.18 s | Pose switch | Acceptable |
| Strike, balance arm, follow-through | Kit angles (Lees & Nolan phases) on a deforming body; reads as a human kick | Same angles on capsules | Not mocap; REPRESENTATIVE |
| Keeper dive | Kit dive on the mannequin, arms overhead | Same | Not mocap; stiff body |
| Feint | Chest and head turn of ~0.45 rad before contact; subtle | Same | Weak |

**Verdict:** the mannequin with motion-captured locomotion is a clear step up in body, deformation and run-up, and it
scales because it reuses the existing motion library. The strike, dive and feint are still hand-keyed angles, so they are
**not yet real football motion**. Neither UAL pack contains a kick, dive or feint clip.

Next step, to be verified by the owner:
- Football motion capture from the CMU Graphics Lab Motion Capture Database (soccer-kick takes), retargeted with three.js `SkeletonUtils.retargetClip`. Its terms of use must be read and accepted by the owner first.
- Quaternius Universal Base Characters (CC0; faces, hair, outfits on the same rig). Their download is not a direct link, so the files must be placed in the manifest by hand.
