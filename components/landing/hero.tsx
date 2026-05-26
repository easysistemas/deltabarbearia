"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { fetchBusinessConfig } from "@/lib/db_actions"
import type { BusinessConfig } from "@/lib/types"

export function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  const [config, setConfig] = useState<BusinessConfig | null>(null)

  useEffect(() => {
    fetchBusinessConfig().then(data => {
      if (data) setConfig(data)
    })
    const t = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(t)
  }, [])

  const bgImage = config?.heroBgImage
  const title = config?.heroTitle || "Onde o cuidado masculino"
  const subtitle = config?.heroSubtitle || "é levado a sério"

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-black">
      {/* Background image */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${loaded && bgImage ? "opacity-100" : "opacity-0"}`}>
        {bgImage && (
          <Image
            src={bgImage}
            alt="Interior da TRIV Barbearia"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 text-center lg:px-10 lg:py-32">
        <div
          className={`transition-all duration-1000 ease-out ${loaded
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0"
            }`}
        >
          <div className="mb-6 flex items-center justify-center gap-4 lg:mb-8">
            <div className="h-px w-8 bg-primary/60 lg:w-12" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary lg:text-[11px]">
              Barbearia Premium em Fortaleza
            </span>
            <div className="h-px w-8 bg-primary/60 lg:w-12" />
          </div>

          <h1 className="font-display text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-8xl">
            {title}
            <br />
            <span className="text-primary">{subtitle}</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground lg:text-lg">
            A TRIV é uma barbearia para quem valoriza atendimento sério,
            ambiente organizado e o corte bem-feito.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/agendar"
              className="group inline-flex items-center justify-center border border-primary bg-primary px-10 py-4 text-[13px] font-semibold uppercase tracking-[0.15em] text-primary-foreground transition-all duration-300 hover:bg-transparent hover:text-primary"
            >
              Agendar Horario
            </Link>
            <a
              href="#galeria"
              className="inline-flex items-center justify-center border border-border bg-transparent px-10 py-4 text-[13px] font-semibold uppercase tracking-[0.15em] text-foreground transition-all duration-300 hover:border-primary hover:text-primary"
            >
              Conheça o Espaço
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <a
          href="#sobre"
          className="flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronDown size={24} className="animate-bounce" />
        </a>
      </div>
    </section>
  )
}
