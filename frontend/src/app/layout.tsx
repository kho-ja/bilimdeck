import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BilimDeck",
  description: "Memory Card App - Django + Next.js + shadcn/ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
