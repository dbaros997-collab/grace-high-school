import pg from "pg";
import { postgresPoolSsl } from "../lib/postgres-ssl.mjs";

// Never hard-fail the process: Render start commands often chain this with
// `&& node …`, and a DB blip must not prevent the HTTP server from binding.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("DATABASE_URL is not set — skipping schema setup.");
  process.exit(0);
}

const pool = new pg.Pool({
  connectionString,
  connectionTimeoutMillis: 8_000,
  ssl: postgresPoolSsl(connectionString),
});

const schemaSql = `
CREATE TABLE IF NOT EXISTS "staff_users" (
  "id" serial PRIMARY KEY,
  "username" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

CREATE TABLE IF NOT EXISTS "resource_categories" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "resources" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "subject" text NOT NULL,
  "category" text NOT NULL,
  "category_id" integer REFERENCES "resource_categories"("id") ON DELETE SET NULL,
  "level" text NOT NULL DEFAULT 'All',
  "term" text,
  "object_path" text NOT NULL,
  "file_name" text NOT NULL,
  "file_size" integer,
  "content_type" text,
  "is_visible" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "is_visible" boolean NOT NULL DEFAULT true;
ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "category_id" integer REFERENCES "resource_categories"("id") ON DELETE SET NULL;

INSERT INTO "resource_categories" ("name", "slug", "sort_order")
VALUES
  ('Past Papers', 'past_paper', 0),
  ('Holiday Work', 'holiday_work', 1),
  ('Application Forms', 'application_form', 2)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "resources" r
SET "category_id" = c."id"
FROM "resource_categories" c
WHERE r."category_id" IS NULL AND r."category" = c."slug";

CREATE TABLE IF NOT EXISTS "news_items" (
  "id" serial PRIMARY KEY,
  "message" text NOT NULL,
  "is_visible" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "gallery_images" (
  "id" serial PRIMARY KEY,
  "caption" text NOT NULL,
  "category" text NOT NULL DEFAULT 'campus',
  "object_path" text NOT NULL,
  "wide" boolean NOT NULL DEFAULT false,
  "is_visible" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "testimonials" (
  "id" serial PRIMARY KEY,
  "quote" text NOT NULL,
  "name" text NOT NULL,
  "role" text NOT NULL DEFAULT '',
  "initials" text NOT NULL DEFAULT '',
  "is_visible" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "videos" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "category" text NOT NULL DEFAULT 'Featured',
  "youtube_id" text NOT NULL,
  "is_visible" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "programmes" (
  "id" serial PRIMARY KEY,
  "tag" text NOT NULL DEFAULT '',
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "subjects" text[] NOT NULL DEFAULT '{}',
  "object_path" text NOT NULL DEFAULT '',
  "is_visible" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stats" (
  "id" serial PRIMARY KEY,
  "value" text NOT NULL,
  "label" text NOT NULL,
  "is_visible" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "school_values" (
  "id" serial PRIMARY KEY,
  "icon" text NOT NULL DEFAULT '',
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "is_visible" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "admission_steps" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "is_visible" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "site_text" (
  "id" serial PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "label" text NOT NULL,
  "value" text NOT NULL DEFAULT '',
  "multiline" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "form_submissions" (
  "id" serial PRIMARY KEY,
  "type" text NOT NULL DEFAULT 'enquiry',
  "first_name" text NOT NULL,
  "last_name" text,
  "email" text,
  "phone" text,
  "level" text,
  "message" text,
  "file_url" text,
  "file_name" text,
  "status" text NOT NULL DEFAULT 'new',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "form_submissions_type_check" CHECK ("type" IN ('enquiry', 'application')),
  CONSTRAINT "form_submissions_status_check" CHECK ("status" IN ('new', 'read'))
);

CREATE TABLE IF NOT EXISTS "stored_objects" (
  "object_path" text PRIMARY KEY,
  "content_type" text NOT NULL DEFAULT 'application/octet-stream',
  "file_name" text NOT NULL DEFAULT 'download',
  "byte_size" integer NOT NULL DEFAULT 0,
  "data" bytea NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
`;

try {
  await Promise.race([
    pool.query(schemaSql),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("schema setup timed out after 15s")), 15_000),
    ),
  ]);
  console.log("Database schema is ready.");
} catch (err) {
  console.error("Setup failed (continuing so the web server can start):", err);
} finally {
  try {
    await pool.end();
  } catch {
    // ignore
  }
  process.exit(0);
}
