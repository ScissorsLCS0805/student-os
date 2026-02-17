import { NextResponse } from "next/server";
import { parseIcsEvents } from "@/lib/ics";

export const runtime = "nodejs";

// in-memory cache (dev/單機有效；serverless 可能會重置)
type CacheEntry = { expireAt: number; data: any };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000; // 10 分鐘

function getCache(key: string) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expireAt) {
    CACHE.delete(key);
    return null;
  }
  return hit.data;
}

function setCache(key: string, data: any) {
  CACHE.set(key, { expireAt: Date.now() + TTL_MS, data });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to");     // YYYY-MM-DD

  if (!url) {
    return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
  }

  const cacheKey = `ics:${url}`; // 先快取整份解析結果，再由 from/to 做篩選更快
  try {
    let parsedAll = getCache(cacheKey);

    if (!parsedAll) {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "StudentOS/1.0",
          Accept: "text/calendar, text/plain, */*",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: `Fetch failed: ${res.status}` },
          { status: 400 }
        );
      }

      const text = await res.text();
      parsedAll = parseIcsEvents(text);
      setCache(cacheKey, parsedAll);
    }

    // 範圍過濾（如果有提供）
    let events = parsedAll as any[];
    if (from && to) {
      events = events.filter((e) => e.startDate >= from && e.startDate <= to);
    }

    return NextResponse.json({
      ok: true,
      cached: !!getCache(cacheKey),
      ttlSeconds: Math.floor(TTL_MS / 1000),
      events,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
