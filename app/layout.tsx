import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Tracer",
  description: "Hub operacional de user cases — Operations (L2)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable}`}>
      <body className="font-sans">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-6">
            {/* Wordmark: único lugar onde o amarelo aparece com destaque. */}
            <span className="text-lg font-bold tracking-tight text-primary">
              Tracer
            </span>
            <span className="text-sm text-muted-foreground">
              Operations · L2
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
