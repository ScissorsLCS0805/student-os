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
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: "12px", fontWeight: 600 }}>{label}</div>
        <div className="muted" style={{ fontSize: "12px" }}>{p}%</div>
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
  const [mounted, setMounted] = useState(false);
  
  // 新增：控制側邊欄收合狀態
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
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
  const filterFn = (item: any) => item.title.toLowerCase().includes(q) || (item.course && item.course.toLowerCase().includes(q));
  
  const topExams = useMemo(() => exams.filter(filterFn).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999")).slice(0, 3), [exams, q]);
  const topAssignments = useMemo(() => assignments.filter(filterFn).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")).slice(0, 3), [assignments, q]);
  const topProjects = useMemo(() => projects.filter(filterFn).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")).slice(0, 3), [projects, q]);

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

  if (!mounted) return null;

  return (
    <div className="page">
      {/* 手機版側邊欄遮罩 */}
      {isSidebarOpen && (
        <div 
          className="sidebarOverlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="topbar">
        <div className="topbarInner">
          <div className="logoArea">
            {/* 新增：左上角漢堡按鈕 */}
            <button 
              className="menuBtn" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              ☰
            </button>
            <div style={{ fontSize: 24 }}>🎓</div>
            <h1 className="h1">Student OS</h1>
          </div>
          <div className="searchArea">
            <input className="input searchInput" placeholder="🔍 搜尋任務或課程..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="userArea">
            <div className="timeDisplay">
              <div className="timeFullDate">{timeInfo.fullDate}</div>
              <div className="timeClock muted">{timeInfo.time}</div>
            </div>
            <button className="btn btnDanger btnLogout" onClick={handleLogout}>登出</button>
          </div>
        </div>
      </div>

      <div className="container dashboardGrid">
        {/* 左側欄位 - 增加 active 控制顯示 */}
        <div className={`dashboardSide ${isSidebarOpen ? 'active' : ''}`}>
          <Sidebar />
          <div className="card externalLinksCard">
            <div className="cardHeader"><h3 className="cardTitle">🔗 常用外部連結</h3></div>
            <div className="externalLinks">
              <a href="https://webapp.yuntech.edu.tw/YunTechSSO/Account/Login" target="_blank" className="btn linkBtn">雲科單一入口</a>
              <a href="https://webapp.yuntech.edu.tw/YunTechSSO/Forward/RedirectByType?Type=outlook" target="_blank" className="btn linkBtn">Outlook 信箱</a>
              <a href="https://umf.yuntech.edu.tw/" target="_blank" className="btn linkBtn">雲科財金系網</a>
            </div>
          </div>
        </div>

        {/* 右側主要內容 */}
        <div className="dashboardMain">
          <div className="timeHeroCard">
             <div className="heroDate">{timeInfo.fullDate}</div>
             <div className="heroTime">{timeInfo.time}</div>
          </div>

          <div className="kpiGrid">
            <div className="card kpiCard">
              <div className="cardHeader"><div><div className="small">📊 考試</div><div className="kpi">{exams.length}</div></div></div>
            </div>
            <div className="card kpiCard">
              <div className="cardHeader"><div><div className="small">📝 作業</div><div className="kpi">{assignments.length}</div></div></div>
            </div>
            <div className="card kpiCard">
              <div className="cardHeader"><div><div className="small">👥 報告</div><div className="kpi">{projects.length}</div></div></div>
            </div>
          </div>

          <div className="card importantCard">
            <div className="cardHeader"><h2 className="cardTitle">🚩 本週重要截止</h2><Link href="/calendar" className="small">月曆 →</Link></div>
            {weeklyEvents.length === 0 ? <div className="muted">本週暫無重要事項。</div> : 
              <div className="eventList">
                {weeklyEvents.map((ev, i) => (
                  <div key={i} className="row eventRow">
                    <span><span className="badge">{ev.type}</span><b>{ev.title}</b> <span className="courseTag">{ev.courseDisplay ? `【${ev.courseDisplay}】` : "【通用】"}</span></span>
                    <span className="badge badgeDanger">{ev.date} (剩 {daysUntil(ev.date)} 天)</span>
                  </div>
                ))}
              </div>
            }
          </div>

          <div className="taskGrid">
            <div className="card">
              <div className="cardHeader"><h2 className="cardTitle">📊 未來考試</h2><Link className="btn btnSmall" href="/exams">更多</Link></div>
              {topExams.length === 0 ? <EmptyHint text="尚未新增考試" href="/exams" /> : 
                <div className="taskSubList">
                  {topExams.map((e) => (
                    <div key={e.id} className="row taskRow">
                      <div className="taskInfo">
                        <div className="taskTitle"><b>{e.title}</b></div>
                        <div className="courseTagSmall">{e.course ? `【${e.course}】` : "【通用】"}</div>
                        <div className="taskDate badge">{e.date}</div>
                      </div>
                      <ProgressRow label="複習進度" progress={e.progress} />
                    </div>
                  ))}
                </div>
              }
            </div>

            <div className="card">
              <div className="cardHeader"><h2 className="cardTitle">📝 待交作業</h2><Link className="btn btnSmall" href="/assignments">更多</Link></div>
              {topAssignments.length === 0 ? <EmptyHint text="尚未新增作業" href="/assignments" /> : 
                <div className="taskSubList">
                  {topAssignments.map((a) => (
                    <div key={a.id} className="row taskRow">
                      <div className="taskInfo">
                        <div className="taskTitle"><b>{a.title}</b></div>
                        <div className="courseTagSmall">{a.course ? `【${a.course}】` : "【通用】"}</div>
                        <div className="taskDate badge">{a.due}</div>
                      </div>
                      <ProgressRow label="完成進度" progress={a.progress} />
                    </div>
                  ))}
                </div>
              }
            </div>

            <div className="card">
              <div className="cardHeader"><h2 className="cardTitle">👥 團體報告</h2><Link className="btn btnSmall" href="/projects">更多</Link></div>
              {topProjects.length === 0 ? <EmptyHint text="尚未新增報告" href="/projects" /> : 
                <div className="taskSubList">
                  {topProjects.map((p) => (
                    <div key={p.id} className="row taskRow">
                      <div className="taskInfo">
                        <div className="taskTitle"><b>{p.title}</b></div>
                        <div className="courseTagSmall">{p.course ? `【${p.course}】` : "【通用】"}</div>
                        <div className="taskDate badge">{p.due}</div>
                      </div>
                      <ProgressRow label="進度" progress={p.progress} />
                    </div>
                  ))}
                </div>
              }
            </div>

            <div className="card">
              <div className="cardHeader"><h2 className="cardTitle">📅 今日課表</h2><Link className="btn btnSmall" href="/schedule">完整</Link></div>
              {todayItems.length === 0 ? <div className="row">今日無課。</div> : 
                <div className="taskSubList">
                  {todayItems.map((s) => (
                    <div key={s.id} className="row scheduleRow">
                      <div className="scheduleInfo">
                        <b>{s.start}–{s.end} {s.title}</b>
                        <div className="small muted">{s.location}</div>
                      </div>
                      <span className="badge badgeOk">今日</span>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>

          <div className="card notificationCard">
            <div className="cardHeader"><h2 className="cardTitle">🔔 即將到來的提醒</h2><Link href="/events" className="btn btnSmall">管理</Link></div>
            <div className="eventReminderList">
              {upcomingEvents.length === 0 ? <div className="row">目前無待辦。</div> : 
                upcomingEvents.map((ev) => (
                  <div key={ev.id} className="row eventReminderRow" style={{ opacity: ev.done ? 0.6 : 1 }}>
                    <input type="checkbox" checked={ev.done} onChange={() => toggleEvent(ev.id)} />
                    <div className="eventDetail">
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
  );
}