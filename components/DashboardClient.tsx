"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import {
  AssignmentItem,
  ExamItem,
  KEYS,
  ProjectItem,
  ScheduleItem,
  EventItem,
  loadJSON,
  saveJSON,
  uid,
  daysUntil,
} from "@/lib/storage";

// --- 學期時間設定 (用於過濾今日課表) ---
const SEM_START_STR = "2026-02-23";
const SEM_END_STR = "2026-06-26";

function ProgressRow({ label, progress }: { label: string; progress: number }) {
  const p = Math.max(0, Math.min(100, Number(progress) || 0));
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 800 }}>{label}</div>
        <div className="muted">{p}%</div>
      </div>
      <div className="progressWrap" style={{ height: "6px" }}>
        <div className="progressBar" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function EmptyHint({ text, href }: { text: string; href: string }) {
  return (
    <div className="row" style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px" }}>
      <div style={{ flex: 1 }} className="muted">{text}</div>
      <Link className="btn btnPrimary" href={href} style={{ textDecoration: "none", fontSize: "12px" }}>
        立即新增
      </Link>
    </div>
  );
}

export default function DashboardClient() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  
  // 新增：解決 Hydration Error 的掛載檢查
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // 組件掛載後才渲染動態內容
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setExams(loadJSON<ExamItem[]>(KEYS.exams, []));
    setAssignments(loadJSON<AssignmentItem[]>(KEYS.assignments, []));
    setProjects(loadJSON<ProjectItem[]>(KEYS.projects, []));
    setSchedule(loadJSON<ScheduleItem[]>(KEYS.schedule, []));
    setEvents(loadJSON<EventItem[]>(KEYS.events, []));
  }, []);

  const handleLogout = () => {
    saveJSON(KEYS.auth, { isLoggedIn: false });
    router.push("/login");
  };

  const timeInfo = useMemo(() => {
    const hours = now.getHours();
    const h12 = hours % 12 || 12;
    const period = hours < 12 ? "上午" : hours < 18 ? "下午" : "晚上";
    const dateStr = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
    const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return { 
      fullDate: `${dateStr} ${weekDays[now.getDay()]}`, 
      time: `${period} ${h12}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}` 
    };
  }, [now]);

  const q = searchQuery.toLowerCase();
  const topExams = useMemo(() => exams.filter(e => e.title.toLowerCase().includes(q)).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999")).slice(0, 3), [exams, q]);
  const topAssignments = useMemo(() => assignments.filter(a => a.title.toLowerCase().includes(q)).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")).slice(0, 3), [assignments, q]);
  const topProjects = useMemo(() => projects.filter(p => p.title.toLowerCase().includes(q)).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")).slice(0, 3), [projects, q]);

  const weeklyEvents = useMemo(() => {
    const all = [
      ...exams.map(e => ({ ...e, type: "考試", date: e.date, courseDisplay: e.course })),
      ...assignments.map(a => ({ ...a, type: "作業", date: a.due, courseDisplay: a.course })),
      ...projects.map(p => ({ ...p, type: "報告", date: p.due, courseDisplay: p.course })),
    ];
    return all.filter(ev => {
      const d = daysUntil(ev.date);
      return d !== null && d >= 0 && d <= 7;
    }).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [exams, assignments, projects]);

  const upcomingEvents = useMemo(() => events.filter(e => !e.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5), [events]);

  const todayItems = useMemo(() => {
    const todayYMD = now.toISOString().split("T")[0].replace(/-/g, "");
    if (parseInt(todayYMD) < 20260223 || parseInt(todayYMD) > 20260626) return [];
    const weekday = now.getDay() === 0 ? 7 : now.getDay(); 
    return schedule.filter(s => s.weekday === weekday && s.semester === "114-2").sort((a, b) => a.start.localeCompare(b.start));
  }, [schedule, now]);

  const toggleEvent = (id: string) => {
    const next = events.map(e => e.id === id ? { ...e, done: !e.done } : e);
    setEvents(next);
    saveJSON(KEYS.events, next);
  };

  // 尚未掛載前回傳空內容，防止伺服器/客戶端時間衝突
  if (!mounted) return null;

  return (
    <div className="page">
      <div className="topbar" style={{ position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid #e2e8f0" }}>
        <div className="topbarInner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 24 }}>🎓</div>
            <h1 className="h1">Student OS</h1>
          </div>
          <div style={{ marginLeft: "40px", flex: 1, maxWidth: "400px" }}>
            <input className="input" placeholder="🔍 搜尋任務、考試或作業..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ borderRadius: "20px", padding: "8px 16px", background: "#f1f5f9", border: "none" }} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>{timeInfo.fullDate}</div>
              <div style={{ fontSize: "12px" }} className="muted">{timeInfo.time}</div>
            </div>
            <button className="btn btnDanger" onClick={handleLogout} style={{ padding: "6px 14px", borderRadius: "8px" }}>登出</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "20px" }}>
        <div className="grid" style={{ gridTemplateColumns: "1fr", alignItems: "start" }}>
          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14 }}>
              <div style={{ position: "sticky", top: 100, height: "fit-content" }}>
                <Sidebar />
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="cardHeader"><h3 className="cardTitle">🔗 常用外部連結</h3></div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <a href="https://webapp.yuntech.edu.tw/YunTechSSO/Account/Login" target="_blank" className="btn" style={{ textAlign: "left", fontSize: "13px" }}>雲科單一入口服務網</a>
                    <a href="https://webapp.yuntech.edu.tw/YunTechSSO/Forward/RedirectByType?Type=outlook" target="_blank" className="btn" style={{ textAlign: "left", fontSize: "13px" }}>Outlook 信箱</a>
                    <a href="https://umf.yuntech.edu.tw/" target="_blank" className="btn" style={{ textAlign: "left", fontSize: "13px" }}>雲科財金系網</a>
                  </div>
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 14 }}>
                <div className="card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", textAlign: "center", padding: "32px 0", borderRadius: "16px" }}>
                   <div style={{ fontSize: "18px", opacity: 0.8, marginBottom: 8 }}>{timeInfo.fullDate}</div>
                   <div style={{ fontSize: "42px", fontWeight: 900, letterSpacing: "1px" }}>{timeInfo.time}</div>
                </div>

                <div className="grid grid3">
                  <div className="card">
                    <div className="cardHeader"><div><div className="small">📊 考試</div><div className="kpi">{exams.length}</div></div><span className="badge">自動同步</span></div>
                  </div>
                  <div className="card">
                    <div className="cardHeader"><div><div className="small">📝 作業</div><div className="kpi">{assignments.length}</div></div><span className="badge">自動同步</span></div>
                  </div>
                  <div className="card">
                    <div className="cardHeader"><div><div className="small">👥 報告</div><div className="kpi">{projects.length}</div></div><span className="badge">自動同步</span></div>
                  </div>
                </div>

                <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
                  <div className="cardHeader"><h2 className="cardTitle">🚩 本週重要截止 (7天內)</h2><Link href="/calendar" className="small">完整月曆 →</Link></div>
                  {weeklyEvents.length === 0 ? <div className="muted">本週暫無重要事項。</div> : 
                    <div style={{ display: "grid", gap: 10 }}>
                      {weeklyEvents.map((ev, i) => (
                        <div key={i} className="row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span><span className="badge" style={{ marginRight: 8 }}>{ev.type}</span><b>{ev.title}</b> <span className="small muted">({(ev as any).courseDisplay || "通用"})</span></span>
                          <span className="badge badgeDanger">{ev.date} (剩 {daysUntil(ev.date)} 天)</span>
                        </div>
                      ))}
                    </div>
                  }
                </div>

                <div className="grid grid2">
                  <div className="card">
                    <div className="cardHeader"><h2 className="cardTitle">📊 未來考試</h2><Link className="btn" href="/exams">打開 →</Link></div>
                    {topExams.length === 0 ? <EmptyHint text="尚未新增考試" href="/exams" /> : 
                      <div style={{ display: "grid", gap: 12 }}>
                        {topExams.map((e) => (
                          <div key={e.id} className="row">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><div><b>{e.title}</b> <div className="small muted">{e.course || "通用"}</div></div><span className="badge">{e.date}</span></div>
                            <ProgressRow label="複習進度" progress={e.progress} />
                          </div>
                        ))}
                      </div>
                    }
                  </div>

                  <div className="card">
                    <div className="cardHeader"><h2 className="cardTitle">📝 作業</h2><Link className="btn" href="/assignments">打開 →</Link></div>
                    {topAssignments.length === 0 ? <EmptyHint text="尚未新增作業" href="/assignments" /> : 
                      <div style={{ display: "grid", gap: 12 }}>
                        {topAssignments.map((a) => (
                          <div key={a.id} className="row">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><div><b>{a.title}</b> <div className="small muted">{a.course || "通用"}</div></div><span className="badge">{a.due}</span></div>
                            <ProgressRow label="完成進度" progress={a.progress} />
                          </div>
                        ))}
                      </div>
                    }
                  </div>

                  <div className="card">
                    <div className="cardHeader"><h2 className="cardTitle">👥 團體報告</h2><Link className="btn" href="/projects">打開 →</Link></div>
                    {topProjects.length === 0 ? <EmptyHint text="尚未新增報告" href="/projects" /> : 
                      <div style={{ display: "grid", gap: 12 }}>
                        {topProjects.map((p) => (
                          <div key={p.id} className="row">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><div><b>{p.title}</b> <div className="small muted">{p.course || "通用"}</div></div><span className="badge">{p.due}</span></div>
                            <ProgressRow label="進度" progress={p.progress} />
                          </div>
                        ))}
                      </div>
                    }
                  </div>

                  <div className="card">
                    <div className="cardHeader"><h2 className="cardTitle">📅 今日課表</h2><Link className="btn" href="/schedule">打開 →</Link></div>
                    {todayItems.length === 0 ? <div className="row">今天沒有課 / 工讀</div> : 
                      <div style={{ display: "grid", gap: 10 }}>
                        {todayItems.map((s) => (
                          <div key={s.id} className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                            <div><b>{s.start}–{s.end} {s.title}</b><div className="small">{s.location}</div></div>
                            <span className="badge badgeOk">今日</span>
                          </div>
                        ))}
                      </div>
                    }
                  </div>
                </div>

                <div className="card">
                  <div className="cardHeader"><h2 className="cardTitle">🔔 即將到來的提醒與事件</h2><Link href="/events" className="btn">管理事件 →</Link></div>
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    {upcomingEvents.length === 0 ? <div className="row">目前沒有待辦事件。</div> : 
                      upcomingEvents.map((ev) => (
                        <div key={ev.id} className="row" style={{ display: "flex", alignItems: "center", gap: 12, opacity: ev.done ? 0.6 : 1 }}>
                          <input type="checkbox" checked={ev.done} onChange={() => toggleEvent(ev.id)} />
                          <div style={{ flex: 1 }}>
                            <span className="badge" style={{ marginRight: 8 }}>{ev.category}</span>
                            <b style={{ textDecoration: ev.done ? "line-through" : "none" }}>{ev.title}</b>
                            <div className="small muted">{ev.date} {ev.time || ""}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}