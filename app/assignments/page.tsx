"use client";

import { useEffect, useMemo, useState } from "react";
import PageTopBar from "@/components/PageTopBar";
import { COURSES } from "@/lib/courses";
import {
  AssignmentItem,
  KEYS,
  loadJSON,
  saveJSON,
  uid,
  clampProgress,
  daysUntil,
} from "@/lib/storage";

function urgencyRank(due?: string) {
  const d = daysUntil(due || undefined);
  if (d === null) return 50;
  if (d < 0) return 90;
  if (d <= 2) return 0;
  if (d <= 7) return 10;
  return 30;
}

function badgeFor(due?: string) {
  const d = daysUntil(due || undefined);
  if (d === null) return { cls: "badge", text: "未填截止" };
  if (d < 0) return { cls: "badge badgeDanger", text: `已過期（${Math.abs(d)}天前）` };
  if (d <= 2) return { cls: "badge badgeDanger", text: `緊急（剩 ${d} 天）` };
  if (d <= 7) return { cls: "badge badgeWarn", text: `即將（剩 ${d} 天）` };
  return { cls: "badge", text: `剩 ${d} 天` };
}

export default function AssignmentsPage() {
  const [items, setItems] = useState<AssignmentItem[]>([]);

  // add
  const [course, setCourse] = useState<string>(COURSES[0]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [note, setNote] = useState("");

  // edit
  const [editId, setEditId] = useState<string>("");
  const [eCourse, setECourse] = useState<string>(COURSES[0]);
  const [eTitle, setETitle] = useState("");
  const [eDue, setEDue] = useState("");
  const [eProgress, setEProgress] = useState<number>(0);
  const [eNote, setENote] = useState("");

  useEffect(() => {
    setItems(loadJSON<AssignmentItem[]>(KEYS.assignments, []));
  }, []);

  function persist(next: AssignmentItem[]) {
    setItems(next);
    saveJSON(KEYS.assignments, next);
  }

  function add() {
    const t = title.trim();
    if (!t) return;

    const next: AssignmentItem[] = [
      {
        id: uid("asg"),
        course,
        title: t,
        due: due.trim() || undefined,
        progress: clampProgress(Number(progress)),
        note: note.trim() || undefined,
      },
      ...items,
    ];

    persist(next);
    setTitle("");
    setDue("");
    setProgress(0);
    setNote("");
  }

  function remove(id: string) {
    if (editId === id) setEditId("");
    persist(items.filter((x) => x.id !== id));
  }

  function beginEdit(x: AssignmentItem) {
    setEditId(x.id);
    setECourse(x.course || COURSES[0]);
    setETitle(x.title);
    setEDue(x.due || "");
    setEProgress(x.progress || 0);
    setENote(x.note || "");
  }

  function cancelEdit() {
    setEditId("");
  }

  function saveEdit() {
    if (!editId) return;
    const t = eTitle.trim();
    if (!t) return;

    persist(
      items.map((x) =>
        x.id === editId
          ? {
              ...x,
              course: eCourse,
              title: t,
              due: eDue.trim() || undefined,
              progress: clampProgress(Number(eProgress)),
              note: eNote.trim() || undefined,
            }
          : x
      )
    );
    setEditId("");
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ra = urgencyRank(a.due);
      const rb = urgencyRank(b.due);
      if (ra !== rb) return ra - rb;
      const da = a.due || "9999-12-31";
      const db = b.due || "9999-12-31";
      if (da !== db) return da.localeCompare(db);
      return (a.progress ?? 0) - (b.progress ?? 0);
    });
  }, [items]);

  return (
    <div className="page">
      <PageTopBar title="📝 作業" subtitle="到期徽章 + 自動排序 + 課程下拉 + 編輯/刪除。" />

      <div className="container">
        <div className="grid" style={{ gap: 14 }}>
          <div className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">新增作業</h2>
              <span className="badge">localStorage</span>
            </div>

            <div className="grid grid2">
              <div className="field">
                <div className="label">課程</div>
                <select className="select" value={course} onChange={(e) => setCourse(e.target.value)}>
                  {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="field">
                <div className="label">作業名稱</div>
                <input className="input" placeholder="例如：作業 2 / 文獻整理" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="field">
                <div className="label">截止日期（可空）</div>
                <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>

              <div className="field">
                <div className="label">完成進度（0~100）</div>
                <input className="input" type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="label">備註（可空）</div>
                <input className="input" placeholder="例如：需要先整理 10 篇摘要" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button className="btn btnPrimary" onClick={add}>＋ 新增</button>
              <button className="btn" onClick={() => { setTitle(""); setDue(""); setProgress(0); setNote(""); }}>清空</button>
            </div>
          </div>

          <div className="card">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">作業清單</h2>
                <div className="small">最急的會自動排最上面。</div>
              </div>
              <span className="badge">可編輯</span>
            </div>

            {sorted.length === 0 ? (
              <div className="row">目前沒有作業，先新增一筆吧。</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {sorted.map((x) => {
                  const b = badgeFor(x.due);
                  const isEdit = editId === x.id;

                  return (
                    <div key={x.id} className="row" style={{ display: "grid", gap: 10 }}>
                      {!isEdit ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <div style={{ display: "grid", gap: 2 }}>
                              <div style={{ fontWeight: 900, fontSize: 15 }}>
                                {x.course ? `【${x.course}】` : ""} {x.title}
                              </div>
                              <div className="small">
                                {x.due ? `截止：${x.due}` : "截止：未填"} {x.note ? `｜備註：${x.note}` : ""}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span className={b.cls}>{b.text}</span>
                              <span className="badge">{x.progress}%</span>
                              <button className="btn" onClick={() => beginEdit(x)}>編輯</button>
                              <button className="btn btnDanger" onClick={() => remove(x.id)}>刪除</button>
                            </div>
                          </div>

                          <div className="progressWrap">
                            <div className="progressBar" style={{ width: `${x.progress}%` }} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid2">
                            <div className="field">
                              <div className="label">課程</div>
                              <select className="select" value={eCourse} onChange={(e) => setECourse(e.target.value)}>
                                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>

                            <div className="field">
                              <div className="label">作業名稱</div>
                              <input className="input" value={eTitle} onChange={(e) => setETitle(e.target.value)} />
                            </div>

                            <div className="field">
                              <div className="label">截止日期</div>
                              <input className="input" type="date" value={eDue} onChange={(e) => setEDue(e.target.value)} />
                            </div>

                            <div className="field">
                              <div className="label">進度</div>
                              <input className="input" type="number" min={0} max={100} value={eProgress} onChange={(e) => setEProgress(Number(e.target.value))} />
                            </div>

                            <div className="field" style={{ gridColumn: "1 / -1" }}>
                              <div className="label">備註</div>
                              <input className="input" value={eNote} onChange={(e) => setENote(e.target.value)} />
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btnPrimary" onClick={saveEdit}>儲存</button>
                            <button className="btn" onClick={cancelEdit}>取消</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
