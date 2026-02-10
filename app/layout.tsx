import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { CopilotButton } from "@/components/chat/CopilotButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lighthouse - AI-Powered Process Intelligence",
  description: "Discover and assess AI tools across Finance, Go-To-Market, and R&D processes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
          <CopilotButton />
        </div>
      </body>
    </html>
  );
}
