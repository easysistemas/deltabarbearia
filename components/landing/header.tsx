"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Instagram } from "lucide-react"

import { fetchPlans } from "@/lib/store"
import type { Plan } from "@/lib/types"

const NAV_ITEMS = [
  { label: "Sobre", href: "#sobre" },
  { label: "Servicos", href: "#servicos" },
  { label: "Planos", href: "#planos" },
  { label: "Equipe", href: "#equipe" },
  { label: "Galeria", href: "#galeria" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Contato", href: "#contato" },
]

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hasPlans, setHasPlans] = useState(true)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    async function checkPlans() {
      const plans = await fetchPlans()
      setHasPlans(plans.some(p => p.visible !== false))
    }
    checkPlans()
  }, [])

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.href === "#planos") return hasPlans
    return true
  })

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? "bg-background/95 backdrop-blur-md border-b border-border/50"
        : "bg-transparent"
        }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link
          href="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-3 group"
        >
          <span className="font-display text-2xl font-bold tracking-wide text-foreground transition-colors group-hover:text-primary">
            TRIV
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground sm:block">
            Barbearia
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {filteredNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href="https://instagram.com/trivbarbearia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="Instagram"
          >
            <Instagram size={18} />
          </a>
          <div className="h-5 w-px bg-border" />
          <Link
            href="/agendar"
            className="text-[13px] font-semibold uppercase tracking-[0.12em] text-primary transition-colors hover:text-primary/80"
          >
            Agendar
          </Link>
        </div>

        <button
          className="text-foreground lg:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border/50 bg-background/98 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-6 py-6">
            {filteredNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-border/30 py-3.5 text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/agendar"
              onClick={() => setMenuOpen(false)}
              className="mt-6 flex items-center justify-center rounded-none border border-primary bg-transparent py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            >
              Agendar Horario
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
