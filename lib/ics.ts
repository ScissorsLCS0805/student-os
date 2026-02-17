export type IcsEvent = {
  uid?: string;
  summary: string;
  startDate: string; // YYYY-MM-DD
  isAllDay: boolean;
  startTime?: string; // HH:mm (optional)
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toHM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// unfold lines (RFC 5545): lines can be folded with CRLF + space
function unfoldIcs(text: string) {
  return text.replace(/\r?\n[ \t]/g, "");
}

function parseDateValue(v: string): { date: string; isAllDay: boolean; time?: string } | null {
  // All-day: YYYYMMDD
  if (/^\d{8}$/.test(v)) {
    const y = v.slice(0, 4);
    const m = v.slice(4, 6);
    const d = v.slice(6, 8);
    return { date: `${y}-${m}-${d}`, isAllDay: true };
  }

  // Date-time: YYYYMMDDTHHMMSSZ or without Z
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const da = Number(m[3]);
    const hh = Number(m[4]);
    const mm = Number(m[5]);
    const ss = Number(m[6]);
    const isZ = !!m[7];

    // If Z => UTC
    const dt = isZ
      ? new Date(Date.UTC(y, mo - 1, da, hh, mm, ss))
      : new Date(y, mo - 1, da, hh, mm, ss);

    return { date: toYMD(dt), isAllDay: false, time: toHM(dt) };
  }

  return null;
}

export function parseIcsEvents(icsText: string): IcsEvent[] {
  const text = unfoldIcs(icsText);
  const lines = text.split(/\r?\n/);

  const events: IcsEvent[] = [];
  let inEvent = false;

  let uid = "";
  let summary = "";
  let dtstartRaw = "";

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      uid = "";
      summary = "";
      dtstartRaw = "";
      continue;
    }
    if (line === "END:VEVENT") {
      if (inEvent && summary && dtstartRaw) {
        const parsed = parseDateValue(dtstartRaw);
        if (parsed) {
          events.push({
            uid: uid || undefined,
            summary,
            startDate: parsed.date,
            isAllDay: parsed.isAllDay,
            startTime: parsed.time,
          });
        }
      }
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    if (line.startsWith("UID:")) uid = line.slice(4).trim();
    if (line.startsWith("SUMMARY:")) summary = line.slice(8).trim();

    // DTSTART may come with params: DTSTART;VALUE=DATE:20250101
    if (line.startsWith("DTSTART")) {
      const parts = line.split(":");
      dtstartRaw = parts.slice(1).join(":").trim();
    }
  }

  return events;
}
