"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"

export default function AdminPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/agenda")
  }, [router])

  return (
    <AdminShell>
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </AdminShell>
  )
}
