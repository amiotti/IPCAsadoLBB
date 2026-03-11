import { Manrope, Merriweather } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-sans"
});

const display = Merriweather({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "IPC Asados LBB",
  description: "Seguimiento mensual del costo de un asado para 10 personas"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${sans.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
