import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { SettingsProvider } from "@/components/settings-provider"
import "./globals.css"

import { Mulish as V0_Font_Mulish, Space_Mono as V0_Font_Space_Mono } from 'next/font/google'

// Initialize fonts
const mulish = V0_Font_Mulish({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })
const spaceMono = V0_Font_Space_Mono({ subsets: ['latin'], weight: ["400", "700"] })

export const metadata: Metadata = {
  title: "AI Me App | Mac Anderson",
  description: "Get to know Mac Anderson, a machine learning researcher, patented inventor, and award winning entrapraneur.",
  generator: 'macanderson.com'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${mulish.className} ${spaceMono.className}`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <SettingsProvider>{children}</SettingsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
