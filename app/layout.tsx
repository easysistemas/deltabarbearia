import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Bebas_Neue, Inter_Tight } from "next/font/google"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" })
const _bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" })

export const metadata: Metadata = {
  title: "Delta Barbearia | Corte e Barba Ilimitados em Fortaleza",
  description:
    "A barbearia por assinatura de Fortaleza. Corte e barba ilimitados por mensalidade fixa. Agende pelo app, venha sempre que quiser.",
}

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
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
        className={`${_inter.variable} ${_interTight.variable} ${_bebas.variable} font-sans antialiased bg-[#0A0A0A] text-[#F5F5F5] min-h-screen flex flex-col selection:bg-[#E63946] selection:text-white`}
      >
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}
