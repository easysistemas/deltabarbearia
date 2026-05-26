"use client"

import { useState, useEffect } from "react"
import { useReveal } from "@/hooks/use-reveal"
import Link from "next/link"
import { fetchServices } from "@/lib/store"
import type { Service } from "@/lib/types"

export function ServicesSection() {
  const [active, setActive] = useState("Cortes")
  const [categories, setCategories] = useState<string[]>([])
  const [groupedServices, setGroupedServices] = useState<Record<string, Service[]>>({})
  const { ref, visible } = useReveal()

  useEffect(() => {
    async function load() {
      const services = await fetchServices()
      const visibleServices = services.filter(s => s.visible !== false)

      const grouped: Record<string, Service[]> = {}
      visibleServices.forEach(s => {
        const cat = s.category || "Geral"
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(s)
      })

      const cats = Object.keys(grouped)
      setCategories(cats)
      setGroupedServices(grouped)

      if (cats.length > 0 && !cats.includes(active)) {
        setActive(cats[0])
      }
    }
    load()
  }, []) // active dependency removed to avoid loop, but logic inside handles init

  return (
    <section id="servicos" className="relative bg-card py-20 lg:py-36">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-10 transition-all duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
      >
        <div className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Nossos Serviços
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="font-display text-balance text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Serviços & Preços
          </h2>
        </div>

        {/* Tabs */}
        {categories.length > 0 && (
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`min-w-[120px] border px-6 py-3 text-[12px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${active === cat
                  ? "border-primary bg-primary text-secondary-foreground"
                  : "border-white/10 bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Service items */}
        <div className="mx-auto max-w-3xl">
          {groupedServices[active]?.map((service, i) => (
            <div
              key={service.id}
              className={`flex flex-col gap-2 py-8 sm:flex-row sm:items-start sm:justify-between ${i !== 0 ? "border-t border-border/50" : ""
                }`}
            >
              <div className="flex-1">
                <div className="flex items-baseline gap-4">
                  <h3 className="font-display text-xl font-semibold text-foreground lg:text-2xl">
                    {service.name}
                  </h3>
                  <div className="hidden flex-1 border-b border-dotted border-border/50 sm:block" />
                  <span className="text-xl font-bold text-primary lg:text-2xl">
                    R$ {service.price.toFixed(2)}
                  </span>
                </div>
                {/* 
                  Since description isn't in Service type yet, we can omit it or add it later. 
                  For now we just show duration. 
                */}
                <span className="mt-2 inline-block text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
                  {service.durationMin} min
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/agendar"
            className="inline-flex items-center justify-center border border-primary bg-transparent px-10 py-4 text-[13px] font-semibold uppercase tracking-[0.15em] text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            Agendar Agora
          </Link>
        </div>
      </div>
    </section>
  )
}
