"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KEYS, saveJSON, loadJSON, AuthState, DEFAULT_AUTH } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // 新增：控制動畫顯示狀態
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const auth = loadJSON<AuthState>(KEYS.auth, DEFAULT_AUTH);

    if ((username === "" && password === "") || (username === auth.username && password === auth.password)) {
      // 驗證成功，啟動動畫
      setIsLoggingIn(true);
      saveJSON(KEYS.auth, { ...auth, isLoggedIn: true });
      
      // 延遲 2 秒讓使用者看完動畫再跳轉
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } else {
      setError("帳號或密碼錯誤，請再試一次。");
    }
  };

  const handleRegister = () => {
    alert("註冊功能開發中，敬請期待！");
  };

  if (!mounted) return null;

  return (
    <div className="loginPage">
      {/* 酷炫動畫遮罩：當正在登入時顯示 */}
      {isLoggingIn && (
        <div className="loginSuccessOverlay">
          <div className="loaderContainer">
            <div className="coolRocket">🚀</div>
            <div className="successText">登入成功，準備進入系統...</div>
            <div className="energyBar">
              <div className="energyFill"></div>
            </div>
          </div>
        </div>
      )}

      <div className={`loginCard ${isLoggingIn ? 'fadeOut' : ''}`}>
        <div className="loginHeader">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h1 className="h1">Student OS</h1>
          <p className="muted">請登入您的學員帳號</p>
        </div>

        <form onSubmit={handleLogin} className="grid" style={{ gap: 20 }}>
          <div className="field">
            <label className="label">帳號 (學號)</label>
            <input
              className="input"
              type="text"
              placeholder="請輸入帳號"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">密碼</label>
            <input
              className="input"
              type="password"
              placeholder="請輸入密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="loginError">{error}</div>}

          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            <button type="submit" className="btn btnPrimary loginBtn">
              立即登入
            </button>
            <button type="button" className="btn registerBtn" onClick={handleRegister}>
              申請新帳號 (註冊)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}