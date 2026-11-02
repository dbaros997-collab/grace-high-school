import { useState } from "react";
import { AdminShell, type AdminNavItem } from "@/components/AdminShell";
import { DashboardContent } from "@/pages/DashboardContent";

const NAV: AdminNavItem[] = [
  { id: "news", label: "News Ticker" },
  { id: "stats", label: "Stats" },
  { id: "gallery", label: "Gallery" },
  { id: "videos", label: "Videos" },
  { id: "programmes", label: "Programmes" },
  { id: "values", label: "Values" },
  { id: "admissions", label: "Admissions" },
  { id: "section-text", label: "Section Text" },
  { id: "resources", label: "Resources" },
  { id: "applications", label: "Applications" },
  { id: "enquiries", label: "Enquiries" },
  { id: "testimonials", label: "Testimonials" },
];

export default function Dashboard() {
  const [active, setActive] = useState("gallery");
  const current = NAV.find((n) => n.id === active);

  return (
    <AdminShell items={NAV} activeId={active} onNavigate={setActive}>
      {current ? (
        <p className="mb-4 text-sm text-muted-foreground md:hidden">{current.label}</p>
      ) : null}
      <div className="mx-auto max-w-4xl">
        <DashboardContent section={active} />
      </div>
    </AdminShell>
  );
}
