import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin | DELTA Barbearia",
  description: "Painel administrativo DELTA Barbearia",
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
