import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AddisPulse Media",
    template: "%s | AddisPulse Media",
  },
  description: "QR-powered campaigns and passenger rewards in Addis Ababa.",
  applicationName: "AddisPulse Media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
