import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/current-area";
import { Sidebar } from "@/components/sidebar";

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
        {user ? (
          <div className="flex min-h-screen">
            <Sidebar area={user.area} email={user.email} />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        ) : (
          <main className="min-h-screen">{children}</main>
        )}
      </body>
    </html>
  );
}
