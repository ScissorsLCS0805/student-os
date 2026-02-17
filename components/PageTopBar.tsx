"use client";

import { useRouter } from "next/navigation";

export default function PageTopBar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();

  return (
    <div className="topbar">
      <div className="topbarInner">
        <button className="btn" onClick={() => router.back()} aria-label="Back">
          ← 返回
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <h1 className="h1">{title}</h1>
          {subtitle ? <div className="small">{subtitle}</div> : null}
        </div>

        <div style={{ marginLeft: "auto" }} className="muted">
          Student OS
        </div>
      </div>
    </div>
  );
}
