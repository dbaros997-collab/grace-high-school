#!/usr/bin/env sh
# Same as coolify-update-git-source.mjs — curl-only for Linux/VPS.
#
# export COOLIFY_URL="http://157.245.47.90:8000"
# export COOLIFY_TOKEN="your_token"
# export COOLIFY_APP_NAME="grace-high-school"
# sh scripts/coolify-update-git-source.sh

set -e

COOLIFY_URL="${COOLIFY_URL:-http://157.245.47.90:8000}"
COOLIFY_URL="${COOLIFY_URL%/}"
COOLIFY_APP_NAME="${COOLIFY_APP_NAME:-grace-high-school}"
GIT_REPO="${COOLIFY_GIT_REPO:-https://github.com/dbaros997-collab/grace-high-school.git}"
GIT_BRANCH="${COOLIFY_GIT_BRANCH:-main}"

if [ -z "$COOLIFY_TOKEN" ]; then
  echo "Missing COOLIFY_TOKEN" >&2
  exit 1
fi

command -v jq >/dev/null 2>&1 || {
  echo "Install jq (apt install jq) or use: node scripts/coolify-update-git-source.mjs" >&2
  exit 1
}

echo "[coolify] Listing applications..."
APPS="$(curl -sS -H "Authorization: Bearer $COOLIFY_TOKEN" -H "Accept: application/json" \
  "$COOLIFY_URL/api/v1/applications")"

APP_UUID="$(echo "$APPS" | jq -r --arg n "$COOLIFY_APP_NAME" '
  [.[] | select((.name | ascii_downcase) == ($n | ascii_downcase))][0].uuid // empty
')"

if [ -z "$APP_UUID" ]; then
  echo "App not found: $COOLIFY_APP_NAME" >&2
  echo "$APPS" | jq -r '.[] | "\(.name) \(.uuid) \(.git_repository // "-")"'
  exit 1
fi

CURRENT="$(echo "$APPS" | jq -r --arg u "$APP_UUID" '.[] | select(.uuid == $u) | .git_repository // empty')"
echo "[coolify] uuid=$APP_UUID"
echo "[coolify] current=$CURRENT"

echo "[coolify] PATCH git_repository..."
curl -sS -X PATCH "$COOLIFY_URL/api/v1/applications/$APP_UUID" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"git_repository\": \"$GIT_REPO\",
    \"git_branch\": \"$GIT_BRANCH\",
    \"build_pack\": \"nixpacks\",
    \"install_command\": \"\",
    \"build_command\": \"\",
    \"start_command\": \"\",
    \"health_check_enabled\": true,
    \"health_check_path\": \"/healthz\"
  }" | jq .

if [ "${COOLIFY_DEPLOY:-0}" = "1" ]; then
  FORCE="${COOLIFY_FORCE_DEPLOY:-0}"
  URL="$COOLIFY_URL/api/v1/deploy?uuid=$APP_UUID"
  [ "$FORCE" = "1" ] && URL="$URL&force=true"
  echo "[coolify] Deploy..."
  curl -sS -X POST "$URL" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Accept: application/json" | jq .
fi

echo "[coolify] Done."
