// lib/storage.ts

export type ExamItem = {
  id: string;
  title: string;
  course?: string;
  date?: string; // YYYY-MM-DD
  progress: number;
  note?: string;
};

export type AssignmentItem = {
  id: string;
  title: string;
  course?: string;
  due?: string; // YYYY-MM-DD
  progress: number;
  note?: string;
};

export type ProjectTask = {
  id: string;
  text: string;
  done: boolean;
  assignee?: string;
};

export type ProjectItem = {
  id: string;
  title: string;
  course?: string;
  due?: string; // YYYY-MM-DD
  progress: number;
  note?: string;
  tasks?: ProjectTask[];
};

export type CourseMember = {
  name: string;
  id: string; 
  role: '教師' | '學生';
};

export type ScheduleItem = {
  id: string;
  weekday: number; 
  start: string; 
  end: string; 
  title: string;
  location?: string;
  teacher?: string;
  semester?: string;
  // --- 新增以下欄位以支援詳細資訊 ---
  courseCode?: string;    // 課程代碼
  dept?: string;          // 開課單位
  credits?: string;       // 學分數
  required?: string;      // 必選修
  teacherInfo?: string;   // 授課教師詳細資訊
  members?: CourseMember[]; // 成員名單
};

// --- 更新部分：全方位事件與提醒系統類型 ---
export type EventItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  category: '代辦' | '會議' | '聚餐' | '採購' | '其他';
  done: boolean;
  note?: string;
};

// 為了相容性暫時保留，建議逐步遷移至 EventItem
export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

export const KEYS = {
  exams: "studentOS.exams",
  assignments: "studentOS.assignments",
  projects: "studentOS.projects",
  schedule: "studentOS.schedule",
  todos: "studentOS.todos",
  events: "studentOS.events", // 新增事件儲存 Key
  auth: "studentOS.auth",
  settings: "studentOS.settings",
} as const;

export type AuthState = {
  isLoggedIn: boolean;
  username: string;
  password: string;
};

export type SettingsState = {
  fontScale: number;
  icsUrls: string[];
};

export const DEFAULT_USERNAME = "B11124008";
export const DEFAULT_PASSWORD = "B11124008";

export const DEFAULT_AUTH: AuthState = {
  isLoggedIn: false,
  username: DEFAULT_USERNAME,
  password: DEFAULT_PASSWORD,
};

export const DEFAULT_SETTINGS: SettingsState = {
  fontScale: 1.0,
  icsUrls: [
    "https://calendar.google.com/calendar/ical/zh-tw.taiwan%23holiday%40group.v.calendar.google.com/public/basic.ics",
  ],
};

// --- 工具函式 ---

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

/**
 * 數值限制在 0-100 之間
 */
export function clampProgress(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, v));
}

/**
 * 計算距離今天還有幾天 (YYYY-MM-DD)
 */
export function daysUntil(dateStr?: string) {
  if (!dateStr) return null;
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const d = new Date(dateStr + "T00:00:00").getTime();
  const diff = Math.ceil((d - base) / 86400000);
  return Number.isFinite(diff) ? diff : null;
}

/**
 * 確保設定檔已初始化
 */
export function ensureSettingsInitialized(): SettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const existing = loadJSON<SettingsState | null>(KEYS.settings, null as any);
  if (!existing || !Array.isArray((existing as any).icsUrls)) {
    saveJSON(KEYS.settings, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return existing as SettingsState;
}