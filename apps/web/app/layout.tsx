import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "EXP-AgroLab",
  description: "Gestão de experimentos agronômicos e laboratoriais",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br">
      <body style={{ margin: 0, fontFamily: "Inter, Arial, sans-serif", background: "#F9F9FB", color: "#1F2940" }}>
        {children}
      </body>
    </html>
  );
}
