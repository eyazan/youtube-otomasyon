#!/usr/bin/env bash
# Commit what is staged and push it to the workflow's branch ONLY if the repository's JS tests pass on the rebased
# tree. Content and research bots use it; a red result is a failed job (visible), never a red main.
# Production state commits (portfolio-production, yayin-kontrol, uretim-is, yorum-yanitla, growth-feedback-loop) do
# not: their state must persist whatever the tests say, or a published video could be produced twice.
#   usage: scripts/ci/push-if-green.sh "<commit message>"   (needs npm ci first: the tests load the runtime modules)
set -uo pipefail
msg="$1"; branch="${GITHUB_REF_NAME:-main}"
if git diff --cached --quiet; then echo "unchanged"; exit 0; fi
git commit -q -m "$msg" || exit 1
# the same system packages as the test workflow (test.yml); already-installed ones are skipped
bash scripts/ci-apt.sh --no-install-recommends ffmpeg fonts-dejavu-core fonts-liberation python3-pil >/dev/null 2>&1 || echo "apt: system packages not installed; tests decide"
for i in 1 2 3 4 5; do
  if ! git pull -q --rebase --autostash origin "$branch"; then git rebase --abort 2>/dev/null || true; sleep $((i * 5)); continue; fi
  if ! node --test tests/js/*.test.js > "${RUNNER_TEMP:-/tmp}/push-if-green.log" 2>&1; then
    grep -E "^not ok|^# (pass|fail)|error:" "${RUNNER_TEMP:-/tmp}/push-if-green.log" | head -40
    echo "::error::repository tests fail with this commit; it was NOT pushed to $branch"
    exit 1
  fi
  git push -q origin "HEAD:$branch" && { echo "pushed $(git rev-parse --short HEAD) to $branch (tests green)"; exit 0; }
  sleep $((i * 5))
done
echo "::error::could not push after 5 attempts"; exit 1
