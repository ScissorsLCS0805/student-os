"use client";

import { useEffect, useMemo, useState } from "react";
import PageTopBar from "@/components/PageTopBar";
import {
  AssignmentItem,
  ExamItem,
  KEYS,
  ProjectItem,
  ScheduleItem,
  loadJSON,
  saveJSON,
  ensureSettingsInitialized,
  DEFAULT_SETTINGS,
} from "@/lib/storage";
import type { IcsEvent } from "@/lib/ics";

// --- 定義學期精確日期 ---
const SEM_START_STR = "2026-02-23";
const SEM_END_STR = "2026-06-26";

function pad2(n: number) { return String(n).padStart(2, "0"); }
function fmtYMD(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

// 將 "YYYY-MM-DD" 轉為純數字以便精確比對
function dateToNum(dateStr: string) {
  return parseInt(dateStr.replace(/-/g, ""), 10);
}

function getSemesterWeek(d: Date) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const s = new Date(2026, 1, 23).getTime(); // 2026-02-23
  const diffDays = Math.floor((t - s) / 86400000);
  if (diffDays < 0) return null;
  const w = Math.floor(diffDays / 7) + 1;
  return w > 18 ? null : w;
}

function startOfWeekMonday(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const WEEK_NAMES = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

export default function CalendarPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [gMonthEvents, setGMonthEvents] = useState<IcsEvent[]>([]);
  
  const [viewDate, setViewDate] = useState(new Date()); 

  // --- 修改處：智慧初始化週日曆基準日 ---
  const [baseMonday, setBaseMonday] = useState(() => {
    const today = new Date();
    const todayNum = dateToNum(fmtYMD(today));
    const sNum = dateToNum(SEM_START_STR);
    const eNum = dateToNum(SEM_END_STR);

    if (todayNum < sNum) {
      // 尚未開學，預設顯示第一週
      return new Date(2026, 1, 23);
    } else if (todayNum > eNum) {
      // 學期已結束，預設顯示最後一週的週一
      return startOfWeekMonday(new Date(2026, 5, 22));
    } else {
      // 學期進行中，顯示今日所在的週一
      return startOfWeekMonday(today);
    }
  });
  
  const [sideOpen, setSideOpen] = useState(false);
  const [sideDate, setSideDate] = useState("");

  useEffect(() => {
    setExams(loadJSON(KEYS.exams, []));
    setAssignments(loadJSON(KEYS.assignments, []));
    setProjects(loadJSON(KEYS.projects, []));
    
    const rawSchedule = loadJSON<ScheduleItem[]>(KEYS.schedule, []);
    let needsUpdate = false;
    const migrated = rawSchedule.map(s => {
      if (!s.semester) {
        needsUpdate = true;
        return { ...s, semester: "114-2" };
      }
      return s;
    });
    if (needsUpdate) saveJSON(KEYS.schedule, migrated);
    setSchedule(migrated);
  }, []);

  const weekNumber = useMemo(() => getSemesterWeek(baseMonday), [baseMonday]);
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const gridStart = startOfWeekMonday(monthStart);
  
  const monthDays = useMemo(() => {
    const arr: Date[] = [];
    let cur = new Date(gridStart);
    for (let i = 0; i < 42; i++) {
      arr.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    return arr;
  }, [gridStart]);

  useEffect(() => {
    const settings = ensureSettingsInitialized();
    const urls = (settings.icsUrls || DEFAULT_SETTINGS.icsUrls).filter(Boolean);
    if (urls.length === 0) return;
    const from = fmtYMD(monthDays[0]);
    const to = fmtYMD(monthDays[41]);
    (async () => {
      try {
        const all: IcsEvent[] = [];
        for (const url of urls) {
          const res = await fetch(`/api/ics?url=${encodeURIComponent(url)}&from=${from}&to=${to}`);
          const json = await res.json();
          if (json.ok) all.push(...json.events);
        }
        setGMonthEvents(all);
      } catch (e) { console.error(e); }
    })();
  }, [monthDays]);

  const allEventsMap = useMemo(() => {
    const map = new Map<string, { deadlines: any[], classes: ScheduleItem[], gcal: IcsEvent[] }>();
    
    const relevantDates = [...monthDays];
    for(let i=0; i<7; i++) relevantDates.push(addDays(baseMonday, i));
    
    relevantDates.forEach(d => {
      const s = fmtYMD(d);
      if (!map.has(s)) map.set(s, { deadlines: [], classes: [], gcal: [] });
    });

    exams.forEach(e => e.date && map.get(e.date)?.deadlines.push({ ...e, type: "考試" }));
    assignments.forEach(a => a.due && map.get(a.due)?.deadlines.push({ ...a, type: "作業" }));
    projects.forEach(p => p.due && map.get(p.due)?.deadlines.push({ ...p, type: "報告" }));

    const sNum = dateToNum(SEM_START_STR);
    const eNum = dateToNum(SEM_END_STR);

    map.forEach((val, dateStr) => {
      const dNum = dateToNum(dateStr);
      const isIn1142Range = dNum >= sNum && dNum <= eNum;
      const d = new Date(dateStr);
      const weekday = d.getDay() === 0 ? 7 : d.getDay();

      val.classes = schedule.filter(s => {
        if (s.weekday !== weekday) return false;
        if (s.semester === "114-2") return isIn1142Range;
        return true; 
      }).sort((a,b) => a.start.localeCompare(b.start));

      val.gcal = gMonthEvents.filter(ev => ev.startDate === dateStr);
    });
    return map;
  }, [monthDays, baseMonday, exams, assignments, projects, schedule, gMonthEvents]);

  return (
    <div className="page">
      <PageTopBar title="🗓 學期行事曆" subtitle="週日曆已優化為自動顯示今日所在週次。" />
      
      <div className="container" style={{ display: "grid", gap: 20 }}>
        <div className="card">
          <div className="cardHeader">
            <div>
              <h2 className="cardTitle">
                {weekNumber ? `114-2 學期 第 ${weekNumber} 週` : "非學期期間"} 
              </h2>
              <div className="small">{fmtYMD(baseMonday)} ~ {fmtYMD(addDays(baseMonday, 6))}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => setBaseMonday(addDays(baseMonday, -7))}>上週</button>
              <button className="btn" onClick={() => setBaseMonday(startOfWeekMonday(new Date()))}>回到本週</button>
              <button className="btn" onClick={() => setBaseMonday(addDays(baseMonday, 7))}>下週</button>
            </div>
          </div>
          
          <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {WEEK_NAMES.map((name, i) => {
              const d = addDays(baseMonday, i);
              const s = fmtYMD(d);
              const data = allEventsMap.get(s);
              const isToday = s === fmtYMD(new Date());
              
              return (
                <div key={s} className="row" style={{ 
                  minHeight: 280, 
                  background: isToday ? "#f0f7ff" : "#fff", 
                  padding: "10px 8px", 
                  border: isToday ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                  flexDirection: "column",
                  alignItems: "stretch"
                }}>
                  <div style={{ fontWeight: 900, borderBottom: "1px solid #eee", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>{name}</span>
                    <span className="small">{d.getDate()}</span>
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {data?.classes.map(c => (
                      <div key={c.id} style={{ fontSize: 10, background: "#dbeafe", color: "#1e40af", padding: "3px 6px", borderRadius: 4 }}>
                        <b>{c.start}</b> {c.title}
                      </div>
                    ))}
                    {data?.deadlines.map((d, j) => (
                      <div key={j} style={{ fontSize: 10, background: "#fee2e2", color: "#b91c1c", padding: "3px 6px", borderRadius: 4 }}>
                        🚩 {d.title}
                      </div>
                    ))}
                    {data?.gcal.map((g, j) => (
                      <div key={j} style={{ fontSize: 10, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "3px 6px", borderRadius: 4 }}>
                        🌐 {g.summary}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <h2 className="cardTitle">{currentYear} 年 {currentMonth + 1} 月</h2>
            <div style={{ display: "flex", gap: 5 }}>
              <button className="btn" onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}>‹</button>
              <button className="btn" onClick={() => setViewDate(new Date())}>今天</button>
              <button className="btn" onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}>›</button>
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {WEEK_NAMES.map(w => <div key={w} className="small" style={{ textAlign: "center", fontWeight: 800 }}>{w.slice(1)}</div>)}
            {monthDays.map(d => {
              const s = fmtYMD(d);
              const isToday = s === fmtYMD(new Date());
              const data = allEventsMap.get(s);
              const hasClasses = (data?.classes.length || 0) > 0;
              
              return (
                <button 
                  key={s} 
                  onClick={() => { setSideDate(s); setSideOpen(true); }} 
                  className="row" 
                  style={{ 
                    height: 70, 
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    opacity: d.getMonth() === currentMonth ? 1 : 0.3, 
                    background: isToday ? "#1e40af" : "#fff", 
                    color: isToday ? "#fff" : "#000",
                    position: "relative",
                    border: "1px solid #f1f5f9"
                  }}
                >
                  <span style={{ fontWeight: 800, alignSelf: "flex-start" }}>{d.getDate()}</span>
                  <div style={{ display: "flex", gap: 2, marginTop: "auto" }}>
                    {hasClasses && <div style={{ width: 5, height: 5, background: isToday ? "#fff" : "#3b82f6", borderRadius: "50%" }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {sideOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", justifyContent: "flex-end" }} onClick={() => setSideOpen(false)}>
          <div className="card" style={{ width: 350, height: "100%", borderRadius: 0, padding: 20 }} onClick={e => e.stopPropagation()}>
            <div className="cardHeader">
              <h3>{sideDate} 行程細節</h3>
              <button className="btn btnDanger" onClick={() => setSideOpen(false)}>關閉</button>
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              {allEventsMap.get(sideDate)?.classes.map((c, i) => (
                <div key={i} className="row">⏰ {c.start} - {c.end} <b>{c.title}</b></div>
              ))}
              {allEventsMap.get(sideDate)?.deadlines.map((d, i) => (
                <div key={i} className="row">🚩 {d.title}</div>
              ))}
              {allEventsMap.get(sideDate)?.gcal.map((g, i) => (
                <div key={i} className="row">🌐 {g.summary}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}