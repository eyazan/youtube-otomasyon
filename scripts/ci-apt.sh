#!/usr/bin/env bash
# CI package install that cannot hang a runner for hours. The Azure Ubuntu
# mirror (azure.archive.ubuntu.com) repeatedly stalled `apt-get update`; with a
# 180-minute job timeout and one shared concurrency group, a single stall
# blocked every channel's scheduled run.
#   • packages already on the runner are skipped (often nothing to install)
#   • attempt 1 uses the runner's mirror with a short bound
#   • attempts 2-3 switch to archive.ubuntu.com, still bounded
#   • CI_APT_ARCHIVES=<dir> keeps the downloaded .deb files there (restored and saved by
#     actions/cache): a runner with a warm cache installs without downloading, so a stalled mirror
#     (2026-10-22: 27 MB trickling for 40 min, three failed attempts) no longer blocks a run
#
# Usage: bash scripts/ci-apt.sh [apt-get install options...] package...
set -u
OPTIONS=() PACKAGES=()
for arg in "$@"; do [[ "$arg" == -* ]] && OPTIONS+=("$arg") || PACKAGES+=("$arg"); done
MISSING=()
for pkg in "${PACKAGES[@]}"; do dpkg -s "$pkg" >/dev/null 2>&1 || MISSING+=("$pkg"); done
if [ ${#MISSING[@]} -eq 0 ]; then echo "apt: all packages already installed (${PACKAGES[*]})"; exit 0; fi
echo "apt: installing ${MISSING[*]}"
APT_OPTS=(-o Acquire::Retries=2 -o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20 -o DPkg::Lock::Timeout=120)
INSTALL_OPTS=()
if [ -n "${CI_APT_ARCHIVES:-}" ]; then
  mkdir -p "$CI_APT_ARCHIVES/partial"
  # apt downloads as its sandbox user _apt: give it the partial folder (save_cache hands everything back)
  id _apt >/dev/null 2>&1 && sudo chown _apt "$CI_APT_ARCHIVES/partial" 2>/dev/null
  cached=$(find "$CI_APT_ARCHIVES" -maxdepth 1 -name '*.deb' | wc -l)
  echo "apt: package cache $CI_APT_ARCHIVES ($cached .deb file(s) restored)"
  INSTALL_OPTS=(-o "Dir::Cache::Archives=$CI_APT_ARCHIVES/")
fi
save_cache() {
  # actions/cache runs as the runner user: hand the root-owned downloads back to it
  [ -n "${CI_APT_ARCHIVES:-}" ] && sudo chown -R "$(id -u):$(id -g)" "$CI_APT_ARCHIVES" 2>/dev/null
  return 0
}
use_main_archive() {
  sudo sed -i 's|http://azure.archive.ubuntu.com|http://archive.ubuntu.com|g' /etc/apt/sources.list /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true
}
for attempt in 1 2 3; do
  [ "$attempt" -gt 1 ] && use_main_archive
  update_limit=$([ "$attempt" -eq 1 ] && echo 120 || echo 300)
  if timeout "$update_limit" sudo apt-get "${APT_OPTS[@]}" update -q \
    && timeout 600 sudo DEBIAN_FRONTEND=noninteractive apt-get "${APT_OPTS[@]}" "${INSTALL_OPTS[@]}" install -y -q "${OPTIONS[@]}" "${MISSING[@]}"; then
    save_cache
    exit 0
  fi
  echo "::warning::apt attempt ${attempt} failed or timed out; retrying$([ "$attempt" -ge 1 ] && echo ' via archive.ubuntu.com')"
  sleep $((attempt * 10))
done
save_cache
echo "::error::apt install failed after 3 attempts"
exit 1
