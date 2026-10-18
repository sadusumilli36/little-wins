import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Little Wins",
  description: "A gentle guide for everyday tasks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
