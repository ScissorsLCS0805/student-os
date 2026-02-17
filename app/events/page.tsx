"use client";

import { useEffect, useState, useMemo } from "react";
import PageTopBar from "@/components/PageTopBar";
import { KEYS, EventItem, loadJSON, saveJSON, uid } from "@/lib/storage";

const CATEGORIES = ['代辦', '會議', '聚餐', '採購', '其他'] as const;

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('代辦');

  useEffect(() => {
    setItems(loadJSON<EventItem[]>(KEYS.events, []));
  }, []);

  function addEvent() {
    if (!title.trim() || !date) return;
    const next: EventItem[] = [
      {
        id: uid("ev"),
        title: title.trim(),
        date,
        time: time || undefined,
        category,
        done: false,
      },
      ...items,
    ];
    setItems(next);
    saveJSON(KEYS.events, next);
    setTitle(""); setTime("");
  }

  function toggleEvent(id: string) {
    const next = items.map(it => it.id === id ? { ...it, done: !it.done } : it);
    setItems(next);
    saveJSON(KEYS.events, next);
  }

  function removeEvent(id: string) {
    const next = items.filter(it => it.id !== id);
    setItems(next);
    saveJSON(KEYS.events, next);
  }

  const sortedEvents = useMemo(() => {
    return [...items].sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  }, [items]);

  return (
    <div className="page">
      <PageTopBar title="🔔 事件與提醒系統" subtitle="管理所有聚餐、會議、採購與不限日期的代辦事項。" />
      <div className="container">
        <div className="card">
          <div className="cardHeader"><h2 className="cardTitle">新增事件</h2></div>
          <div className="grid grid2">
            <div className="field">
              <div className="label">事件名稱</div>
              <input className="input" placeholder="如：好市多採購、小組會議" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">分類</div>
              <select className="select" value={category} onChange={e => setCategory(e.target.value as any)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="label">日期</div>
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">時間 (選填)</div>
              <input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <button className="btn btnPrimary" style={{ marginTop: 12 }} onClick={addEvent}>＋ 新增事件</button>
        </div>

        <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
          {sortedEvents.map(it => (
            <div key={it.id} className="row" style={{ opacity: it.done ? 0.6 : 1 }}>
              <input type="checkbox" checked={it.done} onChange={() => toggleEvent(it.id)} />
              <div style={{ flex: 1, marginLeft: 10 }}>
                <span className="badge" style={{ marginRight: 8 }}>{it.category}</span>
                <b style={{ textDecoration: it.done ? "line-through" : "none" }}>{it.title}</b>
                <div className="small muted">{it.date} {it.time || ""}</div>
              </div>
              <button className="btn btnDanger" onClick={() => removeEvent(it.id)}>刪除</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}