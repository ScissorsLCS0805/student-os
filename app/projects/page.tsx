// app/projects/page.tsx 完整程式碼內容

"use client";

import { useEffect, useMemo, useState } from "react";
import PageTopBar from "@/components/PageTopBar";
import { COURSES } from "@/lib/courses";
import {
  ProjectItem,
  KEYS,
  loadJSON,
  saveJSON,
  uid,
} from "@/lib/storage";

export default function ProjectsPage() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState<string>(COURSES[0]);
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");

  // 子任務暫存狀態
  const [taskText, setTaskText] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  useEffect(() => {
    setItems(loadJSON<ProjectItem[]>(KEYS.projects, []));
  }, []);

  function persist(next: ProjectItem[]) {
    const updated = next.map(proj => {
      const tasks = proj.tasks || [];
      if (tasks.length === 0) return { ...proj, progress: 0 };
      const doneCount = tasks.filter(t => t.done).length;
      return { ...proj, progress: Math.round((doneCount / tasks.length) * 100) };
    });
    setItems(updated);
    saveJSON(KEYS.projects, updated);
  }

  function addProject() {
    if (!title.trim()) return;
    const next: ProjectItem[] = [
      {
        id: uid("proj"),
        title: title.trim(),
        course: course,
        due: due.trim() || undefined,
        progress: 0,
        note: note.trim() || undefined,
        tasks: [],
      },
      ...items,
    ];
    persist(next);
    setTitle(""); setDue(""); setNote("");
  }

  function removeProject(id: string) {
    persist(items.filter((x) => x.id !== id));
  }

  function addTask(projId: string) {
    if (!taskText.trim()) return;
    const next = items.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          tasks: [...(p.tasks || []), { 
            id: uid("tk"), 
            text: taskText.trim(), 
            done: false, 
            assignee: taskAssignee.trim() || undefined 
          }]
        };
      }
      return p;
    });
    persist(next);
    setTaskText("");
    setTaskAssignee("");
  }

  function toggleTask(projId: string, taskId: string) {
    const next = items.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, done: !t.done } : t)
        };
      }
      return p;
    });
    persist(next);
  }

  function removeTask(projId: string, taskId: string) {
    const next = items.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          tasks: (p.tasks || []).filter(t => t.id !== taskId)
        };
      }
      return p;
    });
    persist(next);
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31"));
  }, [items]);

  return (
    <div className="page">
      <PageTopBar title="👥 團體報告分工" subtitle="選取課程並指派組員負責特定任務，系統會自動統計進度。" />

      <div className="container">
        <div className="grid" style={{ gap: 14 }}>
          {/* 新增報告 */}
          <div className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">建立新報告</h2>
              <span className="badge">報告設定</span>
            </div>

            <div className="grid grid2">
              <div className="field">
                <div className="label">課程歸屬</div>
                <select className="select" value={course} onChange={(e) => setCourse(e.target.value)}>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="field">
                <div className="label">報告名稱</div>
                <input className="input" placeholder="期末專案、個案分析..." value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="field">
                <div className="label">截止日期</div>
                <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>

              <div className="field">
                <div className="label">備註</div>
                <input className="input" placeholder="小組組員、繳交方式..." value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn btnPrimary" onClick={addProject}>建立報告卡片</button>
            </div>
          </div>

          {/* 報告清單 */}
          {sorted.map(proj => (
            <div key={proj.id} className="card">
              <div className="cardHeader">
                <div>
                  <div className="badge" style={{ marginBottom: 6 }}>{proj.course}</div>
                  <h2 className="cardTitle">{proj.title}</h2>
                  <div className="small">截止：{proj.due || "未填"} {proj.note ? `｜ ${proj.note}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="badge">{proj.progress}%</span>
                  <button className="btn btnDanger" onClick={() => removeProject(proj.id)}>刪除</button>
                </div>
              </div>

              <div className="progressWrap" style={{ margin: "12px 0" }}>
                <div className="progressBar" style={{ width: `${proj.progress}%` }} />
              </div>

              {/* 任務與分工 */}
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 12, display: "grid", gap: 10 }}>
                <div className="label">組員分工清單</div>
                
                <div style={{ display: "grid", gap: 6 }}>
                  {(proj.tasks || []).map(task => (
                    <div key={task.id} className="row" style={{ background: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="checkbox" checked={task.done} onChange={() => toggleTask(proj.id, task.id)} />
                      <span style={{ flex: 1, textDecoration: task.done ? "line-through" : "none" }}>
                        {task.text}
                      </span>
                      {task.assignee && <span className="badge badgeOk">👤 {task.assignee}</span>}
                      <button className="btn btnDanger" style={{ padding: "4px 8px" }} onClick={() => removeTask(proj.id, task.id)}>×</button>
                    </div>
                  ))}
                </div>

                <div className="grid grid2" style={{ gap: 8 }}>
                  <input 
                    className="input" 
                    placeholder="任務內容 (如：製作PPT)" 
                    value={taskText} 
                    onChange={(e) => setTaskText(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input 
                      className="input" 
                      placeholder="負責組員" 
                      value={taskAssignee} 
                      onChange={(e) => setTaskAssignee(e.target.value)}
                    />
                    <button className="btn btnPrimary" onClick={() => addTask(proj.id)}>指派</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}