"use client"

import { useState, useEffect } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { fetchBusinessConfig } from "@/lib/db_actions"
import {
    fetchCustomers,
    addCustomer,
    updateCustomer,
    fetchAppointments,
    getAppointments,
    getCustomers,
    getServices,
    fetchServices,
    fetchBarbers,
    getBarbers,
    deleteCustomer,
    getCurrentUser
} from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, User, Phone, Calendar, Save, X, History, TrendingUp, Trash2, AlertCircle, RefreshCw, MessageSquare, Gift } from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import type { Customer, Appointment, Barber, BusinessConfig } from "@/lib/types"

export default function ClientesPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("") // Changed from searchTerm to search
    const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null)
    const [lastVisits, setLastVisits] = useState<Record<string, string>>({})

    // Modal State
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [birthDate, setBirthDate] = useState("")
    const [notes, setNotes] = useState("")
    const [tags, setTags] = useState<string[]>([])

    // Filters
    const [filterStatus, setFilterStatus] = useState<"all" | "sumidos">("all")
    const [filterTag, setFilterTag] = useState<string>("all")

    // Timeline Data
    const [timeline, setTimeline] = useState<Appointment[]>([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const [custData, _, __, barbData, configData] = await Promise.all([
            fetchCustomers(),
            fetchAppointments(),
            fetchServices(),
            fetchBarbers(),
            fetchBusinessConfig()
        ])
        setCustomers(custData)
        setBarbers(barbData)
        setBusinessConfig(configData)

        // Calculate last visits for all customers
        const allAppts = getAppointments()
        const visitMap: Record<string, string> = {}
        allAppts.forEach(a => {
            if (["CONFIRMADO", "FINALIZADO", "PAGO"].includes(a.status)) {
                const phone = a.customerPhone.replace(/\D/g, "")
                if (!visitMap[phone] || parseISO(a.startAt) > parseISO(visitMap[phone])) {
                    visitMap[phone] = a.startAt
                }
            }
        })
        setLastVisits(visitMap)

        setLoading(false)
    }

    async function handleDeleteCustomer(id: string) {
        if (!confirm("Tem certeza que deseja excluir este cliente? Todos os dados vinculados serão mantidos, mas o cadastro do cliente será removido.")) return
        try {
            await deleteCustomer(id)
            await loadData()
            setModalOpen(false)
        } catch (error) {
            alert("Erro ao excluir cliente.")
        }
    }

    // Filter customers
    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
        if (!matchesSearch) return false

        if (filterStatus === "sumidos") {
            const cleanPhone = c.phone.replace(/\D/g, "")
            const lastVisit = lastVisits[cleanPhone]
            const isOverdue = lastVisit ? differenceInDays(new Date(), parseISO(lastVisit)) >= 25 : false
            if (!isOverdue) return false
        }

        if (filterTag !== "all") {
            if (!c.tags?.includes(filterTag)) return false
        }

        return true
    })

    const isAdmin = getCurrentUser()?.role === "ADMIN"

    // Open Modal (Create or Edit)
    function openModal(customer: Customer | null) {
        setSelectedCustomer(customer)
        if (customer) {
            setName(customer.name)
            setPhone(customer.phone)
            setBirthDate(customer.birthDate || "")
            setNotes(customer.notes || "")
            setTags(customer.tags || [])

            // Build Timeline
            const allAppointments = getAppointments()
            const cleanPhone = customer.phone.replace(/\D/g, "")
            const customerTimeline = allAppointments.filter(a => {
                const aPhone = a.customerPhone.replace(/\D/g, "")
                if (aPhone.length < 8 || cleanPhone.length < 8) return false
                return aPhone.endsWith(cleanPhone) || cleanPhone.endsWith(aPhone)
            }).sort((a, b) => parseISO(b.startAt).getTime() - parseISO(a.startAt).getTime())

            setTimeline(customerTimeline)
        } else {
            setName("")
            setPhone("")
            setBirthDate("")
            setNotes("")
            setTags([])
            setTimeline([])
        }
        setModalOpen(true)
    }

    async function handleSyncFromAppointments() {
        if (!confirm("Deseja importar automaticamente os contatos dos agendamentos que ainda não estão na lista de clientes?")) return

        setLoading(true)
        try {
            const allAppointments = getAppointments()
            const existingCustomers = getCustomers()

            const existingPhones = new Set(existingCustomers.map((c: Customer) => c.phone.replace(/\D/g, "")))

            // Map to store unique new customers to add
            const toAdd = new Map<string, string>() // Phone -> Name

            allAppointments.forEach(appt => {
                const cleanPhone = appt.customerPhone.replace(/\D/g, "")
                if (cleanPhone.length >= 8 && !existingPhones.has(cleanPhone)) {
                    toAdd.set(cleanPhone, appt.customerName)
                }
            })

            if (toAdd.size === 0) {
                alert("Nenhum novo cliente encontrado nos agendamentos.")
                setLoading(false)
                return
            }

            let count = 0
            for (const [phone, name] of toAdd.entries()) {
                await addCustomer({ name, phone })
                count++
            }

            await loadData()
            alert(`${count} novos clientes foram importados com sucesso!`)
        } catch (error) {
            console.error("Error syncing customers:", error)
            alert("Erro ao sincronizar clientes dos agendamentos.")
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!name || !phone) return alert("Nome e Telefone são obrigatórios")

        try {
            if (selectedCustomer) {
                await updateCustomer(selectedCustomer.id, { name, phone, birthDate, notes, tags })
            } else {
                await addCustomer({ name, phone, birthDate, notes, tags })
            }
            await loadData()
            setModalOpen(false)
        } catch (error) {
            console.error("Error saving customer:", error)
            alert("Erro ao salvar cliente")
        }
    }

    function handleSendWhatsApp(stat: any) {
        if (!selectedCustomer) return

        const template = businessConfig?.whatsappOverdueTemplate || 'Olá {cliente}! Notamos que faz tempo que você não vem fazer seu {servico}. Que tal agendar um horário?'

        const message = template
            .replace(/{cliente}/g, selectedCustomer.name)
            .replace(/{servico}/g, stat.name)

        const cleanPhone = selectedCustomer.phone.replace(/\D/g, "")
        // Ensure it has country code (default to 55 if length is typical of BR mobile)
        const finalPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone

        const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    function handleSendWhatsAppDirect(customer: Customer) {
        const lastVisitStr = lastVisits[customer.phone.replace(/\D/g, "")]
        const template = businessConfig?.whatsappOverdueTemplate || 'Olá {cliente}! Notamos que faz tempo que você não vem fazer seu {servico}. Que tal agendar um horário?'

        // Generic "serviço" name for direct contact if we don't know the specific one he usually does in this context
        // Or we could find his favorite service. Let's keep it simple for now.
        const message = template
            .replace(/{cliente}/g, customer.name)
            .replace(/{servico}/g, "serviço")

        const cleanPhone = customer.phone.replace(/\D/g, "")
        const finalPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone

        const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    // Stats
    const totalSpent = timeline.reduce((sum, a) => sum + (a.paidAmount || 0), 0)
    const servicesCount = getServices()

    // Favorite Service Calculation
    const serviceCounts: Record<string, number> = {}
    timeline.forEach(a => {
        if (a.serviceId) {
            serviceCounts[a.serviceId] = (serviceCounts[a.serviceId] || 0) + 1
        }
    })
    let favServiceId = ""
    let maxCount = 0
    Object.entries(serviceCounts).forEach(([id, count]) => {
        if (count > maxCount) {
            maxCount = count
            favServiceId = id
        }
    })
    const favServiceName = servicesCount.find(s => s.id === favServiceId)?.name || "-"

    // Frequency Stats Logic
    interface ServiceStat {
        serviceId: string
        name: string
        avgDays: number
        lastVisit: Date
        daysSinceLast: number
        isOverdue: boolean
    }

    const calculateServiceStats = (): ServiceStat[] => {
        const stats: Record<string, Appointment[]> = {}
        // Group by service (only confirmed/finished/paid)
        timeline.forEach(a => {
            if (["CONFIRMADO", "FINALIZADO", "PAGO"].includes(a.status)) {
                if (!stats[a.serviceId]) stats[a.serviceId] = []
                stats[a.serviceId].push(a)
            }
        })

        const result: ServiceStat[] = []
        const now = new Date()

        Object.entries(stats).forEach(([sId, appts]) => {
            // Sort appts by date ascending to calculate intervals
            const sorted = [...appts].sort((a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime())
            const sName = getServices().find(s => s.id === sId)?.name || sId

            if (sorted.length < 2) {
                // Not enough data for average, but we can still show last visit
                const last = parseISO(sorted[sorted.length - 1].startAt)
                result.push({
                    serviceId: sId,
                    name: sName,
                    avgDays: 0,
                    lastVisit: last,
                    daysSinceLast: differenceInDays(now, last),
                    isOverdue: false
                })
                return
            }

            let totalDays = 0
            for (let i = 0; i < sorted.length - 1; i++) {
                totalDays += differenceInDays(parseISO(sorted[i + 1].startAt), parseISO(sorted[i].startAt))
            }

            const avg = Math.round(totalDays / (sorted.length - 1))
            const last = parseISO(sorted[sorted.length - 1].startAt)
            const daysSince = differenceInDays(now, last)

            result.push({
                serviceId: sId,
                name: sName,
                avgDays: avg,
                lastVisit: last,
                daysSinceLast: daysSince,
                isOverdue: avg > 0 && daysSince > avg
            })
        })

        return result.sort((a, b) => b.avgDays - a.avgDays)
    }

    const frequencyStats = selectedCustomer ? calculateServiceStats() : []


    return (
        <AdminShell>
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
                        <p className="text-muted-foreground">Gerencie sua base de clientes e histórico</p>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <Button variant="outline" onClick={handleSyncFromAppointments} disabled={loading} className="gap-2">
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                                <span className="hidden sm:inline">Sincronizar Agendamentos</span>
                            </Button>
                        )}
                        <Button onClick={() => openModal(null)} className="gap-2 bg-primary text-primary-foreground">
                            <Plus size={16} /> Novo Cliente
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" size={18} />
                        <Input
                            placeholder="Buscar por nome ou telefone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-12 border-border bg-card text-foreground w-full"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as "all" | "sumidos")}
                        className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 md:w-[180px]"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="sumidos">Apenas Sumidos</option>
                    </select>
                    {businessConfig?.customerTags && businessConfig.customerTags.length > 0 && (
                        <select
                            value={filterTag}
                            onChange={(e) => setFilterTag(e.target.value)}
                            className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 md:w-[180px]"
                        >
                            <option value="all">Todas as Etiquetas</option>
                            {businessConfig.customerTags.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* List */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCustomers.map(customer => {
                        const cleanPhone = customer.phone.replace(/\D/g, "")
                        const lastVisit = lastVisits[cleanPhone]
                        const isOverdue = lastVisit ? differenceInDays(new Date(), parseISO(lastVisit)) >= 25 : false

                        let isBirthdayToday = false
                        let isBirthdaySoon = false

                        if (customer.birthDate) {
                            const parts = customer.birthDate.split('-')
                            if (parts.length === 3) {
                                const year = Number(parts[0])
                                const month = Number(parts[1])
                                const day = Number(parts[2])

                                const today = new Date()
                                const currentYear = today.getFullYear()
                                const currentMonth = today.getMonth() + 1
                                const currentDay = today.getDate()

                                if (month === currentMonth && day === currentDay) {
                                    isBirthdayToday = true
                                } else {
                                    const nextBirthday = new Date(currentYear, month - 1, day)
                                    // Remove time from today to compare correctly
                                    const todayZero = new Date(currentYear, currentMonth - 1, currentDay)

                                    if (nextBirthday < todayZero) {
                                        nextBirthday.setFullYear(currentYear + 1)
                                    }

                                    const msPerDay = 1000 * 60 * 60 * 24
                                    const diffDays = Math.round((nextBirthday.getTime() - todayZero.getTime()) / msPerDay)

                                    if (diffDays > 0 && diffDays <= 5) {
                                        isBirthdaySoon = true
                                    }
                                }
                            }
                        }

                        return (
                            <div
                                key={customer.id}
                                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 cursor-pointer transition-all flex flex-col gap-3 justify-between group"
                                onClick={() => openModal(customer)}
                            >
                                <div className="flex items-start gap-3 w-full overflow-hidden">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors mt-1">
                                        <User size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-full">
                                                {customer.name}
                                            </h3>
                                            {!customer.birthDate && (
                                                <div className="flex shrink-0 items-center justify-center h-5 w-5 rounded-full bg-orange-500/10 text-orange-500 animate-pulse" title="Dados incompletos (Falta data de nascimento)">
                                                    <AlertCircle size={14} />
                                                </div>
                                            )}
                                            {isBirthdayToday && (
                                                <div className="flex shrink-0 items-center justify-center h-5 w-5 rounded-full bg-violet-500/10 text-violet-500 animate-bounce" title="Aniversariante do dia!">
                                                    <Gift size={14} />
                                                </div>
                                            )}
                                            {isBirthdaySoon && (
                                                <div className="flex shrink-0 items-center justify-center h-5 w-5 rounded-full bg-violet-500/10 text-violet-500 opacity-70" title="Aniversário nos próximos 5 dias">
                                                    <Gift size={14} />
                                                </div>
                                            )}
                                            {isOverdue && (
                                                <div className="flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase animate-bounce">
                                                    <AlertCircle size={10} />
                                                    Sumido(a)
                                                </div>
                                            )}
                                            {customer.tags?.map(tagId => {
                                                const tInfo = businessConfig?.customerTags?.find(t => t.id === tagId)
                                                if (!tInfo) return null
                                                return (
                                                    <span
                                                        key={tagId}
                                                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase whitespace-nowrap opacity-90 shadow-sm"
                                                        style={{ backgroundColor: tInfo.color }}
                                                    >
                                                        {tInfo.name}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{customer.phone}</p>
                                    </div>
                                </div>
                                {isOverdue && (
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-3 text-xs gap-2 shrink-0 border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white transition-all z-20 w-full sm:w-auto mt-1"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleSendWhatsAppDirect(customer)
                                            }}
                                        >
                                            <MessageSquare size={14} />
                                            <span>Enviar Mensagem</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {filteredCustomers.length === 0 && !loading && (
                        <div className="col-span-full py-10 text-center text-muted-foreground">
                            Nenhum cliente encontrado.
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50 backdrop-blur-sm">
                        <div className="h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-foreground">
                                            {selectedCustomer ? "Detalhes do Cliente" : "Novo Cliente"}
                                        </h2>
                                        {selectedCustomer && !selectedCustomer.birthDate && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse shadow-lg shadow-orange-500/20">
                                                <AlertCircle size={12} />
                                                Dados incompletos
                                            </div>
                                        )}
                                    </div>
                                    {selectedCustomer && <p className="text-sm text-muted-foreground mt-0.5">Cadastrado em {format(parseISO(selectedCustomer.createdAt || new Date().toISOString()), "dd/MM/yyyy")}</p>}
                                </div>
                                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Form */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome Completo</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                            <Input className="pl-9" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefone (WhatsApp)</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                            <Input className="pl-9" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 items-start">
                                        <Label htmlFor="birthDate">Data de Nascimento</Label>
                                        <Input
                                            id="birthDate"
                                            type="date"
                                            value={birthDate}
                                            onChange={(e) => setBirthDate(e.target.value)}
                                            className={!birthDate ? "border-orange-500/50 focus-visible:ring-orange-500/20" : ""}
                                        />
                                        {!birthDate && (
                                            <p className="text-[10px] text-orange-500 font-medium">
                                                Importante para campanhas de aniversário
                                            </p>
                                        )}
                                    </div>

                                    {/* Etiquetas */}
                                    <div className="space-y-2 col-span-1 md:col-span-2">
                                        <Label>Etiquetas</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {(!businessConfig?.customerTags || businessConfig.customerTags.length === 0) ? (
                                                <p className="text-xs text-muted-foreground italic bg-secondary/20 px-3 py-2 rounded border border-border w-full">
                                                    Nenhuma etiqueta cadastrada. Vá em <span className="font-semibold text-foreground">Configurações &gt; Etiquetas</span> para criar rótulos para seus clientes.
                                                </p>
                                            ) : (
                                                businessConfig.customerTags.map(t => {
                                                    const isSelected = tags.includes(t.id)
                                                    return (
                                                        <button
                                                            key={t.id}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (isSelected) {
                                                                    setTags(tags.filter(id => id !== t.id))
                                                                } else {
                                                                    setTags([...tags, t.id])
                                                                }
                                                            }}
                                                            className={`px-3 py-1 text-xs rounded-full border transition-all ${isSelected ? 'shadow-sm text-white font-medium opacity-90' : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'}`}
                                                            style={isSelected ? { backgroundColor: t.color, borderColor: t.color } : {}}
                                                        >
                                                            {t.name}
                                                        </button>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Observações / Notas</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Preferências, alergias, histórico..."
                                        className="resize-none h-24"
                                    />
                                </div>

                                {selectedCustomer && (
                                    <>
                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-secondary/20 p-4 rounded-lg border border-border">
                                                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                                    <TrendingUp size={16} />
                                                    <span className="text-xs uppercase tracking-wider font-bold">Total Gasto</span>
                                                </div>
                                                <p className="text-2xl font-bold text-emerald-500">R$ {totalSpent.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-secondary/20 p-4 rounded-lg border border-border">
                                                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                                    <History size={16} />
                                                    <span className="text-xs uppercase tracking-wider font-bold">Serviço Favorito</span>
                                                </div>
                                                <p className="text-lg font-bold text-foreground truncate">{favServiceName}</p>
                                                <p className="text-xs text-muted-foreground">{maxCount} agendamentos</p>
                                            </div>
                                        </div>

                                        {/* Frequency Analytics */}
                                        {frequencyStats.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                                    <TrendingUp size={18} className="text-primary" />
                                                    Análise de Frequência
                                                </h3>
                                                <div className="grid gap-3">
                                                    {frequencyStats.map(stat => (
                                                        <div key={stat.serviceId} className={`p-4 rounded-xl border transition-all ${stat.isOverdue ? 'bg-red-500/5 border-red-500/20' : 'bg-secondary/10 border-border'}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-bold text-sm text-foreground">{stat.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    {stat.isOverdue && (
                                                                        <Badge variant="destructive" className="animate-pulse flex items-center gap-1 text-[10px] uppercase font-black">
                                                                            <AlertCircle size={10} /> Atrasado
                                                                        </Badge>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-7 px-2 text-[10px] gap-1 border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white transition-all"
                                                                        onClick={() => handleSendWhatsApp(stat)}
                                                                    >
                                                                        <MessageSquare size={12} />
                                                                        Enviar Mensagem
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Média de Retorno</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {stat.avgDays > 0 ? `${stat.avgDays} dias` : "Dados insuficientes"}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Última Visita</p>
                                                                    <p className="text-sm font-semibold text-foreground">Há {stat.daysSinceLast} dias</p>
                                                                </div>
                                                            </div>
                                                            {stat.isOverdue && (
                                                                <p className="mt-3 text-[11px] text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/10 font-medium">
                                                                    Este cliente costuma retornar a cada {stat.avgDays} dias. Já se passaram {stat.daysSinceLast} dias desde o último procedimento de {stat.name}.
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}


                                        {/* Notes History (Aggregated from Appointments) */}
                                        {timeline.some(t => t.notes) && (
                                            <div className="space-y-2">
                                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                                    <div className="h-4 w-4" /> {/* Spacer */}
                                                    <span className="text-sm">Histórico de Observações</span>
                                                </h3>
                                                <div className="bg-secondary/10 rounded-lg border border-border p-4 space-y-3 max-h-40 overflow-y-auto">
                                                    {timeline.filter(t => t.notes).map(t => (
                                                        <div key={t.id} className="text-xs border-b border-border/50 last:border-0 pb-2 last:pb-0">
                                                            <span className="font-bold text-foreground">{format(parseISO(t.startAt), "dd/MM/yyyy")}: </span>
                                                            <span className="text-muted-foreground italic">"{t.notes}"</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Timeline */}
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                                <History size={18} /> Linha do Tempo
                                            </h3>
                                            <div className="relative border-l-2 border-border pl-6 space-y-6">
                                                {timeline.length > 0 ? timeline.map((item, idx) => (
                                                    <div key={item.id} className="relative">
                                                        <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-background ${item.status === 'PAGO' ? 'bg-emerald-500' : 'bg-muted-foreground'
                                                            }`} />
                                                        <div className="bg-secondary/10 p-3 rounded-lg border border-border hover:bg-secondary/20 transition-colors">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-bold text-sm text-foreground">
                                                                    {servicesCount.find(s => s.id === item.serviceId)?.name || item.serviceId}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {format(parseISO(item.startAt), "dd/MM/yyyy HH:mm")}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Profissional: <span className="text-foreground">
                                                                        {barbers.find(b => b.id === item.barberId)?.name || item.barberId}
                                                                    </span></p>
                                                                    {item.notes && <p className="text-xs italic text-muted-foreground mt-1">"{item.notes}"</p>}
                                                                </div>
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.status === 'PAGO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary text-muted-foreground'
                                                                    }`}>
                                                                    {item.status} • R$ {item.paidAmount.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-muted-foreground italic">Nenhum histórico encontrado para este número.</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-6 border-t border-border bg-card flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    {isAdmin && selectedCustomer && (
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                                            className="gap-2 transition-all hover:scale-105"
                                        >
                                            <Trash2 size={16} /> Excluir Cliente
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleSave} className="bg-primary text-primary-foreground min-w-[100px]">
                                        <Save size={16} className="mr-2" /> Salvar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminShell >
    )
}
