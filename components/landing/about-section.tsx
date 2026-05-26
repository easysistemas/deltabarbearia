"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useReveal } from "@/hooks/use-reveal"
import { Shield, Clock, Heart, Gem } from "lucide-react"
import { fetchBusinessConfig } from "@/lib/db_actions"
import type { BusinessConfig } from "@/lib/types"

const QUALITIES = [
  { icon: Shield, label: "Higiene" },
  { icon: Clock, label: "Pontualidade" },
  { icon: Heart, label: "Exclusividade" },
  { icon: Gem, label: "Premium" },
]

export function AboutSection() {
  const { ref, visible } = useReveal()
  const [config, setConfig] = useState<BusinessConfig | null>(null)

  useEffect(() => {
    fetchBusinessConfig().then(setConfig)
  }, [])

  const image = config?.aboutImage || "/images/about-space.jpg"
  const title = config?.aboutTitle || "Elegancia e precisao em cada detalhe"
  const description = config?.aboutDescription ||
    "A TRIV Barbearia nasceu da paixão pelo cuidado masculino. Aqui, cada corte é tratado como uma arte, cada cliente como único.\n\nVenha conhecer um novo padrão de barbearia em Fortaleza."

  return (
    <section id="sobre" className="relative overflow-hidden py-28 lg:py-36">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-10 transition-all duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
      >
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Image side */}
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={image}
                alt="Ambiente da TRIV Barbearia"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {/* Decorative border */}
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full border border-primary/20" />
          </div>

          {/* Text side */}
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px w-8 bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
                Sobre o Espaco
              </span>
            </div>

            <h2 className="font-display text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {title}
            </h2>

            <div className="mt-8 flex flex-col gap-5">
              <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                {description}
              </p>
            </div>

            {/* Qualities row */}
            <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {QUALITIES.map((q) => {
                const Icon = q.icon
                return (
                  <div key={q.label} className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center border border-primary/30 text-primary">
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {q.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
