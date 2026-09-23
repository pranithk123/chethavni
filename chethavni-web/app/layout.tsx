import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Chethavni — Workflow Automation",
  description: "Connect webhooks, apps and APIs with lightweight workflow automation.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} min-h-full bg-[#f8fbff] text-slate-800`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
