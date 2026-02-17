"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DEFAULT_AUTH,
  DEFAULT_SETTINGS,
  KEYS,
  loadJSON,
  saveJSON,
  AuthState,
  SettingsState,
} from "@/lib/storage";

export default function RootClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = useMemo(() => pathname === "/login", [pathname]);

  useEffect(() => {
    // init auth + settings if missing
    const auth = loadJSON<AuthState>(KEYS.auth, DEFAULT_AUTH);
    const settings = loadJSON<SettingsState>(KEYS.settings, DEFAULT_SETTINGS);

    if (!localStorage.getItem(KEYS.auth)) saveJSON(KEYS.auth, auth);
    if (!localStorage.getItem(KEYS.settings)) saveJSON(KEYS.settings, settings);

    // apply font scale
    const scale = Math.max(0.85, Math.min(1.25, settings.fontScale || 1));
    document.documentElement.style.setProperty("--fontScale", String(scale));

    // route guard
    if (!isLoginPage && !auth.isLoggedIn) {
      router.replace("/login");
    }
    if (isLoginPage && auth.isLoggedIn) {
      router.replace("/");
    }
  }, [isLoginPage, router]);

  return (
    <>
      {children}

      {/* footer */}
      <div className="footer">
        <div className="footerInner">
          <div style={{ fontWeight: 900 }}>Student OS</div>
          <div className="footerMuted">
            作者：ScissorsLCS｜網站設計與製作版權所有，翻拷必究
          </div>
        </div>
      </div>
    </>
  );
}
