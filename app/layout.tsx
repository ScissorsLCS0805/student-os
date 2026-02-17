import "./globals.css";
import "./ui.css";
import RootClient from "@/components/RootClient";

export const metadata = {
  title: "Student OS",
  description: "Student OS by ScissorsLCS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <RootClient>{children}</RootClient>
      </body>
    </html>
  );
}
