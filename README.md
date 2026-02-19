# 🎓 Student OS - 智慧學員管理系統

這是一個專為學生打造的智慧化管理系統，基於 **Next.js 14** 開發。系統整合了課程管理、任務追蹤、財金資訊跑馬燈以及管理員安全驗證等核心功能，旨在提升學習效率與資訊掌握度。

## ✨ 核心功能亮點

### 1. 📊 智慧儀表板 (Dashboard)
- **視覺化 KPI**：即時統計考試、作業、報告數量，採用左右對稱設計，視覺更平衡。
- **財金資訊跑馬燈**：自動抓取 **Yahoo 股市 RSS** 最新新聞，速度調整至 70s 平緩滾動，適合閱讀。
- **今日課表與提醒**：自動識別 114-2 學期課表，並顯示前 5 筆即將到來的緊急提醒。

### 2. 📅 課程與時間管理
- **詳細課表管理**：支援手動新增課程，具備開始與結束時間選擇器。
- **名單查詢系統**：點選「課程資訊」可查看授課教師、修課學生清單及自動生成的 E-mail 聯絡資訊。

### 3. 📝 任務追蹤系統
- **多維度分類**：區分考試、作業、團體報告，並具備進度百分比條。
- **自動排序邏輯**：系統會根據截止日期與緊急程度自動將最急迫的任務置頂。

### 4. 🔒 安全與動畫
- **管理員驗證**：進入「設定」頁面需通過管理員密碼驗證，錯誤時具備「卡片震動」效果與幽默對話。
- **酷炫登入動畫**：登入時會顯示火箭升空動畫與能量加載條，提升使用者體驗。

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
