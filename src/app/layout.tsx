import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mechaverse-MuJoCo",
  description: "Mechaverse MuJoCo Testbed",
  authors: [{ name: "jurmy24" }],
  keywords: ["MuJoCo"],
  applicationName: "mechaverse-mujoco",
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  viewportFit: "cover",
  userScalable: "no",
  shrinkToFit: "no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased mujoco-viewer-body`}
      >
        {children}
      </body>
    </html>
  );
}
