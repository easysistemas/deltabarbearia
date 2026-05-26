"use client"

import { useEffect, useState } from "react"
import { useReveal } from "@/hooks/use-reveal"
import { Star } from "lucide-react"
import { fetchBusinessConfig } from "@/lib/db_actions"
import type { BusinessConfig } from "@/lib/types"

const DEFAULT_TESTIMONIALS = [
  {
    name: "Marcos Vieira",
    text: "Uma experiência incrível. O atendimento é impecável e o corte ficou exatamente como eu queria. O ambiente é muito agradável, você se sente em casa.",
  },
  {
    name: "Davi Mendes",
    text: "Ambiente sofisticado, profissionais atenciosos e resultado impecável. Perfeito para quem busca qualidade e cuidado com os detalhes.",
  },
  {
    name: "Igor Nascimento",
    text: "Sempre saio satisfeito. A pontualidade é o diferencial deles. O agendamento online facilita muito. Recomendo de olhos fechados.",
  },
]

export function TestimonialsSection() {
  const { ref, visible } = useReveal()
  const [config, setConfig] = useState<BusinessConfig | null>(null)

  useEffect(() => {
    fetchBusinessConfig().then(setConfig)
  }, [])

  const testimonials = config?.testimonials && config.testimonials.length > 0
    ? config.testimonials
    : DEFAULT_TESTIMONIALS

  return (
    <section id="depoimentos" className="relative py-28 lg:py-36">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-10 transition-all duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
      >
        <div className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Depoimentos
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="font-display text-balance text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            O que dizem nossos clientes
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group flex flex-col border-t border-primary/30 pt-8 transition-all duration-500"
            >
              <div className="mb-6 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="fill-primary text-primary"
                  />
                ))}
              </div>

              <blockquote className="flex-1 font-display text-lg italic leading-relaxed text-foreground/90">
                {`\u201C${t.text}\u201D`}
              </blockquote>

              <div className="mt-8 flex items-center gap-3">
                <div className="h-px w-6 bg-primary/40" />
                <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {t.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
