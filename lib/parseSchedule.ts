export type ScheduleItem = {
  id: string;
  day: number; // 1=Mon(一) ... 7=Sun(日)
  start: string; // "09:10"
  end: string; // "12:00"
  title: string;
  location?: string;
  teacher?: string;
};

// 節次→時間（直接用你課表上的時間）
const SLOT_TO_TIME: Record<string, { start: string; end: string }> = {
  "第Ｂ節": { start: "09:10", end: "10:00" },
  "第Ｃ節": { start: "10:10", end: "11:00" },
  "第Ｄ節": { start: "11:10", end: "12:00" },

  "第Ｅ節": { start: "13:10", end: "14:00" },
  "第Ｆ節": { start: "14:10", end: "15:00" },
  "第Ｇ節": { start: "15:10", end: "16:00" },
  "第Ｈ節": { start: "16:10", end: "17:00" },
};

// 你的課名非常固定，所以用「課名→星期」最穩
// 週三：企業研究方法
// 週四：財務會計專題研討（二） + 下午工讀
// 週五：國際科技與創新管理 + 下午投資管理學 + 下午工讀
// 週六：上午工讀
const TITLE_TO_DAY: Record<string, number> = {
  "企業研究方法": 3,
  "財務會計專題研討（二）": 4,
  "國際科技與創新管理": 5,
  "投資管理學": 5,
  "【工讀】國管學程": 3, // 下午工讀在三四五都有，我們後面會再拆
  "【工讀】": 3,
  "國管學程": 3,
};

function norm(s: string) {
  return s.replace(/\r/g, "").trim();
}

function isSlotLine(line: string) {
  return Object.keys(SLOT_TO_TIME).some((k) => line.includes(k));
}

function pickSlot(line: string) {
  return Object.keys(SLOT_TO_TIME).find((k) => line.includes(k)) ?? null;
}

function extractRoom(line: string) {
  const m = line.match(/\b([A-Z]{1,3}\d{2,4}[a-z]?)\b/);
  return m?.[1];
}

function hasChineseName(line: string) {
  // 老師通常是 2~4 個中文字，或有「、」
  return /[\u4e00-\u9fff]/.test(line) && (line.length <= 10 || line.includes("、"));
}

export function parseScheduleText(raw: string): ScheduleItem[] {
  const text = raw.replace(/\r/g, "");
  const lines = text.split("\n").map(norm).filter(Boolean);

  // 驗證：有沒有「一 二 三 四 五 六 日」
  const hasHeader =
    lines.some((l) => l.includes("一") && l.includes("二") && l.includes("三") && l.includes("四"));
  if (!hasHeader) return [];

  // 我們採用「掃描節次」→「在後續幾行抓到課名/老師/教室/工讀」的策略
  // 然後用課名映射星期；工讀用規則分配到三/四/五/六。
  const out: ScheduleItem[] = [];

  let currentSlot: string | null = null;

  // 暫存：遇到課名後，在接下來幾行抓 teacher/location
  let pendingTitle: string | null = null;
  let pendingDay: number | null = null;

  // 工讀：同一個節次會出現多次「【工讀】」「國管學程」，我們依時段做分配：
  // - 上午 B~D：週六有工讀
  // - 下午 E~H：週三、週四、週五都有工讀（你表格顯示三、四、五都占滿）
  // 這裡做「一次生成三天工讀」：E~H 節各生成 週三+週四+週五 三筆
  function addWorkForSlot(slot: string) {
    const t = SLOT_TO_TIME[slot];
    if (!t) return;

    // 上午 B/C/D：只放週六
    if (slot === "第Ｂ節" || slot === "第Ｃ節" || slot === "第Ｄ節") {
      out.push({
        id: crypto.randomUUID(),
        day: 6,
        start: t.start,
        end: t.end,
        title: "【工讀】國管學程",
      });
      return;
    }

    // 下午 E/F/G/H：週三、週四、週五都有
    if (slot === "第Ｅ節" || slot === "第Ｆ節" || slot === "第Ｇ節" || slot === "第Ｈ節") {
      for (const d of [3, 4, 5]) {
        out.push({
          id: crypto.randomUUID(),
          day: d,
          start: t.start,
          end: t.end,
          title: "【工讀】國管學程",
        });
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1) 抓節次
    if (isSlotLine(line)) {
      currentSlot = pickSlot(line);
      pendingTitle = null;
      pendingDay = null;
      continue;
    }
    if (!currentSlot) continue;

    // 2) 課名判斷（你這張固定）
    const knownTitles = [
      "企業研究方法",
      "財務會計專題研討（二）",
      "國際科技與創新管理",
      "投資管理學",
      "【工讀】",
    ];

    const hitTitle = knownTitles.find((t) => line.includes(t));
    if (hitTitle) {
      if (hitTitle === "【工讀】") {
        // 工讀：用規則生成（不靠 line 的欄位）
        addWorkForSlot(currentSlot);
        pendingTitle = null;
        pendingDay = null;
        continue;
      }

      // 一般課
      pendingTitle = hitTitle;
      pendingDay = TITLE_TO_DAY[hitTitle] ?? null;

      // 先建立一筆，之後補 teacher/location
      const tm = SLOT_TO_TIME[currentSlot];
      if (pendingDay && tm) {
        out.push({
          id: crypto.randomUUID(),
          day: pendingDay,
          start: tm.start,
          end: tm.end,
          title: pendingTitle,
        });
      }

      continue;
    }

    // 3) 如果剛建立課名，嘗試補 teacher/location 到「最近建立的那筆」
    // 以最後一筆為目標（同 slot 同 day）
    if (pendingTitle) {
      const last = out[out.length - 1];
      if (!last) continue;

      // 教室
      const room = extractRoom(line);
      if (room) last.location = room;

      // 老師
      if (hasChineseName(line) && !last.teacher) {
        last.teacher = line;
      }
    }
  }

  // 4) 合併同一天同一課名相鄰節次（B+C+D 合成 09:10~12:00；E+F+G 合成 13:10~16:00）
  // 先排序
  const sorted = [...out].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    if (a.title !== b.title) return a.title.localeCompare(b.title);
    return a.start.localeCompare(b.start);
  });

  const merged: ScheduleItem[] = [];
  for (const it of sorted) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.day === it.day &&
      prev.title === it.title &&
      (prev.location ?? "") === (it.location ?? "") &&
      (prev.teacher ?? "") === (it.teacher ?? "") &&
      prev.end === it.start // 相鄰
    ) {
      prev.end = it.end;
    } else {
      merged.push({ ...it });
    }
  }

  // 5) 去重
  const uniq = new Map<string, ScheduleItem>();
  for (const it of merged) {
    const key = `${it.day}-${it.start}-${it.end}-${it.title}-${it.location ?? ""}-${it.teacher ?? ""}`;
    if (!uniq.has(key)) uniq.set(key, it);
  }

  return Array.from(uniq.values()).sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.start.localeCompare(b.start);
  });
}
