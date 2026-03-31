import type { Metadata } from "next";
import { Literata } from "next/font/google";
import "./globals.css";

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
});

export const metadata: Metadata = {
  title: "B-Reader",
  description: "A minimal e-reader for EPUB files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${literata.variable} h-full`}>
      <body className="bg-black text-white min-h-full font-[family-name:var(--font-literata)]">
        {children}
      </body>
    </html>
  );
}
