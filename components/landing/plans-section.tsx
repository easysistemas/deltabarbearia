"use client"

import { useState, useEffect } from "react"
import { Check, Calendar, MessageSquare, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { fetchPlans } from "@/lib/store"
import type { Plan } from "@/lib/types"

export function PlansSection() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPlans()
        setPlans(data.filter(p => p.visible !== false))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || plans.length === 0) return null

  return (
    <section id="planos" className="bg-secondary/50 py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Planos Mensais
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Economize com nossos planos
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-8 transition-all duration-300 ${plan.featured
                ? "border-primary bg-card shadow-xl shadow-primary/10"
                : "border-border bg-card hover:border-primary/30"
                }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase text-primary-foreground">
                  Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-card-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">R$ {plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-card-foreground">
                    <Check size={16} className="flex-shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className={`mt-8 w-full ${plan.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                  >
                    Assinar Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles size={24} />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Assinar {plan.name}</DialogTitle>
                    <DialogDescription className="text-base">
                      Siga o passo a passo para ativar seu plano mensal e aproveitar as vantagens exclusivas.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-6 space-y-6">
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground">
                        1
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold leading-none">Agende seu horário</p>
                        <p className="text-sm text-muted-foreground">
                          Clique no botão abaixo e realize o seu agendamento normalmente pelo site.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground">
                        2
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold leading-none">Informe o profissional</p>
                        <p className="text-sm text-muted-foreground">
                          Ao chegar na barbearia, informe ao barbeiro que você deseja aderir ao plano mensal.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground">
                        3
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold leading-none">Aproveite a experiência</p>
                        <p className="text-sm text-muted-foreground">
                          Pronto! Seu plano será ativado e você já começa a economizar no mesmo dia.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link href="/agendar">
                      <Button className="w-full gap-2 py-6 text-base font-bold uppercase tracking-wider">
                        <Calendar size={18} />
                        Marcar Agendamento
                      </Button>
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
