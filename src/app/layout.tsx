import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "RidePerk",
    template: "%s | RidePerk",
  },
  description: "QR-powered campaigns and passenger rewards in Addis Ababa.",
  applicationName: "RidePerk",
  icons: { icon: "/favicon.ico", apple: "/icon.png" },
  openGraph: { title: "RidePerk", description: "QR-powered campaigns and passenger rewards in Addis Ababa.", siteName: "RidePerk", type: "website" },
  twitter: { card: "summary_large_image", title: "RidePerk", description: "QR-powered campaigns and passenger rewards in Addis Ababa." },
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
