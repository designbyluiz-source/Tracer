import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/current-area";
import { SignOutButton } from "@/components/sign-out-button";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Tracer",
  description: "Hub operacional de user cases — Operations (L2)",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

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

            {user && (
              <div className="ml-auto flex items-center gap-3">
                <span className="rounded-md border border-border bg-elevated px-2 py-1 text-xs font-medium text-secondary-foreground">
                  {user.area}
                </span>
                <SignOutButton />
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
