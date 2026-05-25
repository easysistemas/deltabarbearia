import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "Barbearia Sr. Brisola | Fortaleza-CE",
  description:
    "A primeira barbearia por assinatura de Fortaleza.",
  keywords: "barbearia, barbearia por assinatura, corte masculino, barba, fortaleza",
}

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body
        suppressHydrationWarning={true}
        className={`${_inter.variable} ${_playfair.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
