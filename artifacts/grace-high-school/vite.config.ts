import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Replit sets PORT/BASE_PATH via artifact.toml; CI/Coolify builds use these defaults.
const basePath = process.env.BASE_PATH ?? "/";
const portRaw = process.env.PORT;
const port = Number(portRaw ?? "24144");
if (portRaw !== undefined && portRaw !== "" && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${portRaw}"`);
}

const isReplit = process.env.REPL_ID !== undefined;
const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8080";
const artifactDir = path.resolve(import.meta.dirname);
const publicDir = path.resolve(artifactDir, "public");
const outDir = path.resolve(artifactDir, "dist/public");

/** Belt-and-suspenders: ensure Search Console HTML files land at the dist root. */
function copyRootVerificationFiles(): void {
  if (!fs.existsSync(publicDir)) return;
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of fs.readdirSync(publicDir)) {
    if (/^google[a-z0-9]+\.html$/i.test(name)) {
      fs.copyFileSync(path.join(publicDir, name), path.join(outDir, name));
    }
  }
}

export default defineConfig({
  base: basePath,
  publicDir,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    {
      name: "copy-google-verification",
      closeBundle: copyRootVerificationFiles,
    },
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: artifactDir,
  build: {
    outDir,
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: isReplit
      ? undefined
      : {
          "/api": {
            target: apiProxyTarget,
            changeOrigin: true,
            // Keep SSE (/api/events) open — default timeouts drop the stream.
            timeout: 0,
            proxyTimeout: 0,
            configure(proxy) {
              proxy.on("proxyReq", (proxyReq, req) => {
                if (req.url?.startsWith("/api/events") || req.url === "/events") {
                  proxyReq.setHeader("Connection", "keep-alive");
                  proxyReq.setHeader("Accept", "text/event-stream");
                }
              });
            },
          },
        },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
