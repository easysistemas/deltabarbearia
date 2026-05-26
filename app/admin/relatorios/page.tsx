"use client"

import React from "react"

import { useState, useEffect, useMemo } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { StatusBadge } from "@/components/admin/status-badge"
import { getAppointments, getBarbers, getServices, exportCSV, fetchPlans, getPlans, fetchServices } from "@/lib/store"
import { fetchProductsDB, fetchBusinessConfig } from "@/lib/db_actions"
import type { Appointment, Plan, Product, BusinessConfig, Service } from "@/lib/types"
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import {
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Download,
  Package,
  Scissors,
  CreditCard,
  Banknote,
  Smartphone,
  Users,
  User,
  ChevronDown,
  ChevronRight,
  Store,
  Box,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Period = "today" | "week" | "month" | "custom"

export default function RelatoriosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [period, setPeriod] = useState<Period>("today")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const barbers = getBarbers()


  // Helper to get defaults
  const defaultServiceRate = (config?.defaultServiceCommissionPercent ?? 40) / 100
  const defaultProductRate = (config?.defaultProductCommissionPercent ?? 10) / 100

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  useEffect(() => {
    fetchPlans().then(() => setPlans(getPlans()))
    fetchProductsDB().then(setProducts)
    fetchServices().then(setServices)
    fetchBusinessConfig().then(setConfig)
    setAppointments(getAppointments())
  }, [])

  const dateRange = useMemo(() => {
    const now = new Date()
    switch (period) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) }
      case "week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        }
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case "custom":
        return {
          start: customStart ? startOfDay(new Date(customStart + "T00:00:00")) : startOfMonth(now),
          end: customEnd ? endOfDay(new Date(customEnd + "T00:00:00")) : endOfMonth(now),
        }
    }
  }, [period, customStart, customEnd])

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const d = parseISO(a.startAt)
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end })
    })
  }, [appointments, dateRange])

  const stats = useMemo(() => {
    const paid = filtered.filter((a) => a.status === "PAGO" || a.status === "FINALIZADO")
    const totalPaid = paid.reduce((sum, a) => sum + a.paidAmount, 0)

    // Calculate product revenue
    let productRevenue = 0
    paid.forEach(a => {
      // If we have detailed product info
      if (a.products && a.products.length > 0) {
        const prodVal = a.products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
        productRevenue += prodVal
      }
    })

    // Service revenue is the remainder (ignoring partial payments complexity)
    // If totalPaid is less than product revenue (unlikely but possible in partial payment), we cap it.
    // Ideally: paidAmount * (ProductValue / TotalValue). For now: assume products paid first? 
    // Or just: Service = TotalPaid - ProductRevenue (if result > 0).

    // Better approximation:
    // If appointment is fully paid (PAGO/FINALIZED usually implies settled), we take the product value as is.
    // If there's a big discrepancy, this might be off, but acceptable for MVP.
    const serviceRevenue = Math.max(0, totalPaid - productRevenue)

    const finalized = filtered.filter(
      (a) => a.status === "FINALIZADO" || a.status === "PAGO"
    ).length
    const noShow = filtered.filter((a) => a.status === "NO_SHOW").length
    const pending = filtered.filter((a) => a.status === "PENDENTE").length
    const avgTicket = finalized > 0 ? totalPaid / finalized : 0

    // ... imports

    // ... inside stats useMemo ...
    // Payment method totals
    const totalPix = paid.filter(a => a.paymentMethod === "PIX").reduce((sum, a) => sum + a.paidAmount, 0)
    // "CARTAO" is treated as Credit if unspecified, or we could group. Let's group generic with Credit for now.
    const totalCredit = paid.filter(a => a.paymentMethod === "CARTAO" || a.paymentMethod === "CARTAO_CREDITO").reduce((sum, a) => sum + a.paidAmount, 0)
    const totalDebit = paid.filter(a => a.paymentMethod === "CARTAO_DEBITO").reduce((sum, a) => sum + a.paidAmount, 0)
    const totalCash = paid.filter(a => a.paymentMethod === "DINHEIRO").reduce((sum, a) => sum + a.paidAmount, 0)
    const totalPlan = paid.filter(a => a.paymentMethod === "PLANO").reduce((sum, a) => sum + a.paidAmount, 0)



    // Commission Split Calculation
    // Service: 40% Professional / 60% House (Default)
    // Product: 10% Professional / 90% House (Only if commissioned)

    let commissionService = 0

    // Calculate global service commission with dynamic rates
    paid.forEach(a => {
      // Calculate Product Revenue for this appointment
      let apptProductRevenue = 0
      if (a.products && a.products.length > 0) {
        apptProductRevenue = a.products.reduce((pSum, p) => pSum + (p.price * p.quantity), 0)
      }

      const apptServiceRevenue = Math.max(0, a.paidAmount - apptProductRevenue)

      // 1. Check for fixed usage commission (Plan usage or Plan Action)
      if (a.metadata?.usageCommission !== undefined) {
        commissionService += Number(a.metadata.usageCommission)
        return
      }

      // 2. Determine Regular Commission Rate
      let rate = defaultServiceRate
      // 1. Check if appointment has override
      if (a.metadata?.commissionRate !== undefined) {
        rate = Number(a.metadata.commissionRate) / 100
      }
      // 2. Check if service has specific rate
      else {
        const service = services.find(s => s.id === a.serviceId)
        if (service?.commissionPercent != null) { // Check for null or undefined
          rate = service.commissionPercent / 100
        }
      }

      commissionService += (apptServiceRevenue * rate)
    })

    // Calculate product commission based on each item's commissioned status
    let commissionProduct = 0
    paid.forEach(a => {
      if (a.products) {
        a.products.forEach(p => {
          const productDef = products.find(prod => prod.id === p.productId)
          // Default to true if not found or undefined, matching the default in DB/Types
          const isCommissioned = productDef ? (productDef.commissioned !== false) : true

          if (isCommissioned) {
            commissionProduct += (p.price * p.quantity) * defaultProductRate
          }
        })
      }
    })

    const totalCommission = commissionService + commissionProduct

    const houseService = serviceRevenue - commissionService // Remaining after commission
    const houseProduct = productRevenue - commissionProduct // Remaining revenue
    const totalHouse = houseService + houseProduct

    // Calculate Commission per Barber
    const barberCommissions = barbers.map(barber => {
      // Filter appointments for this barber
      const barberAppointments = paid.filter(a => a.barberId === barber.id)

      // Calculate Service Revenue for this barber
      let bCommissionService = 0

      barberAppointments.forEach(a => {
        let apptProductRevenue = 0
        if (a.products && a.products.length > 0) {
          apptProductRevenue = a.products.reduce((pSum, p) => pSum + (p.price * p.quantity), 0)
        }
        const apptServiceRevenue = Math.max(0, a.paidAmount - apptProductRevenue)

        // 1. Check for fixed usage commission
        if (a.metadata?.usageCommission !== undefined) {
          bCommissionService += Number(a.metadata.usageCommission)
          return
        }

        let rate = defaultServiceRate
        // 1. Check if appointment has override
        if (a.metadata?.commissionRate !== undefined) {
          rate = Number(a.metadata.commissionRate) / 100
        }
        // 2. Check if service has specific rate
        else {
          const service = services.find(s => s.id === a.serviceId)
          if (service?.commissionPercent != null) {
            rate = service.commissionPercent / 100
          }
        }
        bCommissionService += (apptServiceRevenue * rate)
      })

      // Calculate Product Commission
      const bCommissionProduct = barberAppointments.reduce((sum, a) => {
        if (a.products && a.products.length > 0) {
          return sum + a.products.reduce((pSum, p) => {
            const productDef = products.find(prod => prod.id === p.productId)
            const isCommissioned = productDef ? (productDef.commissioned !== false) : true
            if (isCommissioned) {
              return pSum + (p.price * p.quantity * defaultProductRate)
            }
            return pSum
          }, 0)
        }
        return sum
      }, 0)

      const appointmentCount = barberAppointments.length
      const productCount = barberAppointments.reduce((sum, a) => {
        if (a.products && a.products.length > 0) {
          return sum + a.products.reduce((pSum, p) => pSum + p.quantity, 0)
        }
        return sum
      }, 0)

      return {
        id: barber.id,
        name: barber.name,
        service: bCommissionService,
        product: bCommissionProduct,
        total: bCommissionService + bCommissionProduct,
        appointmentCount,
        productCount
      }
    }).filter(b => b.total > 0).sort((a, b) => b.total - a.total) // Sort by total commission desc

    return {
      totalPaid,
      serviceRevenue,
      productRevenue,
      finalized,
      noShow,
      pending,
      avgTicket,
      totalPix,
      totalCredit,
      totalDebit,
      totalCash,
      totalPlan,
      commissionService,
      commissionProduct,
      totalCommission,
      houseService,
      houseProduct,
      totalHouse,
      barberCommissions
    }
  }, [filtered, products, config])

  const handleExportCSV = () => {
    const csv = exportCSV(filtered)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio_${format(dateRange.start, "yyyyMMdd")}_${format(dateRange.end, "yyyyMMdd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Helper to calculate specific row breakdown
  const getRowBreakdown = (a: Appointment) => {
    // Products
    let productTotal = 0
    let productCommission = 0
    const productDetails: any[] = []

    if (a.products && a.products.length > 0) {
      a.products.forEach(p => {
        const total = p.price * p.quantity
        const productDef = products.find(prod => prod.id === p.productId)
        const isCommissioned = productDef ? (productDef.commissioned !== false) : true
        const comm = isCommissioned ? total * defaultProductRate : 0

        productTotal += total
        productCommission += comm
        productDetails.push({
          name: productDef?.name || "Desconhecido",
          qty: p.quantity,
          total,
          comm,
          house: total - comm
        })
      })
    }

    // Service
    const serviceTotal = Math.max(0, a.paidAmount - productTotal)
    let serviceCommission = 0
    let serviceRate = defaultServiceRate * 100

    if (a.metadata?.usageCommission !== undefined) {
      serviceCommission = Number(a.metadata.usageCommission)
      serviceRate = (serviceCommission / (serviceTotal || 1)) * 100 // Estimate effective rate or keep as fixed
    } else {
      if (a.metadata?.commissionRate !== undefined) {
        serviceRate = Number(a.metadata.commissionRate)
      } else {
        const service = services.find(s => s.id === a.serviceId)
        if (service?.commissionPercent != null) {
          serviceRate = service.commissionPercent
        }
      }
      serviceCommission = serviceTotal * (serviceRate / 100)
    }

    const serviceHouse = serviceTotal - serviceCommission

    return {
      service: {
        total: serviceTotal,
        rate: serviceRate,
        comm: serviceCommission,
        house: serviceHouse
      },
      products: {
        total: productTotal,
        comm: productCommission,
        house: productTotal - productCommission,
        details: productDetails
      },
      total: {
        comm: serviceCommission + productCommission,
        house: serviceHouse + (productTotal - productCommission)
      }
    }
  }

  return (
    <AdminShell>
      {/* ... Header & Filters ... */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do desempenho da barbearia
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="border-border bg-transparent text-foreground hover:bg-secondary"
        >
          <Download size={16} className="mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Period filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["today", "week", "month", "custom"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${period === p
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
          >
            {p === "today" && "Hoje"}
            {p === "week" && "Semana"}
            {p === "month" && "Mês"}
            {p === "custom" && "Personalizado"}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex gap-2">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border-border bg-secondary text-foreground"
            />
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border-border bg-secondary text-foreground"
            />
          </div>
        )}
      </div>


      {/* Main Grid */}
      <div className="grid gap-6">

        {/* Row 1: KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={DollarSign} label="Faturamento Total" value={`R$ ${stats.totalPaid.toFixed(2)}`} color="text-primary" />
          <StatCard icon={Scissors} label="Serviços" value={`R$ ${stats.serviceRevenue.toFixed(2)}`} color="text-blue-400" />
          <StatCard icon={Package} label="Produtos" value={`R$ ${stats.productRevenue.toFixed(2)}`} color="text-purple-400" />
          <StatCard icon={CheckCircle} label="Agendamentos" value={stats.finalized.toString()} color="text-emerald-400" />
        </div>

        {/* Row 2: Charts & Splits */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Payment Methods Chart */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-center text-sm font-semibold text-card-foreground">Métodos de Pagamento</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pix", value: stats.totalPix, color: "#4ade80" },
                      { name: "Crédito", value: stats.totalCredit, color: "#3b82f6" },
                      { name: "Débito", value: stats.totalDebit, color: "#60a5fa" },
                      { name: "Dinheiro", value: stats.totalCash, color: "#facc15" },
                      { name: "Plano", value: stats.totalPlan, color: "#a78bfa" },
                    ].filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ value }) => `R$ ${value.toFixed(2)}`}
                  >
                    {[
                      { name: "Pix", value: stats.totalPix, color: "#4ade80" },
                      { name: "Crédito", value: stats.totalCredit, color: "#3b82f6" },
                      { name: "Débito", value: stats.totalDebit, color: "#60a5fa" },
                      { name: "Dinheiro", value: stats.totalCash, color: "#facc15" },
                      { name: "Plano", value: stats.totalPlan, color: "#a78bfa" },
                    ].filter((d) => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333", color: "#fff" }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Professional Split Card */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-bold text-card-foreground">Divisão de Comissões (Estimativa)</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-lg bg-secondary/30 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" />
                  <h4 className="font-semibold text-foreground">Profissionais</h4>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Comissão Serviços ({(defaultServiceRate * 100).toFixed(0)}%)</span>
                    <span className="text-foreground">R$ {stats.commissionService.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comissão Produtos ({(defaultProductRate * 100).toFixed(0)}%)</span>
                    <span className="text-foreground">R$ {stats.commissionProduct.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-emerald-500 text-base">
                    <span>Total Profissionais</span>
                    <span>R$ {stats.totalCommission.toFixed(2)}</span>
                  </div>

                  {/* Breakdown by Barber */}
                  {/* Breakdown by Barber */}
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Users size={16} className="text-foreground" />
                      <h5 className="text-sm font-bold uppercase text-foreground">COMISSÃO POR PROFISSIONAL</h5>
                    </div>
                    <div className="space-y-3">
                      {stats.barberCommissions.length > 0 ? (
                        <>
                          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
                            <span className="col-span-1">Nome</span>
                            <span className="text-center">Agend.</span>
                            <span className="text-center">Prod.</span>
                            <span className="text-right">Total</span>
                          </div>
                          {stats.barberCommissions.map((barber) => (
                            <div key={barber.id} className="grid grid-cols-4 gap-2 text-sm px-1 py-1 rounded hover:bg-white/5">
                              <span className="text-muted-foreground font-medium truncate col-span-1">{barber.name}</span>
                              <span className="text-muted-foreground text-center">{barber.appointmentCount}</span>
                              <span className="text-muted-foreground text-center">{barber.productCount}</span>
                              <span className="font-bold text-emerald-500 text-right">R$ {barber.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhuma comissão registrada.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-lg bg-secondary/30 p-4">
                <div className="flex items-center gap-2">
                  <Banknote className="text-blue-500" />
                  <h4 className="font-semibold text-foreground">Barbearia (Caixa)</h4>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Parcela Serviços ({(100 - (defaultServiceRate * 100)).toFixed(0)}%)</span>
                    <span className="text-foreground">R$ {stats.houseService.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcela Produtos ({(100 - (defaultProductRate * 100)).toFixed(0)}%)</span>
                    <span className="text-foreground">R$ {stats.houseProduct.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-blue-500 text-base">
                    <span>Total Barbearia</span>
                    <span>R$ {stats.totalHouse.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Recent Appointments Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-card-foreground">Histórico de Agendamentos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Serviço</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Barbeiro</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum agendamento neste período.
                    </td>
                  </tr>
                ) : (
                  filtered
                    .sort((a, b) => parseISO(b.startAt).getTime() - parseISO(a.startAt).getTime())
                    .map((a) => (
                      <React.Fragment key={a.id}>
                        <tr
                          className="border-b border-border last:border-b-0 hover:bg-secondary/30 cursor-pointer transition-colors"
                          onClick={() => toggleRow(a.id)}
                        >
                          <td className="px-4 py-3 text-muted-foreground">
                            {expandedRows.has(a.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </td>
                          <td className="px-4 py-3 text-card-foreground">
                            {format(parseISO(a.startAt), "dd/MM HH:mm")}
                          </td>
                          <td className="px-4 py-3 font-medium text-card-foreground">
                            {a.customerName}
                          </td>
                          <td className="px-4 py-3 text-card-foreground">
                            {a.metadata?.isRenewal || a.serviceId === "RENOVACAO_PLANO"
                              ? `RENOVAÇÃO DE PLANO - ${a.metadata?.planName || plans.find(p => p.id === a.metadata?.planId)?.name || "?"}`
                              : a.serviceId === "ASSINATURA_PLANO"
                                ? `ASSINATURA DE PLANO - ${a.metadata?.planName || plans.find(p => p.id === a.metadata?.planId)?.name || "?"}`
                                : (services.find((s) => s.id === a.serviceId)?.name || "-")
                            }
                            {a.products && a.products.length > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                +{a.products.length} Prod
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-card-foreground">
                            {barbers.find((b) => b.id === a.barberId)?.name || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="px-4 py-3 text-right text-card-foreground">
                            R$ {a.paidAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium 
                                  ${a.paymentMethod === "PIX" ? "bg-green-500/10 text-green-500" :
                                (a.paymentMethod === "CARTAO" || a.paymentMethod === "CARTAO_CREDITO" || a.paymentMethod === "CARTAO_DEBITO") ? "bg-blue-500/10 text-blue-500" :
                                  a.paymentMethod === "DINHEIRO" ? "bg-yellow-500/10 text-yellow-500" :
                                    a.paymentMethod === "PLANO" ? "bg-purple-500/10 text-purple-500" :
                                      "text-muted-foreground"}`}>
                              {a.paymentMethod === "CARTAO_DEBITO" ? "DÉBITO" :
                                a.paymentMethod === "CARTAO_CREDITO" ? "CRÉDITO" :
                                  a.paymentMethod || "-"}
                            </span>
                          </td>
                        </tr>
                        {expandedRows.has(a.id) && (
                          <tr className="bg-secondary/10">
                            <td colSpan={8} className="p-0">
                              <div className="p-4 border-b border-border space-y-4 animate-in slide-in-from-top-2 duration-200">
                                {(() => {
                                  const breakdown = getRowBreakdown(a)
                                  return (
                                    <div className="grid gap-4 md:grid-cols-2">
                                      {/* Details Column */}
                                      <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                          <Box size={14} /> Detalhes do Pagamento
                                        </h4>

                                        <div className="bg-card rounded border border-border p-3 text-sm space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Serviço/Plano Base</span>
                                            <span className="font-medium">R$ {breakdown.service.total.toFixed(2)}</span>
                                          </div>
                                          {breakdown.products.details.map((p: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center pl-2 border-l-2 border-primary/20">
                                              <span className="text-muted-foreground text-xs">{p.qty}x {p.name}</span>
                                              <span className="font-medium text-xs">R$ {p.total.toFixed(2)}</span>
                                            </div>
                                          ))}
                                          <div className="border-t border-border pt-2 flex justify-between items-center font-bold">
                                            <span>Total Pago</span>
                                            <span>R$ {a.paidAmount.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Split Column */}
                                      <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                          <TrendingUp size={14} /> Divisão Financeira
                                        </h4>

                                        <div className="bg-card rounded border border-border overflow-hidden">
                                          {/* Minimalist Bar */}
                                          <div className="flex h-2 w-full">
                                            <div className="bg-blue-500 h-full" style={{ width: `${(breakdown.total.house / a.paidAmount) * 100}%` }} />
                                            <div className="bg-emerald-500 h-full" style={{ width: `${(breakdown.total.comm / a.paidAmount) * 100}%` }} />
                                          </div>

                                          <div className="p-3 text-sm space-y-3">
                                            {/* House Share */}
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-2">
                                                <div className="p-1 rounded bg-blue-500/10 text-blue-500"><Store size={14} /></div>
                                                <div className="flex flex-col">
                                                  <span className="font-medium text-foreground">Barbearia (Caixa)</span>
                                                  <span className="text-xs text-muted-foreground">
                                                    {(100 - (defaultServiceRate * 100)).toFixed(0)}% Serv + {(100 - (defaultProductRate * 100)).toFixed(0)}% Prod
                                                  </span>
                                                </div>
                                              </div>
                                              <span className="font-bold text-blue-500">R$ {breakdown.total.house.toFixed(2)}</span>
                                            </div>

                                            {/* Professional Share */}
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-2">
                                                <div className="p-1 rounded bg-emerald-500/10 text-emerald-500"><User size={14} /></div>
                                                <div className="flex flex-col">
                                                  <span className="font-medium text-foreground">Profissional</span>
                                                  <span className="text-xs text-muted-foreground">
                                                    {breakdown.service.rate}% Serv + {breakdown.products.comm > 0 ? `${(defaultProductRate * 100).toFixed(0)}% Prod` : "0% Prod"}
                                                  </span>
                                                </div>
                                              </div>
                                              <span className="font-bold text-emerald-500">R$ {breakdown.total.comm.toFixed(2)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className={`mb-2 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

