"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "主畫面", icon: "🏠" },
  { href: "/exams", label: "考試", icon: "📊" },
  { href: "/assignments", label: "作業", icon: "📝" },
  { href: "/projects", label: "報告", icon: "👥" },
  { href: "/schedule", label: "課表", icon: "📅" },
  { href: "/calendar", label: "週日曆", icon: "🗓" },
  { href: "/settings", label: "設定", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="card" style={{ padding: 14 }}>
      <div className="small" style={{ fontWeight: 900, letterSpacing: 0.5 }}>
        MENU
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className="row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                background: active ? "#0f172a" : undefined,
                color: active ? "#fff" : undefined,
                borderColor: active ? "#0f172a" : undefined,
              }}
            >
              <span>{it.icon}</span>
              <span style={{ fontWeight: 900 }}>{it.label}</span>
              <span style={{ marginLeft: "auto", opacity: active ? 0.9 : 0.35 }}>
                →
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
