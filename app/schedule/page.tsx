"use client";

import { useEffect, useMemo, useState } from "react";
import PageTopBar from "@/components/PageTopBar";
import { KEYS, ScheduleItem, CourseMember, loadJSON, saveJSON, uid } from "@/lib/storage";

const WEEK = [
  { n: 1, name: "週一" }, { n: 2, name: "週二" }, { n: 3, name: "週三" },
  { n: 4, name: "週四" }, { n: 5, name: "週五" }, { n: 6, name: "週六" }, { n: 7, name: "週日" },
];

const INITIAL_COURSES_DETAIL: Partial<ScheduleItem>[] = [
  {
    title: "財務會計專題研討（二）",
    weekday: 3, start: "09:10", end: "12:00", location: "會計系館", semester: "114-2",
    courseCode: "114023902",
    dept: "會計系博士班 2 X",
    credits: "3.0",
    required: "選修",
    teacherInfo: "劉志良 (T10001191), 何里仁 (T10600791)",
    members: [
      { name: "劉志良", id: "T10001191", role: "教師" },
      { name: "何里仁", id: "T10600791", role: "教師" },
      { name: "羅晨松", id: "B11124008", role: "學生" },
      { name: "林淑惠", id: "D11325001", role: "學生" },
      { name: "Dian Indriana Hapsari", id: "D11325004", role: "學生" },
      { name: "Annisa Ilma Hartikasari", id: "D11325005", role: "學生" },
      { name: "DANG THI ANH DUONG", id: "D11325006", role: "學生" },
      { name: "Muamar Nur Kholid", id: "D11425003", role: "學生" },
      { name: "Nanik Niandari", id: "D11425004", role: "學生" },
    ]
  },
  {
    title: "國際科技與創新管理",
    weekday: 4, start: "09:10", end: "12:00", location: "企管系館", semester: "114-2",
    courseCode: "114023029",
    dept: "企業管理系碩士班 1 X",
    credits: "3.0",
    required: "選修",
    teacherInfo: "黃邦寧 (T10000991), 周啟陽 (T10704371)",
    members: [
      { name: "黃邦寧", id: "T10000991", role: "教師" },
      { name: "周啟陽", id: "T10704371", role: "教師" },
      { name: "羅晨松", id: "B11124008", role: "學生" },
      { name: "黃宇彣", id: "M11322307", role: "學生" },
      { name: "DOAN HOANG BICH NGOC", id: "M11322335", role: "學生" },
      { name: "黃蕾", id: "M11422212", role: "學生" },
      { name: "李依宸", id: "M11422302", role: "學生" },
      { name: "何旻軒", id: "M11422303", role: "學生" },
      { name: "楊晏禎", id: "M11422304", role: "學生" },
      { name: "林昀潔", id: "M11422305", role: "學生" },
      { name: "陳郁婷", id: "M11422306", role: "學生" },
      { name: "吳允心", id: "M11422307", role: "學生" },
      { name: "林佳縈", id: "M11422309", role: "學生" },
      { name: "Amalia Desta Fitri Pramono", id: "M11422311", role: "學生" },
      { name: "KATARINA ELLEN MONIKA", id: "M11422312", role: "學生" },
      { name: "Michael Suryanata", id: "M11422313", role: "學生" },
      { name: "Sri Wahyuni", id: "M11422315", role: "學生" },
      { name: "Wattanarungsan Paphawadee", id: "M11422318", role: "學生" },
      { name: "NGO MIN抗 QUANG", id: "M11422322", role: "學生" },
      { name: "NGO THI TRANG", id: "M11422323", role: "學生" },
      { name: "NGUYEN CHAN DONG", id: "M11422324", role: "學生" },
      { name: "NGUYEN THANH HUONG", id: "M11422326", role: "學生" },
      { name: "Nguyen Thu Thuy", id: "M11422328", role: "學生" },
      { name: "PHAM THI THU NGAN", id: "M11422330", role: "學生" },
      { name: "QUACH THI MAI ANH", id: "M11422331", role: "學生" },
      { name: "TRAN THUY LINH", id: "M11422332", role: "學生" },
      { name: "Huzaifa Muhammad", id: "M11422338", role: "學生" },
      { name: "Nurhasanah", id: "M11422343", role: "學生" },
      { name: "Korinne Shabira Bryantami", id: "M11422344", role: "學生" },
      { name: "Riri Ayu Sugiarti", id: "M11422346", role: "學生" },
      { name: "Ketruang Phiraya", id: "M11422347", role: "學生" },
      { name: "Tran Van Thanh", id: "M11422348", role: "學生" },
      { name: "Nguyen Thi Minh Thu", id: "M11422353", role: "學生" },
      { name: "Luu Thuy Nga", id: "M11422357", role: "學生" },
      { name: "Dinh Thi Ha My", id: "M11456034", role: "學生" },
    ]
  },
  {
    title: "投資管理學",
    weekday: 4, start: "13:10", end: "16:00", location: "財金系館", semester: "114-2",
    courseCode: "114023603",
    dept: "財務金融系碩士班 1 A",
    credits: "3.0",
    required: "必修",
    teacherInfo: "劉志良 (T10001191)",
    members: [
      { name: "劉志良", id: "T10001191", role: "教師" },
      { name: "羅晨松", id: "B11124008", role: "學生" },
      { name: "王家樂", id: "B11124010", role: "學生" },
      { name: "楊雅文", id: "B11124011", role: "學生" },
      { name: "李殷綺", id: "B11124015", role: "學生" },
      { name: "王逸杰", id: "B11124022", role: "學生" },
      { name: "吳承翰", id: "B11124038", role: "學生" },
      { name: "廖健佑", id: "B11141016", role: "學生" },
      { name: "蔡祐泓", id: "B11141033", role: "學生" },
      { name: "鄭詠如", id: "M11324021", role: "學生" },
      { name: "王建智", id: "M11324023", role: "學生" },
      { name: "李芸曦", id: "M11424003", role: "學生" },
      { name: "陳冠樺", id: "M11424004", role: "學生" },
      { name: "盧思妤", id: "M11424005", role: "學生" },
      { name: "謝煒柔", id: "M11424006", role: "學生" },
      { name: "羅育姮", id: "M11424007", role: "學生" },
      { name: "龍正育", id: "M11424008", role: "學生" },
      { name: "黃蕙臻", id: "M11424009", role: "學生" },
      { name: "謝竹林", id: "M11424011", role: "學生" },
      { name: "伍紹言", id: "M11424012", role: "學生" },
      { name: "陳聖閎", id: "M11424013", role: "學生" },
      { name: "鄭御辰", id: "M11424014", role: "學生" },
      { name: "錢谷村", id: "M11424015", role: "學生" },
      { name: "游宗賢", id: "M11424016", role: "學生" },
      { name: "李奕霖", id: "M11424017", role: "學生" },
      { name: "許晨星", id: "M11424018", role: "學生" },
      { name: "江彥忠", id: "M11424019", role: "學生" },
      { name: "劉芳薰", id: "M11424022", role: "學生" },
      { name: "傅霈瑜", id: "M11424023", role: "學生" },
      { name: "吳政諭", id: "M11424024", role: "學生" },
      { name: "李佲潓", id: "M11424025", role: "學生" },
      { name: "陳泓銘", id: "M11424026", role: "學生" },
      { name: "賴韋愷", id: "M11424027", role: "學生" },
      { name: "翁聖旻", id: "M11424029", role: "學生" },
      { name: "陳亭蓁", id: "M11424030", role: "學生" },
      { name: "吳政融", id: "M11424031", role: "學生" },
      { name: "吳尚翰", id: "M11424032", role: "學生" },
      { name: "蘇芳玉", id: "M11424033", role: "學生" },
      { name: "蔡依玲", id: "M11424034", role: "學生" },
      { name: "王柏翔", id: "M11424035", role: "學生" },
      { name: "林琮鈞", id: "M11424036", role: "學生" },
      { name: "劉靖雯", id: "M11424037", role: "學生" },
      { name: "吳松倍", id: "M11424038", role: "學生" },
      { name: "吳文薰", id: "M11424039", role: "學生" },
      { name: "游捷", id: "M11424040", role: "學生" },
      { name: "林芳羽", id: "M11424041", role: "學生" },
      { name: "蕭英傑", id: "M11424042", role: "學生" },
      { name: "劉永澤", id: "M11424043", role: "學生" },
      { name: "Kazingizi Sarah Talent", id: "M11424044", role: "學生" },
      { name: "邱詩蘋", id: "M11435002", role: "學生" },
    ]
  },
  {
    title: "企業研究方法",
    weekday: 2, start: "09:10", end: "12:00", location: "企管系館", semester: "114-2",
    courseCode: "114023020",
    dept: "企業管理系碩士班 1 A",
    credits: "3.0",
    required: "必修",
    teacherInfo: "周啟陽 (T10704371)",
    members: [
      { name: "周啟陽", id: "T10704371", role: "教師" },
      { name: "羅晨松", id: "B11124008", role: "學生" },
      { name: "蔡沅臻", id: "B11124009", role: "學生" },
      { name: "SAIKLANG SRISAMRAN", id: "M11322319", role: "學生" },
      { name: "TRAN GIA LINH", id: "M11322332", role: "學生" },
      { name: "LE THI HOAI XUAN", id: "M11324029", role: "學生" },
      { name: "NGUYEN DIEU LINH", id: "M11324030", role: "學生" },
      { name: "李依宸", id: "M11422302", role: "學生" },
      { name: "何旻軒", id: "M11422303", role: "學生" },
      { name: "楊晏禎", id: "M11422304", role: "學生" },
      { name: "林昀潔", id: "M11422305", role: "學生" },
      { name: "陳郁婷", id: "M11422306", role: "學生" },
      { name: "吳允心", id: "M11422307", role: "學生" },
      { name: "林佳縈", id: "M11422309", role: "學生" },
      { name: "Amalia Desta Fitri Pramono", id: "M11422311", role: "學生" },
      { name: "KATARINA ELLEN MONIKA", id: "M11422312", role: "學生" },
      { name: "Sri Wahyuni", id: "M11422315", role: "學生" },
      { name: "Wattanarungsan Paphawadee", id: "M11422318", role: "學生" },
      { name: "DINH TIEN ANH", id: "M11422319", role: "學生" },
      { name: "NGO MINH QUANG", id: "M11422322", role: "學生" },
      { name: "NGO THI TRANG", id: "M11422323", role: "學生" },
      { name: "NGUYEN CHAN DONG", id: "M11422324", role: "學生" },
      { name: "NGUYEN PHUONG THANH", id: "M11422325", role: "學生" },
      { name: "NGUYEN THANH HUONG", id: "M11422326", role: "學生" },
      { name: "Nguyen Thu Thuy", id: "M11422328", role: "學生" },
      { name: "PHAM THI THU NGAN", id: "M11422330", role: "學生" },
      { name: "QUACH THI MAI ANH", id: "M11422331", role: "學生" },
      { name: "TRAN THUY LINH", id: "M11422332", role: "學生" },
      { name: "Humadi Ali Abdo Ali Qasem", id: "M11422334", role: "學生" },
      { name: "Aguilar Acevedo Bruno Alejandro", id: "M11422335", role: "學生" },
      { name: "Khan Salar", id: "M11422336", role: "學生" },
      { name: "Hussain Didar", id: "M11422337", role: "學生" },
      { name: "Huzaifa Muhammad", id: "M11422338", role: "學生" },
      { name: "Mushtaq Muhammad", id: "M11422339", role: "學生" },
      { name: "Abbasi Muhammad Bilal", id: "M11422340", role: "學生" },
      { name: "Badshah Syed Faham", id: "M11422341", role: "學生" },
      { name: "Sinung Arjuna Sujoko", id: "M11422342", role: "學生" },
      { name: "Nurhasanah", id: "M11422343", role: "學生" },
      { name: "Korinne Shabira Bryantami", id: "M11422344", role: "學生" },
      { name: "Raudhatul Jannah", id: "M11422345", role: "學生" },
      { name: "Riri Ayu Sugiarti", id: "M11422346", role: "學生" },
      { name: "Ketruang Phiraya", id: "M11422347", role: "學生" },
      { name: "Tran Van Thanh", id: "M11422348", role: "學生" },
      { name: "Luu Xuan Nghia", id: "M11422349", role: "學生" },
      { name: "Nguyen Dat Vu", id: "M11422350", role: "學生" },
      { name: "Ngo Minh Thanh", id: "M11422351", role: "學生" },
      { name: "Vu Dinh Dang Huan", id: "M11422352", role: "學生" },
      { name: "Nguyen Thi Minh Thu", id: "M11422353", role: "學生" },
      { name: "Dinh Phuc Lam", id: "M11422354", role: "學生" },
      { name: "Luu Ngoc Phuong", id: "M11422355", role: "學生" },
      { name: "Nguyen Phu Thinh", id: "M11422356", role: "學生" },
      { name: "Luu Thuy Nga", id: "M11422357", role: "學生" },
      { name: "Pham Thi Thanh Ngan", id: "M11422358", role: "學生" },
      { name: "Nguyen Thanh Dat", id: "M11422359", role: "學生" },
    ]
  }
];

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [weekday, setWeekday] = useState<number>(1);
  const [start, setStart] = useState("09:10");
  const [end, setEnd] = useState("12:00");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [semester, setSemester] = useState("114-2");
  
  const [activeCourse, setActiveCourse] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    const existing = loadJSON<ScheduleItem[]>(KEYS.schedule, []);
    let needsSave = false;

    // 1. 檢查是否有完全缺失的預設課程
    const updated = [...existing];
    INITIAL_COURSES_DETAIL.forEach(ic => {
      const idx = updated.findIndex(e => e.title === ic.title);
      if (idx === -1) {
        const newCourse: ScheduleItem = {
          ...(ic as ScheduleItem),
          id: uid("cls"),
        };
        updated.push(newCourse);
        needsSave = true;
      } else if (!updated[idx].courseCode || !updated[idx].members) {
        updated[idx] = { 
          ...updated[idx], 
          ...(ic as ScheduleItem),
          id: updated[idx].id 
        };
        needsSave = true;
      }
    });

    // 2. 幫所有課程補齊 114-2 標籤
    updated.forEach((s, i) => {
      if (!s.semester) {
        updated[i].semester = "114-2";
        needsSave = true;
      }
    });

    if (needsSave) {
      saveJSON(KEYS.schedule, updated);
    }
    setItems(updated);
  }, []);

  function add() {
    if (!title.trim()) return;
    const next: ScheduleItem[] = [{ 
      id: uid("cls"), 
      weekday, start, end, 
      title: title.trim(), 
      location: location.trim() || undefined, 
      semester: semester.trim() 
    }, ...items];
    setItems(next);
    saveJSON(KEYS.schedule, next);
    setTitle(""); setLocation("");
    setStart("09:10"); setEnd("12:00");
  }

  function remove(id: string) {
    const next = items.filter(x => x.id !== id);
    setItems(next);
    saveJSON(KEYS.schedule, next);
  }

  const groupedItems = useMemo(() => {
    const map = new Map<string, { 
      ids: string[], 
      title: string, 
      semester: string, 
      weekdays: number[], 
      times: string[],
      location: string,
      item: ScheduleItem 
    }>();

    items.forEach(it => {
      const key = `${it.title}-${it.semester}`;
      const timeStr = `(${it.start}-${it.end})`;
      
      if (!map.has(key)) {
        map.set(key, {
          ids: [it.id],
          title: it.title,
          semester: it.semester || "",
          weekdays: [it.weekday],
          times: [timeStr],
          location: it.location || "",
          item: it
        });
      } else {
        const group = map.get(key)!;
        group.ids.push(it.id);
        if (!group.weekdays.includes(it.weekday)) group.weekdays.push(it.weekday);
        if (!group.times.includes(timeStr)) group.times.push(timeStr);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
        const minA = Math.min(...a.weekdays);
        const minB = Math.min(...b.weekdays);
        return minA - minB;
    });
  }, [items]);

  return (
    <div className="page">
      <PageTopBar title="📅 課表管理" subtitle="點選「🔍 課程資訊」查看名單與聯絡方式。" />
      <div className="container">
        <div className="card">
          <div className="cardHeader"><h2 className="cardTitle">手動新增課程 / 工讀</h2></div>
          <div className="grid grid2">
            <div className="field">
              <div className="label">學期標籤</div>
              <input className="input" value={semester} onChange={(e) => setSemester(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">名稱</div>
              <input className="input" placeholder="課名或工讀單位" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">星期</div>
              <select className="select" value={weekday} onChange={e => setWeekday(Number(e.target.value))}>
                {WEEK.map(w => <option key={w.n} value={w.n}>{w.name}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="label">上課時間 (開始)</div>
              <input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">上課時間 (結束)</div>
              <input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">地點</div>
              <input className="input" placeholder="教室或辦公室" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <button className="btn btnPrimary" style={{ marginTop: 12 }} onClick={add}>＋ 新增至課表</button>
        </div>

        <div className="grid" style={{ marginTop: 20, gap: 10 }}>
          {groupedItems.map(g => (
            <div key={g.title} className="row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {g.weekdays.sort().map(wd => (
                   <span key={wd} className="badge">{WEEK.find(w => w.n === wd)?.name}</span>
                ))}
              </div>
              <span className="badge badgeOk">{g.semester}</span>
              <div style={{ flex: 1 }}>
                <b>{g.title}</b>
                <span className="small muted"> {g.times.sort().join(" ")} | {g.location}</span>
              </div>
              
              <button 
                className="btn" 
                style={{ background: "#f1f5f9", fontWeight: 700 }}
                onClick={() => setActiveCourse(g.item)}
              >
                🔍 課程資訊
              </button>

              <button className="btn btnDanger" onClick={() => {
                const next = items.filter(x => !g.ids.includes(x.id));
                setItems(next);
                saveJSON(KEYS.schedule, next);
              }}>刪除全部</button>
            </div>
          ))}
        </div>
      </div>

      {activeCourse && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setActiveCourse(null)}>
          <div className="card" style={{ width: "95%", maxWidth: "750px", maxHeight: "90vh", overflowY: "auto", padding: "24px" }} onClick={e => e.stopPropagation()}>
            <div className="cardHeader">
              <h2 className="cardTitle" style={{ fontSize: "22px" }}>📖 {activeCourse.title}</h2>
              <button className="btn" onClick={() => setActiveCourse(null)}>關閉視窗</button>
            </div>

            <div className="grid grid2" style={{ marginTop: 20, background: "#f8fafc", padding: 15, borderRadius: 12, gap: 10 }}>
              <div><b>課程代碼：</b>{activeCourse.courseCode || "未提供"}</div>
              <div><b>開課單位：</b>{activeCourse.dept || "未提供"}</div>
              <div><b>必選修：</b>{activeCourse.required || "未提供"}</div>
              <div><b>學分數：</b>{activeCourse.credits || "未提供"}</div>
              <div style={{ gridColumn: "1/-1" }}><b>授課教師：</b>{activeCourse.teacherInfo || "未提供"}</div>
            </div>

            <div style={{ marginTop: 25 }}>
              <h3 style={{ marginBottom: 12, borderLeft: "4px solid #3b82f6", paddingLeft: 10 }}>👥 班級成員與聯絡資訊 (共 {activeCourse.members?.length || 0} 位)</h3>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "80px 150px 1fr", fontWeight: 800, paddingBottom: 8, borderBottom: "2px solid #eee", fontSize: "14px" }}>
                  <div>角色</div><div>姓名 (學號/工號)</div><div>E-Mail</div>
                </div>
                <div style={{ display: "grid", gap: 4, maxHeight: "400px", overflowY: "auto" }}>
                  {activeCourse.members?.map((m, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "80px 150px 1fr", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                      <span className="badge" style={{ width: "fit-content", background: m.role === '教師' ? '#fee2e2' : '#e0f2fe', color: m.role === '教師' ? '#b91c1c' : '#1e40af' }}>{m.role}</span>
                      <span style={{ fontWeight: 700 }}>{m.name} <span className="small muted">({m.id})</span></span>
                      <span style={{ color: "#64748b", fontFamily: "monospace" }}>{m.id.toLowerCase()}@yuntech.edu.tw</span>
                    </div>
                  ))}
                  {(!activeCourse.members || activeCourse.members.length === 0) && <div className="muted" style={{ textAlign: "center", padding: 20 }}>此課程尚無詳細名單資訊</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}