"use client"; // 雖然通常用於元件，但在某些嚴格環境下能確保檔案被正確識別

export const COURSES = [
  "企業研究方法",
  "財務會計專題研討（二）",
  "國際科技與創新管理",
  "投資管理學",
  "【工讀】國管學程",
  "其他",
] as const;

export type CourseName = (typeof COURSES)[number];