"use client";

import { useEffect, useState } from "react";
import PageTopBar from "@/components/PageTopBar";
import {
  AuthState,
  DEFAULT_AUTH,
  DEFAULT_SETTINGS,
  KEYS,
  SettingsState,
  loadJSON,
  saveJSON,
} from "@/lib/storage";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const [fontScale, setFontScale] = useState<number>(1);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState<string>("");

  const [icsText, setIcsText] = useState("");

  useEffect(() => {
    const settings = loadJSON<SettingsState>(KEYS.settings, DEFAULT_SETTINGS);
    setFontScale(settings.fontScale || 1);
    setIcsText((settings.icsUrls || []).join("\n"));
  }, []);

  function applyFont(scale: number) {
    const s = Math.max(0.85, Math.min(1.25, scale));
    setFontScale(s);
    const prev = loadJSON<SettingsState>(KEYS.settings, DEFAULT_SETTINGS);
    saveJSON(KEYS.settings, { ...prev, fontScale: s });
    document.documentElement.style.setProperty("--fontScale", String(s));
    setMsg("已套用字體大小 ✅");
    setTimeout(() => setMsg(""), 1200);
  }

  function changePassword() {
    const auth = loadJSON<AuthState>(KEYS.auth, DEFAULT_AUTH);
    if (oldPass !== auth.password) {
      setMsg("舊密碼不正確");
      return;
    }
    if (!newPass.trim() || newPass.trim().length < 4) {
      setMsg("新密碼太短（至少 4 碼）");
      return;
    }
    const next = { ...auth, password: newPass.trim() };
    saveJSON(KEYS.auth, next);
    setOldPass("");
    setNewPass("");
    setMsg("密碼已更新 ✅");
    setTimeout(() => setMsg(""), 1500);
  }

  function logout() {
    const auth = loadJSON<AuthState>(KEYS.auth, DEFAULT_AUTH);
    saveJSON(KEYS.auth, { ...auth, isLoggedIn: false });
    router.replace("/login");
  }

  function saveIcsUrls() {
    const urls = icsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const prev = loadJSON<SettingsState>(KEYS.settings, DEFAULT_SETTINGS);
    saveJSON(KEYS.settings, { ...prev, icsUrls: urls });

    setMsg(`已儲存 iCal 連結（${urls.length} 條）✅`);
    setTimeout(() => setMsg(""), 1500);
  }

  return (
    <div className="page">
      <PageTopBar title="⚙ Settings" subtitle="修改密碼、調整字體大小、iCal 匯入（Google 行事曆）。" />

      <div className="container">
        <div className="grid" style={{ gap: 14 }}>
          {msg ? <div className="row">{msg}</div> : null}

          <div className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">字體大小</h2>
              <span className="badge">立即套用</span>
            </div>

            <div className="grid grid2">
              <div className="field">
                <div className="label">大小（0.85 ~ 1.25）</div>
                <input
                  className="input"
                  type="range"
                  min={0.85}
                  max={1.25}
                  step={0.05}
                  value={fontScale}
                  onChange={(e) => applyFont(Number(e.target.value))}
                />
                <div className="small">目前：{fontScale.toFixed(2)}</div>
              </div>

              <div className="row" style={{ background: "#fff" }}>
                <div style={{ fontWeight: 900 }}>預覽</div>
                <div className="small" style={{ marginTop: 6, lineHeight: 1.7 }}>
                  這段文字用來預覽字體大小。你調整滑桿後，整站字體會一起放大/縮小。
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">iCal 匯入（Google 行事曆）</h2>
              <span className="badge badgeWarn">public 最安全</span>
            </div>

            <div className="small" style={{ lineHeight: 1.7 }}>
              ✅ 你可以貼上多條 iCal 連結（每行一條），週日曆會自動抓取本週事件。<br />
              ⚠ 含 <b>private-xxxxx</b> 的連結等於「鑰匙」，請當成密碼保管。
            </div>

            <div className="field" style={{ marginTop: 10 }}>
              <div className="label">iCal URLs（每行一條）</div>
              <textarea
                className="textarea"
                value={icsText}
                onChange={(e) => setIcsText(e.target.value)}
                placeholder="貼上你的 .ics 連結..."
              />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button className="btn btnPrimary" onClick={saveIcsUrls}>
                儲存 iCal 連結
              </button>
              <button
                className="btn"
                onClick={() => setIcsText(DEFAULT_SETTINGS.icsUrls.join("\n"))}
              >
                還原預設
              </button>
            </div>
          </div>

          <div className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">修改密碼</h2>
              <span className="badge badgeWarn">本機儲存</span>
            </div>

            <div className="grid grid2">
              <div className="field">
                <div className="label">舊密碼</div>
                <input
                  className="input"
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                />
              </div>

              <div className="field">
                <div className="label">新密碼</div>
                <input
                  className="input"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button className="btn btnPrimary" onClick={changePassword}>
                更新密碼
              </button>
              <button className="btn btnDanger" onClick={logout}>
                登出
              </button>
            </div>

            <div className="small" style={{ marginTop: 10 }}>
              ⚠ 目前是 demo 登入：密碼存在你的瀏覽器 localStorage，不是伺服器帳密系統。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
