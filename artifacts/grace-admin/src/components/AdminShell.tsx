import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSiteConnection } from "@/hooks/useSiteConnection";

export type AdminNavItem = {
  id: string;
  label: string;
  description?: string;
};

type AdminShellProps = {
  items: AdminNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
};

export function AdminShell({
  items,
  activeId,
  onNavigate,
  children,
}: AdminShellProps) {
  const connection = useSiteConnection();
  const db = connection.data?.database;
  const connected = connection.data?.ok && db === "connected";

  return (
    <div className="flex min-h-screen bg-[#f4f7f5] text-emerald-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-emerald-900/10 bg-[#0a4020] text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/80">
            Grace High School
          </p>
          <h1 className="mt-1 text-lg font-semibold leading-tight">Staff Dashboard</h1>
          <p className="mt-2 text-xs text-emerald-100/70">
            Updates publish to the public website on save.
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                activeId === item.id
                  ? "bg-white/15 font-medium text-white"
                  : "text-emerald-100/90 hover:bg-white/10",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs text-emerald-100/80">
          API: same host <code className="text-emerald-200">/api</code>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-emerald-900/10 bg-white/95 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="md:hidden">
              <p className="text-sm font-semibold text-emerald-900">Grace Staff Dashboard</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  connected
                    ? "bg-emerald-100 text-emerald-900"
                    : connection.isLoading
                      ? "bg-amber-100 text-amber-900"
                      : "bg-red-100 text-red-900",
                )}
              >
                {connected
                  ? "Website connected"
                  : connection.isLoading
                    ? "Checking API…"
                    : db === "render_url"
                      ? "Replace Render DATABASE_URL"
                      : "Database not ready"}
              </span>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-emerald-800/20 px-3 py-1.5 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
              >
                View public site
              </a>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto border-t border-emerald-900/5 px-2 py-2 md:hidden">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                  activeId === item.id
                    ? "bg-emerald-800 text-white"
                    : "bg-emerald-100 text-emerald-900",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {!connected && !connection.isLoading && connection.data?.hint ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-6">
            {connection.data.hint}
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
