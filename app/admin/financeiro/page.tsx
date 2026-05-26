"use client"

import { useState, useEffect, useMemo } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from "lucide-react"
import {
    fetchExpenses,
    addExpense,
    deleteExpense,
    fetchAppointments,
    getExpenses,
    getAppointments,
    fetchBarbers,
    getBarbers,
    fetchServices,
    getServices
} from "@/lib/store"
import { fetchProductsDB, fetchBusinessConfig, fetchExpenseCategoriesDB, createExpenseCategoryDB } from "@/lib/db_actions"
import type { Expense, Appointment, Barber, Product, BusinessConfig, Service } from "@/lib/types"
import {
    format,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
    parseISO,
    startOfDay,
    endOfDay,
    subDays,
    startOfWeek,
    endOfWeek,
    isSameDay
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area
} from "recharts"

export default function FinanceiroPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [config, setConfig] = useState<BusinessConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "custom">("daily")
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [customStart, setCustomStart] = useState(format(new Date(), "yyyy-MM-dd"))
    const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"))

    // Categories
    const [categories, setCategories] = useState<string[]>([
        "Produtos (Reposição)",
        "Serviço (Manutenção)",
        "Contas (Luz/Água)",
        "Comissao (Avulsa)",
        "Outros"
    ])
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")

    // New Expense State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [desc, setDesc] = useState("")
    const [amount, setAmount] = useState("")

    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [time, setTime] = useState(format(new Date(), "HH:mm"))
    const [category, setCategory] = useState("Outros")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const results = await Promise.all([
            fetchExpenses(),
            fetchAppointments(),
            fetchBarbers(),
            fetchServices(),
            fetchProductsDB(),
            fetchBusinessConfig(),
            fetchExpenseCategoriesDB()
        ])
        const categoriesData = results[6] as string[]

        setExpenses(getExpenses())
        setAppointments(getAppointments())
        setBarbers(getBarbers())
        setServices(results[3] as Service[])
        setProducts(results[4] as Product[])
        setConfig(results[5] as BusinessConfig)
        if (categoriesData && categoriesData.length > 0) {
            setCategories(categoriesData)
        }
        setLoading(false)
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return
        try {
            await createExpenseCategoryDB(newCategoryName.trim())
            const updatedCategories = await fetchExpenseCategoriesDB()
            setCategories(updatedCategories)
            setCategory(newCategoryName.trim())
            setIsAddingCategory(false)
            setNewCategoryName("")
        } catch (error) {
            console.error("Error adding category:", error)
            alert("Erro ao adicionar categoria")
        }
    }

    async function handleAddExpense() {
        if (!desc || !amount || !date || !time) return

        try {
            // Handle potentially comma-separated amount
            const numericAmount = parseFloat(amount.replace(",", "."))
            if (isNaN(numericAmount)) {
                alert("Valor inválido")
                return
            }

            const localDateTime = new Date(`${date}T${time}:00`)

            const newExpense: Expense = {
                id: crypto.randomUUID(),
                description: desc,
                amount: numericAmount,
                date: localDateTime.toISOString(), // Send UTC
                category,
                paymentMethod: "DINHEIRO"
            }
            await addExpense(newExpense)
            // Force reload data to ensure UI updates
            await fetchExpenses()
            setExpenses(getExpenses())

            setIsModalOpen(false)
            setDesc("")
            setAmount("")

            // Reset to current time
            const now = new Date()
            setDate(format(now, "yyyy-MM-dd"))
            setTime(format(now, "HH:mm"))
        } catch (error) {
            console.error("Failed to add expense:", error)
            alert("Erro ao salvar despesa. Tente novamente.")
        }
    }

    async function handleDeleteExpense(id: string) {
        if (confirm("Tem certeza que deseja excluir esta despesa?")) {
            await deleteExpense(id)
            setExpenses(getExpenses())
        }
    }

    // --- Filter Logic ---
    const { startDate, endDate } = useMemo(() => {
        const now = selectedDate
        let start = startOfDay(now)
        let end = endOfDay(now)

        if (period === "weekly") {
            start = startOfWeek(now, { locale: ptBR })
            end = endOfWeek(now, { locale: ptBR })
        } else if (period === "monthly") {
            start = startOfMonth(now)
            end = endOfMonth(now)
        } else if (period === "custom") {
            if (customStart && customEnd) {
                const s = new Date(customStart + "T00:00:00")
                const e = new Date(customEnd + "T00:00:00")
                if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                    start = startOfDay(s)
                    end = endOfDay(e)
                }
            }
        }

        return { startDate: start, endDate: end }
    }, [period, selectedDate, customStart, customEnd])

    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => {
            const d = parseISO(a.startAt)
            return isWithinInterval(d, { start: startDate, end: endDate }) &&
                (a.status === "PAGO" || a.status === "FINALIZADO")
        })
    }, [appointments, startDate, endDate])

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const d = parseISO(e.date)
            // Fix: startOfDay/endOfDay might have timezone issues if date string is just YYYY-MM-DD
            // parseISO("2023-10-10") -> 2023-10-10T00:00:00 local time usually
            return isWithinInterval(d, { start: startDate, end: endDate })
        })
    }, [expenses, startDate, endDate])

    // --- Calculations ---
    const totalIncome = filteredAppointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0)

    // Calculate Commissions (Aligned with Relatorios: 40% Service / 10% Product)
    // Refactored to support metadata.commissionRate for Plans
    let commissionService = 0

    filteredAppointments.forEach(a => {
        // Calculate Product Revenue for this appointment
        let apptProductRevenue = 0
        if (a.products && a.products.length > 0) {
            apptProductRevenue = a.products.reduce((pSum, p) => pSum + (p.price * p.quantity), 0)
        }

        const baseValue = a.paidAmount || 0
        const apptServiceRevenue = Math.max(0, baseValue - apptProductRevenue)

        // Determine Commission Rate
        // Default 40% (0.4) or use metadata.commissionRate
        let rate = (config?.defaultServiceCommissionPercent ?? 40) / 100
        if (a.metadata?.commissionRate !== undefined) {
            rate = Number(a.metadata.commissionRate) / 100
        } else {
            const service = services.find(s => s.id === a.serviceId)
            if (service?.commissionPercent != null) {
                rate = service.commissionPercent / 100
            }
        }

        commissionService += (apptServiceRevenue * rate)
    })

    // Calculate product commission based on commissioned flag
    const commissionProduct = filteredAppointments.reduce((sum, a) => {
        if (a.products && a.products.length > 0) {
            return sum + a.products.reduce((pSum, p) => {
                const productDef = products.find(prod => prod.id === p.productId)
                const isCommissioned = productDef ? (productDef.commissioned !== false) : true
                if (isCommissioned) {
                    const productRate = (config?.defaultProductCommissionPercent ?? 10) / 100
                    return pSum + (p.price * p.quantity * productRate)
                }
                return pSum
            }, 0)
        }
        return sum
    }, 0)

    const totalCommissions = commissionService + commissionProduct

    // Check if totalRegisteredExpenses is defined, if not, recalculate it or ensure it's in scope
    // It seems I accidentally removed it in a previous step or it's out of scope.
    // Re-calculating it here based on filteredExpenses
    const totalRegisteredExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

    const totalExpense = totalRegisteredExpenses + totalCommissions
    const profit = totalIncome - totalExpense

    // --- Chart Data ---
    const chartData = useMemo(() => {
        const dataMap = new Map<string, { name: string, entradas: number, saidas: number, saldo: number }>()

        // Helper to format key based on period
        const formatKey = (d: Date) => {
            if (period === "daily") return format(d, "HH:00") // Group by hour
            return format(d, "dd/MM") // Group by day
        }

        // Initialize map with empty slots if needed? 
        // For simplicity let's just map existing data.

        filteredAppointments.forEach(a => {
            const date = parseISO(a.startAt)
            const key = formatKey(date)
            if (!dataMap.has(key)) dataMap.set(key, { name: key, entradas: 0, saidas: 0, saldo: 0 })

            const entry = dataMap.get(key)!
            entry.entradas += (a.paidAmount || 0)

            // Commission is an expense that happens at same time?
            // Yes, let's attribute commission expense to the appointment time
            const barber = barbers.find(b => b.id === a.barberId)

            // Calculate Product Revenue/Commission
            let productCommission = 0
            let productRevenue = 0
            if (a.products && a.products.length > 0) {
                productRevenue = a.products.reduce((pSum, p) => pSum + (p.price * p.quantity), 0)
                productCommission = a.products.reduce((pSum, p) => {
                    const productDef = products.find(prod => prod.id === p.productId)
                    const isCommissioned = productDef ? (productDef.commissioned !== false) : true
                    if (isCommissioned) {
                        const productRate = (config?.defaultProductCommissionPercent ?? 10) / 100
                        return pSum + (p.price * p.quantity * productRate)
                    }
                    return pSum
                }, 0)
            }

            const baseValue = a.paymentMethod === "PLANO" && !a.metadata?.isRenewal
                ? (a.price || 0)
                : (a.paidAmount || 0)

            // Service Revenue part
            const serviceBase = Math.max(0, baseValue - productRevenue)

            // Determine Service Rate
            let serviceRate = (config?.defaultServiceCommissionPercent ?? 40) / 100
            if (a.metadata?.commissionRate !== undefined) {
                serviceRate = Number(a.metadata.commissionRate) / 100
            } else {
                const service = services.find(s => s.id === a.serviceId)
                if (service?.commissionPercent != null) {
                    serviceRate = service.commissionPercent / 100
                }
            }

            const serviceCommission = serviceBase * serviceRate

            entry.saidas += (serviceCommission + productCommission)
        })

        filteredExpenses.forEach(e => {
            const date = parseISO(e.date)
            // For expenses without time, they confirm to "start of day". 
            // If daily view, they might appear at 00:00.
            const key = formatKey(date)
            if (!dataMap.has(key)) dataMap.set(key, { name: key, entradas: 0, saidas: 0, saldo: 0 })
            dataMap.get(key)!.saidas += e.amount
        })

        // Calculate Saldo for each point
        const result = Array.from(dataMap.values()).map(item => ({
            ...item,
            saldo: item.entradas - item.saidas
        }))

        return result.sort((a, b) => a.name.localeCompare(b.name))
    }, [filteredAppointments, filteredExpenses, period, barbers, config])


    return (
        <AdminShell>
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
                        <p className="text-muted-foreground">
                            {period === "daily" && `Visão do dia ${format(selectedDate, "dd/MM/yyyy")}`}
                            {period === "weekly" && "Visão Semanal"}
                            {period === "monthly" && `Visão Mensal (${format(selectedDate, "MMMM", { locale: ptBR })})`}
                            {period === "custom" && customStart && customEnd && !isNaN(new Date(customStart).getTime()) && !isNaN(new Date(customEnd).getTime()) &&
                                `Período: ${format(parseISO(customStart), "dd/MM")} até ${format(parseISO(customEnd), "dd/MM")}`
                            }
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-md border border-border bg-card p-0.5">
                            <Button
                                variant={period === "daily" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setPeriod("daily")}
                                className="h-7 text-xs"
                            >
                                Dia
                            </Button>
                            <Button
                                variant={period === "weekly" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setPeriod("weekly")}
                                className="h-7 text-xs"
                            >
                                Semana
                            </Button>
                            <Button
                                variant={period === "monthly" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setPeriod("monthly")}
                                className="h-7 text-xs"
                            >
                                Mês
                            </Button>
                            <Button
                                variant={period === "custom" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setPeriod("custom")}
                                className="h-7 text-xs"
                            >
                                Personalizado
                            </Button>
                        </div>

                        {period === "custom" && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="h-8 w-[130px] border-border bg-card text-xs"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="h-8 w-[130px] border-border bg-card text-xs"
                                />
                            </div>
                        )}

                        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-primary text-primary-foreground">
                            <Plus size={16} /> Despesa
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">
                                R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Serviços + Produtos + Planos
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
                            <DollarSign className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">
                                R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Repasse aos profissionais
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Despesas Extras</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                R$ {totalRegisteredExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Contas, produtos, manutenção
                            </p>
                        </CardContent>
                    </Card>
                    <Card className={profit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                            <DollarSign className="h-4 w-4 text-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Após descontos
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                <Card className="col-span-4 border-border shadow-md">
                    <CardHeader>
                        <CardTitle>Fluxo Financeiro</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Comparativo entre Entradas, Saídas e Saldo do período.
                        </p>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="#888888"
                                />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `R$${value}`}
                                    stroke="#888888"
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                        return [`R$ ${value.toFixed(2)}`, name]
                                    }}
                                    contentStyle={{
                                        backgroundColor: "#09090b",
                                        borderColor: "#27272a",
                                        borderRadius: "8px",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                    }}
                                    itemStyle={{ color: "#e4e4e7" }}
                                    cursor={{ opacity: 0.2 }}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                <Bar
                                    dataKey="entradas"
                                    name="Entradas"
                                    fill="url(#colorEntradas)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                                <Bar
                                    dataKey="saidas"
                                    name="Saídas"
                                    fill="url(#colorSaidas)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="saldo"
                                    name="Saldo"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                                    activeDot={{ r: 6 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Expenses List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Histórico de Despesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                                <div key={expense.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-foreground">{expense.description}</p>
                                        <div className="flex gap-2 text-sm text-muted-foreground">
                                            <span>{format(parseISO(expense.date), "dd/MM/yyyy")}</span>
                                            <span>•</span>
                                            <span>{expense.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-red-500">
                                            - R$ {expense.amount.toFixed(2)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteExpense(expense.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-8 text-center text-muted-foreground">
                                    Nenhuma despesa registrada neste período.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
                        <h2 className="mb-4 text-xl font-bold text-foreground">Nova Despesa</h2>

                        <div className="space-y-4">
                            <div>
                                <Label>Descrição</Label>
                                <Input
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                    placeholder="Ex: Cerveja, Conta de Luz"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label>Valor (R$)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label>Data</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label>Hora</Label>
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="flex justify-between items-center">
                                    Categoria
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] uppercase p-1"
                                        onClick={() => setIsAddingCategory(!isAddingCategory)}
                                    >
                                        {isAddingCategory ? "Selecionar" : "+ Nova Categoria"}
                                    </Button>
                                </Label>
                                {isAddingCategory ? (
                                    <div className="flex gap-2">
                                        <Input
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                            placeholder="Nome da categoria"
                                            className="h-10"
                                        />
                                        <Button onClick={handleAddCategory} size="sm">Salvar</Button>
                                    </div>
                                ) : (
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button onClick={handleAddExpense} disabled={!desc || !amount || !date || !time}>Adicionar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    )
}
