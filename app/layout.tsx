import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Text to Speech",
  description: "Client-side TTS on the Web Speech API"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
