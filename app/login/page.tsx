"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthState,
  DEFAULT_AUTH,
  DEFAULT_PASSWORD,
  DEFAULT_USERNAME,
  KEYS,
  loadJSON,
  saveJSON,
} from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // ensure auth exists
    const auth = loadJSON<AuthState>(KEYS.auth, DEFAULT_AUTH);
    if (!localStorage.getItem(KEYS.auth)) saveJSON(KEYS.auth, auth);
    if (auth.isLoggedIn) router.replace("/");
  }, [router]);

  function login() {
    const auth = loadJSON<AuthState>(KEYS.auth, DEFAULT_AUTH);

    const realUser = auth.username || DEFAULT_USERNAME;
    const realPass = auth.password || DEFAULT_PASSWORD;

    if (username.trim() !== realUser || password !== realPass) {
      setError("帳號或密碼錯誤");
      return;
    }

    const next: AuthState = { ...auth, isLoggedIn: true, username: realUser, password: realPass };
    saveJSON(KEYS.auth, next);
    router.replace("/");
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="topbarInner">
          <h1 className="h1">Student OS</h1>
          <div style={{ marginLeft: "auto" }} className="muted">
            Login
          </div>
        </div>
      </div>

      <div className="container">
        <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
          <div className="cardHeader">
            <div>
              <h2 className="cardTitle">登入</h2>
              <div className="small">預設帳號/密碼：B11124008（可在 Settings 修改密碼）</div>
            </div>
            <span className="badge">Student OS</span>
          </div>

          <div className="grid" style={{ gap: 12 }}>
            <div className="field">
              <div className="label">帳號</div>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className="field">
              <div className="label">密碼</div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
              />
            </div>

            {error ? <div className="row" style={{ color: "#991b1b", background: "#fef2f2" }}>{error}</div> : null}

            <button className="btn btnPrimary" onClick={login}>
              登入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
