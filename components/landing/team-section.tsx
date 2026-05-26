"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useReveal } from "@/hooks/use-reveal"
import { Instagram } from "lucide-react"
import { fetchBarbersDB } from "@/lib/db_actions"
import type { Barber } from "@/lib/types"

export function TeamSection() {
  const { ref, visible } = useReveal()
  const [barbers, setBarbers] = useState<Barber[]>([])

  useEffect(() => {
    fetchBarbersDB().then(data => {
      setBarbers(data)
    })
  }, [])

  return (
    <section id="equipe" className="relative py-28 lg:py-36">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-10 transition-all duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
      >
        <div className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Nossa Equipe
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="font-display text-balance text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Profissionais dedicados
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Conheça quem cuida do seu visual. Cada profissional traz sua
            especialidade para garantir o melhor resultado.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 lg:gap-10">
          {barbers.map((barber) => (
            <div
              key={barber.name}
              className="group flex w-[calc(50%-12px)] flex-col items-center text-center sm:w-56 lg:w-64"
            >
              <div className="relative mb-4 aspect-[3/4] w-full overflow-hidden rounded-lg bg-secondary">
                <Image
                  src={barber.avatarUrl || "/placeholder.svg"}
                  alt={barber.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>

              <div className="w-full">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {barber.name}
                  </h3>
                  {barber.instagram && (
                    <a
                      href={barber.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-primary"
                      aria-label={`Instagram de ${barber.name}`}
                    >
                      <Instagram size={14} />
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {barber.role}
                </p>
                {/* Minimalist: hide specialties or show very small */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
