"use client";

import { useEffect, useMemo, useState } from "react";
import PageTopBar from "@/components/PageTopBar";
import { COURSES } from "@/lib/courses";

import {
  ExamItem,
  KEYS,
  loadJSON,
  saveJSON,
  uid,
  clampProgress,
  daysUntil,
} from "@/lib/storage";

function urgencyRank(date?: string) {
  const d = daysUntil(date || undefined);
  if (d === null) return 50;
  if (d < 0) return 90;
  if (d <= 2) return 0;
  if (d <= 7) return 10;
  return 30;
}

function badgeFor(date?: string) {
  const d = daysUntil(date || undefined);
  if (d === null) return { cls: "badge", text: "未填日期" };
  if (d < 0) return { cls: "badge badgeDanger", text: `已過期（${Math.abs(d)}天前）` };
  if (d <= 2) return { cls: "badge badgeDanger", text: `緊急（剩 ${d} 天）` };
  if (d <= 7) return { cls: "badge badgeWarn", text: `即將（剩 ${d} 天）` };
  return { cls: "badge", text: `剩 ${d} 天` };
}

export default function ExamsPage() {
  const [items, setItems] = useState<ExamItem[]>([]);

  // add form
  const [course, setCourse] = useState<string>(COURSES[0]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [note, setNote] = useState("");

  // edit form
  const [editId, setEditId] = useState<string>("");
  const [eCourse, setECourse] = useState<string>(COURSES[0]);
  const [eTitle, setETitle] = useState("");
  const [eDate, setEDate] = useState("");
  const [eProgress, setEProgress] = useState<number>(0);
  const [eNote, setENote] = useState("");

  useEffect(() => {
    setItems(loadJSON<ExamItem[]>(KEYS.exams, []));
  }, []);

  function persist(next: ExamItem[]) {
    setItems(next);
    saveJSON(KEYS.exams, next);
  }

  function add() {
    const t = title.trim();
    if (!t) return;

    const next: ExamItem[] = [
      {
        id: uid("exam"),
        course: course,
        title: t,
        date: date.trim() || undefined,
        progress: clampProgress(Number(progress)),
        note: note.trim() || undefined,
      },
      ...items,
    ];

    persist(next);
    setTitle("");
    setDate("");
    setProgress(0);
    setNote("");
  }

  function remove(id: string) {
    if (editId === id) setEditId("");
    persist(items.filter((x) => x.id !== id));
  }

  function beginEdit(x: ExamItem) {
    setEditId(x.id);
    setECourse(x.course || COURSES[0]);
    setETitle(x.title);
    setEDate(x.date || "");
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
              date: eDate.trim() || undefined,
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
      const ra = urgencyRank(a.date);
      const rb = urgencyRank(b.date);
      if (ra !== rb) return ra - rb;
      const da = a.date || "9999-12-31";
      const db = b.date || "9999-12-31";
      if (da !== db) return da.localeCompare(db);
      return (a.progress ?? 0) - (b.progress ?? 0);
    });
  }, [items]);

  return (
    <div className="page">
      <PageTopBar title="📊 考試" subtitle="到期徽章 + 自動排序 + 課程下拉 + 編輯/刪除。" />

      <div className="container">
        <div className="grid" style={{ gap: 14 }}>
          <div className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">新增考試</h2>
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
                <div className="label">考試名稱</div>
                <input className="input" placeholder="例如：期中考" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="field">
                <div className="label">考試日期（可空）</div>
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="field">
                <div className="label">複習進度（0~100）</div>
                <input className="input" type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="label">備註（可空）</div>
                <input className="input" placeholder="例如：範圍第 1-4 章，重點 CAPM" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button className="btn btnPrimary" onClick={add}>＋ 新增</button>
              <button className="btn" onClick={() => { setTitle(""); setDate(""); setProgress(0); setNote(""); }}>清空</button>
            </div>
          </div>

          <div className="card">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">考試清單</h2>
                <div className="small">最急的會自動排最上面。</div>
              </div>
              <span className="badge">可編輯</span>
            </div>

            {sorted.length === 0 ? (
              <div className="row">目前沒有考試，先新增一筆吧。</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {sorted.map((x) => {
                  const b = badgeFor(x.date);
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
                                {x.date ? `日期：${x.date}` : "日期：未填"} {x.note ? `｜備註：${x.note}` : ""}
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
                              <div className="label">考試名稱</div>
                              <input className="input" value={eTitle} onChange={(e) => setETitle(e.target.value)} />
                            </div>

                            <div className="field">
                              <div className="label">日期</div>
                              <input className="input" type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} />
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
