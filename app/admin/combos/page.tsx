"use client"

import { useState, useEffect } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
    getPlans,
    setPlans,
    addPlan,
    updatePlan,
    deletePlan,
    fetchPlans,
    fetchCustomerPlans,
    getCustomerPlans,
    updateCustomerPlan,
    getPlanUsage,
    getBarbers,
    fetchBarbers,
    addAppointment
} from "@/lib/store"
import { createCustomerPlanDB } from "@/lib/db_actions"
import type { Plan, CustomerPlan, Barber, PaymentMethod, Appointment } from "@/lib/types"
import { Plus, Edit2, Trash2, X, Check, DollarSign, Star, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { StatusBadge } from "@/components/admin/status-badge"
import { format, parseISO, addDays, addMonths } from "date-fns"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CombosPage() {
    const [planList, setPlanList] = useState<Plan[]>([])
    const [customerPlans, setCustomerPlans] = useState<CustomerPlan[]>([])
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [loading, setLoading] = useState(true)

    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Plan | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

    // Customer Plan Modal
    const [customerModalOpen, setCustomerModalOpen] = useState(false)

    // Renewal Modal
    const [renewalModalOpen, setRenewalModalOpen] = useState(false)
    const [renewingPlan, setRenewingPlan] = useState<CustomerPlan | null>(null)

    const load = async () => {
        setLoading(true)
        const [plansData, custData, barbersData] = await Promise.all([fetchPlans(), fetchCustomerPlans(), fetchBarbers()])
        setPlanList(plansData)
        setBarbers(barbersData)

        // Calculate usage for each plan
        const enrichedCustData = custData.map(cp => ({
            ...cp,
            usageCount: getPlanUsage(cp.customerPhone, cp.startDate)
        }))

        setCustomerPlans(enrichedCustData)
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const handleDelete = async (id: string) => {
        await deletePlan(id)
        load()
        setConfirmDelete(null)
    }

    async function handleAddCustomerPlan(data: any) {
        try {
            // 1. Calculate Dates
            const startDate = new Date(`${data.date}T${data.time}:00`)
            const renewsAt = addMonths(startDate, 1).toISOString()

            // 2. Create Customer Plan
            await createCustomerPlanDB({
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                planId: data.planId,
                startDate: startDate.toISOString(),
                renewsAt: renewsAt,
                status: "active",
                active: true,
                usageCount: 0
            })

            // 3. Create Financial Record (Appointment)
            const plan = planList.find(p => p.id === data.planId)
            if (plan) {
                const newAppt: Appointment = {
                    id: crypto.randomUUID(),
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    barberId: data.barberId || (barbers[0]?.id || "loja"), // Default to first barber or store if none selected
                    serviceId: "ASSINATURA_PLANO",
                    serviceIds: [], // No specific service IDs for plan purchase
                    products: [],
                    startAt: startDate.toISOString(),
                    endAt: addDays(startDate, 0).toISOString(), // Instant event, but let's keep it same day
                    status: "PAGO",
                    price: plan.price,
                    paidAmount: plan.price,
                    paymentMethod: data.paymentMethod,
                    notes: `Assinatura do plano: ${plan.name}`,
                    createdAt: new Date().toISOString(),
                    metadata: {
                        planId: plan.id,
                        planName: plan.name,
                        commissionRate: plan.professionalCommissionPercent, // Attribute commission based on plan settings
                        usageCommission: plan.usageLimit ? (plan.price / plan.usageLimit) * (plan.professionalCommissionPercent || 0) / 100 : undefined,
                        isPlanAction: true
                    }
                }
                await addAppointment(newAppt)
            }

            // Reload to fetch from DB
            load()
            setCustomerModalOpen(false)
        } catch (error: any) {
            console.error("Error creating plan:", error)
            alert(`Erro ao criar assinatura: ${error.message || JSON.stringify(error)}`)
        }
    }

    async function toggleCustomerPlanActive(id: string, current: boolean) {
        await updateCustomerPlan(id, { active: !current })
        load()
    }

    return (
        <AdminShell>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Combos & Planos</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie assinaturas e planos
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setCustomerModalOpen(true)}
                            variant="outline"
                            className="bg-transparent border-gray-700 hover:bg-gray-800"
                        >
                            <Plus size={16} className="mr-1.5" />
                            Novo Assinante
                        </Button>
                        <Button
                            onClick={() => { setEditing(null); setModalOpen(true) }}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus size={16} className="mr-1.5" />
                            Novo Plano
                        </Button>
                    </div>
                </div>

                {/* Active Subscriptions Section */}
                <section>
                    <h2 className="mb-4 text-xl font-semibold text-foreground">Assinaturas Ativas</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {customerPlans.filter(cp => cp.active).map(cp => {
                            const plan = planList.find(p => p.id === cp.planId)
                            return (
                                <Card key={cp.id} className="border-l-4 border-l-primary bg-card">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{cp.customerName}</span>
                                                <span className="text-xs text-muted-foreground">{cp.customerPhone}</span>
                                            </div>
                                            <StatusBadge status={cp.active ? "CONFIRMADO" : "CANCELADO"} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-emerald-400">{plan?.name || "Plano Indisponível"}</p>
                                                <p className="text-xs text-muted-foreground">Início: {format(parseISO(cp.startDate), "dd/MM/yyyy")}</p>
                                                <p className="text-xs text-muted-foreground">Expira: {format(addMonths(parseISO(cp.startDate), 1), "dd/MM/yyyy")}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-foreground">{cp.usageCount}</span>
                                                <span className="text-xs text-muted-foreground block">Utilizações</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-4 w-full h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-muted/50"
                                            onClick={() => toggleCustomerPlanActive(cp.id, cp.active ?? false)}
                                        >
                                            Cancelar Assinatura
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 w-full h-8 text-xs text-primary border-primary/20 hover:bg-primary/10"
                                            onClick={() => {
                                                setRenewingPlan(cp)
                                                setRenewalModalOpen(true)
                                            }}
                                        >
                                            Renovar Plano
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                        {customerPlans.filter(cp => cp.active).length === 0 && (
                            <div className="col-span-full py-8 text-center text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                                Nenhuma assinatura ativa encontrada.
                            </div>
                        )}
                    </div>
                </section>

                <div className="h-px bg-border my-2" />

                {/* Plans List */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {planList.map((p) => (
                        <div
                            key={p.id}
                            className={`rounded-xl border bg-card p-6 ${p.visible === false ? 'border-muted/50 opacity-60' : 'border-border'}`}
                        >
                            <div className="mb-3 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                                        {p.name}
                                        {p.featured && <Star size={14} className="fill-yellow-500 text-yellow-500" />}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{p.period}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.visible === false && <EyeOff size={14} className="text-muted-foreground" />}
                                    <span className="font-bold text-primary">
                                        R$ {p.price.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                                {p.description}
                            </p>

                            <ul className="mb-4 space-y-1 text-xs text-card-foreground/80">
                                {p.features.slice(0, 3).map((f, i) => (
                                    <li key={i} className="flex items-center gap-1.5">
                                        <Check size={12} className="text-primary" />
                                        {f}
                                    </li>
                                ))}
                                {p.features.length > 3 && (
                                    <li className="pl-4 text-muted-foreground">
                                        + {p.features.length - 3} itens...
                                    </li>
                                )}
                            </ul>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setEditing(p); setModalOpen(true) }}
                                    className="flex-1 border-border bg-transparent text-foreground hover:bg-secondary"
                                >
                                    <Edit2 size={14} className="mr-1" />
                                    Editar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setConfirmDelete(p.id)}
                                    className="border-border bg-transparent text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </section>
            </div>

            {modalOpen && (
                <PlanModal
                    plan={editing}
                    onClose={() => setModalOpen(false)}
                    onSave={async (data) => {
                        if (editing) {
                            await updatePlan(editing.id, data)
                        } else {
                            await addPlan({ id: `p_${Date.now()}`, ...data })
                        }
                        load()
                        setModalOpen(false)
                    }}
                />
            )}

            {customerModalOpen && (
                <CustomerPlanModal
                    plans={planList}
                    barbers={barbers}
                    onClose={() => setCustomerModalOpen(false)}
                    onSave={handleAddCustomerPlan}
                />
            )}

            {confirmDelete && (
                <DeleteConfirmation
                    onConfirm={() => handleDelete(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {renewalModalOpen && renewingPlan && (
                <RenewalModal
                    plan={renewingPlan}
                    fullPlan={planList.find(p => p.id === renewingPlan.planId)}
                    barbers={barbers}
                    onClose={() => setRenewalModalOpen(false)}
                    onSave={async (renewalData) => {
                        // 1. Update Customer Plan
                        const plan = planList.find(p => p.id === renewingPlan.planId)
                        if (!plan) return

                        await updateCustomerPlan(renewingPlan.id, {
                            startDate: renewalData.date,
                            active: true,
                            usageCount: 0 // Reset usage on renewal
                        })

                        // 2. Create Financial Record (Appointment)
                        const newAppt: Appointment = {
                            id: crypto.randomUUID(),
                            customerName: renewingPlan.customerName,
                            customerPhone: renewingPlan.customerPhone,
                            barberId: renewalData.barberId,
                            serviceId: "RENOVACAO_PLANO", // Special ID or can use plan ID
                            // We can use a special logic in reports to show "Renovação: Nome do Plano"
                            serviceIds: [],
                            products: [],
                            startAt: renewalData.date,
                            endAt: renewalData.date, // Instant event
                            status: "PAGO",
                            price: plan.price,
                            paidAmount: plan.price,
                            paymentMethod: renewalData.paymentMethod,
                            notes: `Renovação do plano: ${plan.name}`,
                            createdAt: new Date().toISOString(),
                            metadata: {
                                planId: plan.id,
                                planName: plan.name,
                                commissionRate: renewalData.commissionRate, // Save rate to metadata
                                usageCommission: plan.usageLimit ? (plan.price / plan.usageLimit) * (renewalData.commissionRate || 0) / 100 : undefined,
                                isPlanAction: true
                            }
                        }

                        await addAppointment(newAppt)

                        load()
                        setRenewalModalOpen(false)
                    }}
                />
            )}
        </AdminShell>
    )
}

function PlanModal({
    plan,
    onClose,
    onSave,
}: {
    plan: Plan | null
    onClose: () => void
    onSave: (data: Omit<Plan, "id">) => Promise<void>
}) {
    const [name, setName] = useState(plan?.name || "")
    const [price, setPrice] = useState(plan?.price?.toString() || "0")
    const [period, setPeriod] = useState(plan?.period || "/mes")
    const [description, setDescription] = useState(plan?.description || "")
    const [features, setFeatures] = useState(plan?.features?.join("\n") || "")
    const [visible, setVisible] = useState(plan?.visible ?? true)
    const [featured, setFeatured] = useState(plan?.featured ?? false)
    const [professionalCommissionPercent, setProfessionalCommissionPercent] = useState(plan?.professionalCommissionPercent?.toString() || "40")
    const [usageLimit, setUsageLimit] = useState(plan?.usageLimit?.toString() || "4")
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        await onSave({
            name,
            price: parseFloat(price) || 0,
            period,
            description,
            features: features.split("\n").filter(f => f.trim()),
            visible,
            featured,
            professionalCommissionPercent: parseFloat(professionalCommissionPercent) || 0,
            usageLimit: parseInt(usageLimit) || 1
        })
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-card-foreground">
                        {plan ? "Editar Combo" : "Novo Combo"}
                    </h2>
                    <button onClick={onClose} aria-label="Fechar">
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-card-foreground">Nome</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Corte Mensal"
                            className="bg-secondary"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-medium text-card-foreground">Preço (R$)</label>
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="bg-secondary"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-medium text-card-foreground">Período</label>
                            <Input
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                placeholder="Ex: /mes"
                                className="bg-secondary"
                            />
                        </div>
                    </div>

                    {/* New Commission Field */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-card-foreground">
                            Comissão do Profissional (%)
                        </label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={professionalCommissionPercent}
                                onChange={(e) => setProfessionalCommissionPercent(e.target.value)}
                                className="bg-secondary"
                                placeholder="Ex: 40"
                            />
                            <div className="flex items-center justify-center min-w-[100px] text-sm text-muted-foreground bg-secondary/50 rounded-md px-3 border border-border">
                                R$ {((parseFloat(price) || 0) * (parseFloat(professionalCommissionPercent) || 0) / 100).toFixed(2)}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Porcentagem do valor do plano que será repassada ao profissional na renovação.
                        </p>
                    </div>

                    {/* Usage Limit Field */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-card-foreground">
                            Limite de Utilizações (Usos)
                        </label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min="1"
                                value={usageLimit}
                                onChange={(e) => setUsageLimit(e.target.value)}
                                className="bg-secondary"
                                placeholder="Ex: 4"
                            />
                            <div className="flex items-center justify-center min-w-[100px] text-sm text-muted-foreground bg-secondary/50 rounded-md px-3 border border-border">
                                R$ {usageLimit && parseInt(usageLimit) > 0 ? ((parseFloat(price) || 0) / parseInt(usageLimit) * (parseFloat(professionalCommissionPercent) || 0) / 100).toFixed(2) : "0.00"} / uso
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Define quantas vezes o cliente pode utilizar o plano e o valor da comissão por utilização.
                        </p>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-card-foreground">Descrição</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Breve descrição do plano"
                            className="bg-secondary resize-none"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-card-foreground">Funcionalidades (uma por linha)</label>
                        <Textarea
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            placeholder="4 cortes por mês&#10;Agendamento prioritário"
                            className="bg-secondary resize-none"
                            rows={4}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="text-sm font-medium text-card-foreground">Visível no site</span>
                        <Switch checked={visible} onCheckedChange={setVisible} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="text-sm font-medium text-card-foreground">Destaque (Popular)</span>
                        <Switch checked={featured} onCheckedChange={setFeatured} />
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={!name.trim() || loading}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                    >
                        {loading ? "Salvando..." : (plan ? "Salvar" : "Adicionar")}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function CustomerPlanModal({ plans, barbers, onClose, onSave }: any) {
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [planId, setPlanId] = useState(plans[0]?.id || "")
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [time, setTime] = useState(format(new Date(), "HH:mm"))
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX")
    const [barberId, setBarberId] = useState<string>(barbers[0]?.id || "")

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Vincular Cliente a Plano</h2>
                    <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
                </div>
                <div className="flex flex-col gap-4">
                    <div>
                        <Label>Nome do Cliente</Label>
                        <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome completo" />
                    </div>
                    <div>
                        <Label>Telefone</Label>
                        <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                        <Label>Plano</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={planId}
                            onChange={e => setPlanId(e.target.value)}
                        >
                            {plans.map((p: Plan) => (
                                <option key={p.id} value={p.id}>{p.name} - R${p.price.toFixed(2)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Data de Início</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <Label>Hora</Label>
                            <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Forma de Pagamento</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                            >
                                <option value="PIX">PIX</option>
                                <option value="DINHEIRO">Dinheiro</option>
                                <option value="CARTAO">Cartão</option>
                                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                            </select>
                        </div>
                        <div>
                            <Label>Profissional (Venda)</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={barberId}
                                onChange={e => setBarberId(e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                {barbers.map((b: Barber) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Button onClick={() => onSave({ customerName, customerPhone, planId, date, time, paymentMethod, barberId })} className="bg-primary text-primary-foreground mt-2">
                        Confirmar Assinatura
                    </Button>
                </div>
            </div>
        </div>
    )
}

function DeleteConfirmation({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl">
                <h3 className="mb-2 text-lg font-bold text-card-foreground">Excluir Item</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                    Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1 border-border bg-transparent text-foreground hover:bg-secondary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Excluir
                    </Button>
                </div>
            </div>
        </div>
    )
}
function RenewalModal({ plan, fullPlan, barbers, onClose, onSave }: {
    plan: CustomerPlan
    fullPlan?: Plan
    barbers: Barber[]
    onClose: () => void
    onSave: (data: { date: string, paymentMethod: PaymentMethod, barberId: string, commissionRate: number }) => Promise<void>
}) {
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [time, setTime] = useState(format(new Date(), "HH:mm"))
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX")
    const [barberId, setBarberId] = useState<string>(barbers[0]?.id || "")

    // Initial commission rate from plan or default 40
    const [commissionRate, setCommissionRate] = useState<number>(fullPlan?.professionalCommissionPercent ?? 40)

    useEffect(() => {
        if (fullPlan?.professionalCommissionPercent !== undefined) {
            setCommissionRate(fullPlan.professionalCommissionPercent)
        }
    }, [fullPlan])

    const handleSave = () => {
        const fullDate = `${date}T${time}:00`
        const localDate = new Date(fullDate)
        onSave({
            date: localDate.toISOString(),
            paymentMethod,
            barberId,
            commissionRate
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Renovar Plano</h2>
                    <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
                </div>

                <div className="mb-4 p-4 bg-secondary/30 rounded-lg">
                    <p className="font-semibold text-foreground">{fullPlan?.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.customerName}</p>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-bold text-primary">Valor: R$ {fullPlan?.price.toFixed(2)}</p>
                        <div className="text-xs bg-secondary px-2 py-1 rounded border border-border text-muted-foreground">
                            Comissão: {commissionRate}% (R$ {((fullPlan?.price || 0) * commissionRate / 100).toFixed(2)})
                        </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                        {date && !isNaN(new Date(date).getTime()) ? (
                            <p>Nova Validade: {format(new Date(date), "dd/MM/yyyy")} até {format(addMonths(new Date(date), 1), "dd/MM/yyyy")}</p>
                        ) : (
                            <p>Data inválida</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label>Data da Renovação</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <Label>Hora</Label>
                            <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <Label>Forma de Pagamento</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        >
                            <option value="PIX">Pix</option>
                            <option value="DINHEIRO">Dinheiro</option>
                            <option value="CARTAO_DEBITO">Cartão de Débito</option>
                            <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                            <option value="PLANO">Plano</option>
                        </select>
                    </div>

                    <div>
                        <Label>Vendedor / Profissional (para comissão)</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={barberId}
                            onChange={(e) => setBarberId(e.target.value)}
                        >
                            <option value="">-- Selecione (Opcional) --</option>
                            {barbers.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Se selecionado, receberá <strong>{commissionRate}%</strong> de comissão.
                        </p>
                    </div>

                    <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground mt-2">
                        Confirmar Renovação
                    </Button>
                </div>
            </div>
        </div>
    )
}
