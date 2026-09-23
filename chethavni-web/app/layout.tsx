import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chethavni - Realtime Webhook & Alert Dispatcher",
  description: "Route TradingView, Chartink, Razorpay, and Shopify alerts instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} min-h-full flex flex-col bg-[#fcfaff] text-slate-800`}>
        {children}
      </body>
    </html>
  );
}