#!/bin/sh
# Coolify/Nixpacks: install pnpm 11 without corepack, npm -g, or npx (all crash on some Node 20 hosts).
set -e

PNPM_ROOT="${PNPM_ROOT:-/opt/pnpm-cli}"
# Must match package.json "packageManager" (pnpm@11.10.0).
PNPM_VERSION="${PNPM_VERSION:-11.10.0}"

if [ ! -f "$PNPM_ROOT/bin/pnpm.cjs" ]; then
  mkdir -p "$PNPM_ROOT"
  curl -fsSL "https://registry.npmjs.org/pnpm/-/pnpm-${PNPM_VERSION}.tgz" \
    | tar -xz --strip-components=1 -C "$PNPM_ROOT"
fi

# Wrapper on PATH so `pnpm` and npm lifecycle scripts can invoke the CLI.
cat > /usr/local/bin/pnpm << EOF
#!/bin/sh
exec node "$PNPM_ROOT/bin/pnpm.cjs" "\$@"
EOF
chmod +x /usr/local/bin/pnpm

node "$PNPM_ROOT/bin/pnpm.cjs" --version
pnpm install --frozen-lockfile --prod=false
