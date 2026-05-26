import { useEffect, useState } from "react"
import { Check, Star } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCustomerPlan } from "@/hooks/use-customer-plan"
import { Plan } from "@/lib/types"

interface PlanSelectorProps {
    customerPhone: string | undefined
    selectedPlanId: string | undefined
    plans: Plan[]
    onSelectPlan: (planId: string) => void
}

export function PlanSelector({ customerPhone, selectedPlanId, plans, onSelectPlan }: PlanSelectorProps) {
    const { plan: customerActivePlan, loading } = useCustomerPlan(customerPhone)

    // Logic to verify if the plan is valid for the current selection context
    // For now, if they hava a plan in DB, we show the selector

    if (loading) return <div className="text-xs text-muted-foreground animate-pulse">Verificando assinatura...</div>

    if (!customerActivePlan) return null

    // Find the plan details
    const activePlanDetails = plans.find(p => p.id === customerActivePlan.planId)

    return (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                    <Star className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-foreground">Aplicar Combo / Plano</h3>
                    <p className="text-xs text-muted-foreground">
                        Cliente possui plano ativo: <span className="font-medium text-primary">{activePlanDetails?.name || "Plano Desconhecido"}</span>
                    </p>
                </div>
            </div>

            <Select
                value={selectedPlanId}
                onValueChange={(val) => onSelectPlan(val)}
            >
                <SelectTrigger className="w-full border-primary/20 bg-background text-sm">
                    <SelectValue placeholder="Selecionar combo..." />
                </SelectTrigger>
                <SelectContent>
                    {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex items-center justify-between w-full gap-2">
                                <span>{plan.name}</span>
                                {activePlanDetails?.id === plan.id && (
                                    <span className="flex items-center text-xs text-primary">
                                        <Check className="mr-1 h-3 w-3" />
                                        Incluso
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <p className="mt-2 text-[10px] text-muted-foreground">
                Ao selecionar um combo, o preço do agendamento será atualizado automaticamente.
            </p>
        </div>
    )
}
