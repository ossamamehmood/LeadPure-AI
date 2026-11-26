#!/usr/bin/env bash
set -euo pipefail

if ! [[ "$REQUEST_ID" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Invalid request_id" >&2
  exit 1
fi
if [ -n "${CHUNK_INDEX:-}" ] && ! [[ "$CHUNK_INDEX" =~ ^[0-9]+$ ]]; then
  echo "Invalid chunk_index" >&2
  exit 1
fi

sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1 >/dev/null 2>&1 || true

printf '%s\n' "$EMAILS_INPUT" > emails.txt
wc -l emails.txt

node engine/probe.mjs emails.txt result.json
if [ ! -s "$GITHUB_WORKSPACE/result.json" ]; then
  echo "Engine did not produce non-empty result.json" >&2
  exit 1
fi

git config --global user.name "leadpure-engine"
git config --global user.email "engine@leadpure.ai"

cd "$RUNNER_TEMP"
git clone --quiet "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" pub
cd pub

if git ls-remote --exit-code --heads origin results >/dev/null 2>&1; then
  git checkout --quiet results
else
  git checkout --quiet --orphan results
  git rm -rf . >/dev/null 2>&1 || true
  echo "# LeadPure verification results" > README.md
  git add README.md
  git commit --quiet -m "init results branch"
fi

mkdir -p results
if [ ! -f vercel.json ]; then
  echo '{"ignoreCommand":"exit 0"}' > vercel.json
  git add vercel.json
fi

if [ -n "${CHUNK_INDEX:-}" ]; then
  TARGET_PATH="results/${REQUEST_ID}/chunk-${CHUNK_INDEX}.json"
  mkdir -p "results/${REQUEST_ID}"
else
  TARGET_PATH="results/${REQUEST_ID}.json"
fi

cp "$GITHUB_WORKSPACE/result.json" "$TARGET_PATH"
git add "$TARGET_PATH"
if ! git diff --cached --quiet; then
  git commit --quiet -m "result ${REQUEST_ID}${CHUNK_INDEX:+ chunk-${CHUNK_INDEX}}"
fi

for attempt in 1 2 3 4 5; do
  git pull --rebase --quiet origin results || true
  if git push --quiet origin results; then
    echo "Published $TARGET_PATH"
    exit 0
  fi
  sleep $((attempt * 2))
done

echo "Failed to push results" >&2
exit 1
