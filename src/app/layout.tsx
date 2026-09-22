import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monthly Budget Planner",
  description: "Plan and track monthly expenses and budget",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
