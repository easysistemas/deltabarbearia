"use client"

import { useEffect, useState } from "react"
import { Shield, Clock, Heart, Gem } from "lucide-react"
import { fetchBusinessConfig } from "@/lib/db_actions"
import type { BusinessConfig } from "@/lib/types"

const DEFAULT_DIFFERENTIALS = [
  {
    icon: Shield,
    title: "Higiene Impecavel",
    description: "Todos os instrumentos sao esterilizados. Ambiente limpo e preparado para cada cliente.",
  },
  {
    icon: Clock,
    title: "Pontualidade",
    description: "Respeitamos seu tempo. Sistema de agendamento online para evitar esperas.",
  },
  {
    icon: Heart,
    title: "Atendimento Exclusivo",
    description: "Cada cliente e unico. Ouvimos suas preferencias e entregamos resultados perfeitos.",
  },
  {
    icon: Gem,
    title: "Produtos Premium",
    description: "Trabalhamos apenas com as melhores marcas do mercado para cuidar do seu visual.",
  },
]

export function DifferentialsSection() {
  const [config, setConfig] = useState<BusinessConfig | null>(null)

  useEffect(() => {
    fetchBusinessConfig().then(setConfig)
  }, [])

  const differentials = config?.differentials && config.differentials.length > 0
    ? config.differentials.map((d, index) => ({
      ...d,
      icon: DEFAULT_DIFFERENTIALS[index % DEFAULT_DIFFERENTIALS.length].icon // Fallback icon cycle
    }))
    : DEFAULT_DIFFERENTIALS

  return (
    <section id="diferenciais" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            Por que nos escolher
          </p>
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Nossos diferenciais
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {differentials.map((d, i) => {
            const Icon = d.icon
            return (
              <div
                key={i}
                className="group rounded-xl border border-border bg-card p-6 text-center transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">{d.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{d.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
