"use client"

import { useEffect, useState } from "react"
import { useReveal } from "@/hooks/use-reveal"
import { MapPin, Clock, Phone, MessageCircle } from "lucide-react"
import { fetchBusinessConfig } from "@/lib/db_actions"
import type { BusinessConfig } from "@/lib/types"

const SCHEDULE = [
  { day: "Segunda a Sexta", time: "09:00 - 19:00" },
  { day: "Sabado", time: "09:00 - 19:00" },
  { day: "Domingo", time: "Fechado" },
]

export function LocationSection() {
  const { ref, visible } = useReveal()
  const [config, setConfig] = useState<BusinessConfig | null>(null)

  useEffect(() => {
    fetchBusinessConfig().then(setConfig)
  }, [])

  const title = config?.locationTitle || "Venha nos visitar"
  const address = config?.locationAddress || "Rua Apolo, n. 28\nDamas - Fortaleza / CE\nCEP: 60426-080"
  const mapUrl = config?.locationMapUrl || "https://maps.google.com/maps?q=Rua%20Apolo%2028%20Damas%20Fortaleza%20CE&t=&z=15&ie=UTF8&iwloc=&output=embed"
  const phone = config?.locationPhone || "(85) 99169-4689"
  const whatsappUrl = config?.contactWhatsapp || "https://wa.me/5585991694689?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20um%20hor%C3%A1rio%20na%20TRIV%20Barbearia"

  return (
    <section id="contato" className="relative bg-card py-28 lg:py-36">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-10 transition-all duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
      >
        <div className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Localização & Contato
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="font-display text-balance text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="relative aspect-[16/10] overflow-hidden border border-border">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização TRIV Barbearia"
                className="absolute inset-0"
              />
            </div>
          </div>

          {/* Info cards */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Address */}
            <div className="border-b border-border/50 pb-8">
              <div className="mb-4 flex items-center gap-3">
                <MapPin size={18} className="text-primary" strokeWidth={1.5} />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground">
                  Endereco
                </h3>
              </div>
              <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
                {address}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address.replace(/\n/g, " "))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-primary transition-colors hover:text-primary/80"
              >
                Como Chegar
                <span className="h-px w-4 bg-current" />
              </a>
            </div>

            {/* Hours */}
            <div className="border-b border-border/50 pb-8">
              <div className="mb-4 flex items-center gap-3">
                <Clock size={18} className="text-primary" strokeWidth={1.5} />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground">
                  Horarios
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {SCHEDULE.map((s) => (
                  <div key={s.day} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{s.day}</span>
                    <span
                      className={`text-sm font-medium ${s.time === "Fechado"
                        ? "text-destructive/80"
                        : "text-foreground"
                        }`}
                    >
                      {s.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Phone size={18} className="text-primary" strokeWidth={1.5} />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground">
                  Telefone / WhatsApp
                </h3>
              </div>
              <a
                href={`tel:${phone.replace(/\D/g, "")}`}
                className="text-lg text-muted-foreground transition-colors hover:text-primary"
              >
                {phone}
              </a>
              <div className="mt-6">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 border border-primary bg-transparent px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                >
                  <MessageCircle size={16} />
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
