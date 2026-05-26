"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CalendarDays,
  BarChart3,
  Users,
  Scissors,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Package,
  DollarSign,
  User,
} from "lucide-react"
import { isLoggedIn, logout, login, fetchAppointments, getCurrentUser } from "@/lib/store"
import { fetchBusinessConfig } from "@/lib/db_actions" // Added
import type { BusinessConfig } from "@/lib/types" // Added
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserSettingsDialog } from "./user-settings-dialog"

const NAV_ITEMS = [
  { label: "Agenda", href: "/admin/agenda", icon: CalendarDays },
  { label: "Relatorios", href: "/admin/relatorios", icon: BarChart3 },
  { label: "Financeiro", href: "/admin/financeiro", icon: DollarSign },
  { label: "Clientes", href: "/admin/clientes", icon: User },
  { label: "Barbeiros", href: "/admin/barbeiros", icon: Users },
  { label: "Combos", href: "/admin/combos", icon: Package },
  { label: "Produtos", href: "/admin/produtos", icon: Package },
  { label: "Servicos", href: "/admin/servicos", icon: Scissors },
  { label: "Configuracoes", href: "/admin/configuracoes", icon: Settings },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("admin@delta.com")
  const [password, setPassword] = useState("delta123")
  const [error, setError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null) // Added
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Initial data load
    setAuthed(isLoggedIn())
    fetchAppointments()
    fetchBusinessConfig().then(setBusinessConfig)
    setLoading(false)
  }, [])

  useEffect(() => {
    const user = getCurrentUser()
    if (!authed || !businessConfig || user?.role === "ADMIN") return

    // RBAC check for current path
    const allowedLabels = businessConfig.allowedOperationalPages || ["Agenda"]
    const currentNavItem = NAV_ITEMS.find(item => pathname.startsWith(item.href))

    if (currentNavItem && !allowedLabels.includes(currentNavItem.label)) {
      router.replace("/admin/agenda")
    }
  }, [pathname, router, authed, businessConfig])

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Preencha email e senha")
      return
    }

    setLoginLoading(true)
    setError("")

    try {
      const res = await login(email, password)
      if (res.success) {
        setAuthed(true)
        setError("")
      } else {
        setError(res.error || "Erro ao entrar")
      }
    } catch (err) {
      setError("Erro de conexão")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    setAuthed(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center animate-in zoom-in-95 duration-500">
            <div className="mb-2 flex flex-col items-center">
              <img src="/images/logo.png" alt="Delta Barbearia" className="h-16 w-auto object-contain drop-shadow-xl" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Digite a senha para acessar o painel
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-card/50 p-8 shadow-2xl backdrop-blur-sm">
            <label htmlFor="admin-email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <Input
              id="admin-email"
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="mb-4 border-white/10 bg-secondary/20 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-primary/20"
            />

            <label htmlFor="admin-pass" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Senha
            </label>
            <Input
              id="admin-pass"
              type="password"
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="mb-4 border-white/10 bg-secondary/20 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-primary/20"
            />
            {error && (
              <p className="mb-4 text-sm font-medium text-destructive animate-pulse">{error}</p>
            )}
            <Button
              id="admin-login-btn"
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-300 mb-4"
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </Button>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-[9px] uppercase border-white/10 text-muted-foreground hover:text-white bg-transparent h-auto py-2 flex flex-col gap-1 leading-tight"
                onClick={() => {
                  setEmail("admin@delta.com");
                  setPassword("delta123");
                }}
              >
                <span>Admin</span>
                <span className="text-[8px] opacity-70 normal-case">admin@delta.com</span>
                <span className="text-[8px] opacity-70 normal-case">senha: delta123</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-[9px] uppercase border-white/10 text-muted-foreground hover:text-white bg-transparent h-auto py-2 flex flex-col gap-1 leading-tight"
                onClick={() => {
                  setEmail("operacional@delta.com");
                  setPassword("delta123");
                }}
              >
                <span>Operacional</span>
                <span className="text-[8px] opacity-70 normal-case">operacional@delta.com</span>
                <span className="text-[8px] opacity-70 normal-case">senha: delta123</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar - desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border/40 bg-card/50 backdrop-blur-sm lg:block overflow-y-auto">
        <div className="flex min-h-full flex-col">
          <div className="flex flex-col items-center justify-center border-b border-border/40 px-6 py-6 sticky top-0 bg-card/50 backdrop-blur-md z-10">
            <img src="/images/logo.png" alt="Delta Barbearia" className="h-12 w-auto object-contain mb-2 drop-shadow-md" />
            {/* Show User Info */}
            <div className="flex flex-col items-center mt-2">
              <span className={`text-xs font-semibold ${getCurrentUser()?.role === 'OPERATIONAL' ? 'text-blue-500' : 'text-primary'}`}>
                {getCurrentUser()?.name || 'Administrador'}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                {getCurrentUser()?.role || 'ADMIN'}
              </span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {NAV_ITEMS.filter(item => {
              const user = getCurrentUser()
              if (user?.role !== "ADMIN") {
                const allowedLabels = businessConfig?.allowedOperationalPages || ["Agenda"]
                return allowedLabels.includes(item.label)
              }
              return true
            }).map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${active
                    ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,215,0,0.1)]" // Corrected quoting if needed
                    : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                    }`}
                >
                  <Icon size={18} className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border/40 p-4 sticky bottom-0 bg-card/50 backdrop-blur-md z-10 space-y-2">
            {getCurrentUser()?.role === "ADMIN" && (
              <UserSettingsDialog />
            )}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-72 transform border-r border-border/40 bg-card transition-transform duration-300 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/40 px-6 py-6">
            <div className="flex flex-col items-start">
              <img src="/images/logo.png" alt="Delta Barbearia" className="h-8 w-auto object-contain drop-shadow-md" />
            </div>
            <button onClick={() => setSidebarOpen(false)} aria-label="Fechar menu">
              <X size={20} className="text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {NAV_ITEMS.filter(item => {
              const user = getCurrentUser()
              if (user?.role !== "ADMIN") {
                if (["Relatorios", "Financeiro", "Configuracoes"].includes(item.label)) return false
              }
              return true
            }).map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${active
                    ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                    : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                    }`}
                >
                  <Icon size={18} className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-border/40 p-4 space-y-2">
            {getCurrentUser()?.role === "ADMIN" && (
              <UserSettingsDialog />
            )}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="flex flex-shrink-0 items-center justify-between border-b border-border/40 bg-card/50 backdrop-blur-sm px-4 py-4 lg:px-8">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <Link href="/admin/agenda?new=true">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all font-semibold uppercase tracking-wider text-[11px]"
            >
              <Plus size={16} className="mr-1.5" />
              Novo Agendamento
            </Button>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
