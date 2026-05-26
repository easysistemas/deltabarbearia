import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, Dancing_Script } from "next/font/google"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})
const _dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
})

export const metadata: Metadata = {
  title: "Whisky Blues Barbearia",
  description:
    "Barbearia clássica com atmosfera única. Corte, barba e estilo com a personalidade do blues.",
  keywords: "barbearia, clássica, whisky, blues, estilo, corte masculino",
}

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body
        className={`${_inter.variable} ${_playfair.variable} ${_dancing.variable} font-sans antialiased bg-[#0D1B2A] text-[#F0E6D3] min-h-screen flex flex-col selection:bg-[#C9A05A] selection:text-[#0D1B2A]`}
      >
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}
