import express, { type Express, type RequestHandler } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./logger";

const artifactsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

type StaticSite = {
  mount: string;
  artifact: string;
};

const STATIC_SITES: StaticSite[] = [
  { mount: "/dashboard", artifact: "grace-admin" },
  { mount: "/", artifact: "grace-high-school" },
];

function spaFallback(publicDir: string): RequestHandler {
  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  };
}

const SEO_ASSET_RE =
  /(?:^|[/\\])(?:sitemap\.xml|robots\.txt|site\.webmanifest|google[a-z0-9]+\.html|favicon\.ico|favicon\.png|ghs-\d+\.png|icon-\d+\.png|school-icon-\d+\.png|favicon-\d+x\d+\.png|logo(?:-\d+)?\.png)$/i;

const GOOGLE_SITE_VERIFICATION_FILE = "google9d7169ba6cc50173.html";
const GOOGLE_SITE_VERIFICATION_BODY =
  "google-site-verification: google9d7169ba6cc50173.html\n";

function hasStaticExtension(requestPath: string): boolean {
  return /\.[a-z0-9]+$/i.test(requestPath);
}

function readGoogleSiteVerificationBody(publicDir: string): string {
  const filePath = path.join(publicDir, GOOGLE_SITE_VERIFICATION_FILE);
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return GOOGLE_SITE_VERIFICATION_BODY;
  }
}

function registerGoogleSiteVerification(app: Express, publicDir: string): void {
  const verificationPath = `/${GOOGLE_SITE_VERIFICATION_FILE}`;

  app.get(verificationPath, (_req, res) => {
    res
      .status(200)
      .type("text/html; charset=utf-8")
      .set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
      .send(readGoogleSiteVerificationBody(publicDir));
  });

  app.head(verificationPath, (_req, res) => {
    res
      .status(200)
      .type("text/html; charset=utf-8")
      .set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
      .end();
  });
}

function staticOptions() {
  return {
    setHeaders(res: express.Response, filePath: string) {
      if (SEO_ASSET_RE.test(filePath)) {
        // Let Cloudflare cache crawler assets even when the free instance sleeps.
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      }
    },
  };
}

function mountSpa(app: Express, mount: string, publicDir: string): void {
  if (mount === "/") {
    app.use(express.static(publicDir, staticOptions()));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/dashboard")) {
        next();
        return;
      }
      // Don't serve the SPA shell for missing static files (e.g. Search Console HTML).
      if (hasStaticExtension(req.path)) {
        res.status(404).type("text/plain").send("Not found");
        return;
      }
      spaFallback(publicDir)(req, res, next);
    });
    return;
  }

  app.use(mount, express.static(publicDir, staticOptions()));
  // Express 5 / path-to-regexp v8 requires a named wildcard (/* is invalid).
  app.get(`${mount}/*path`, spaFallback(publicDir));
}

/** Serve Vite build output for the public site + staff dashboard (single Coolify service). */
export function registerStaticSites(app: Express): void {
  const homeDir = path.join(artifactsRoot, "grace-high-school", "dist/public");
  // Register before static/SPA middleware so Search Console gets 200 + raw body (no redirect).
  registerGoogleSiteVerification(app, homeDir);

  // Legacy /admin bookmarks → grace-admin
  app.get(["/admin", "/admin/", "/admin/*path"], (_req, res) => {
    res.redirect(302, "/dashboard/");
  });

  let mounted = 0;

  for (const site of STATIC_SITES.filter((s) => s.mount !== "/")) {
    const publicDir = path.join(artifactsRoot, site.artifact, "dist/public");
    const indexHtml = path.join(publicDir, "index.html");
    if (!fs.existsSync(indexHtml)) {
      logger.warn({ publicDir }, "Static site build output not found, skipping mount");
      continue;
    }
    mountSpa(app, site.mount, publicDir);
    mounted++;
    logger.info({ mount: site.mount, publicDir }, "Serving static site");
  }

  const homeIndex = path.join(homeDir, "index.html");
  if (fs.existsSync(homeIndex)) {
    mountSpa(app, "/", homeDir);
    mounted++;
    logger.info({ mount: "/", publicDir: homeDir }, "Serving static site");
  } else {
    logger.warn({ publicDir: homeDir }, "Public site build output not found");
  }

  if (mounted === 0) {
    logger.warn(
      "No frontend build output found — only /api routes are available. Run pnpm run build before start.",
    );
  }
}
