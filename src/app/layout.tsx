import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { Providers } from "@/lib/wallet/providers";
import "./globals.css";

const sans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Loopi · Ayuda que se ve llegar",
  description: "Cada peso y cada hora, con evidencia. Causas financiadas por hitos y verificadas por terceros en Monad.",
  icons: { icon: "/assets/logo-15.png" },
};

export const viewport: Viewport = { themeColor: "#DCE3D3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={sans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
