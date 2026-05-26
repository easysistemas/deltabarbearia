"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import { StatusBadge } from "@/components/admin/status-badge"
import { AppointmentDrawer } from "@/components/admin/appointment-drawer"
import {
  getAppointments,
  getBarbers,
  getServices,
  addAppointment,
  fetchAppointments,
} from "@/lib/store"
import { supabase } from "@/lib/supabase"
import type { Appointment, Barber, Service, AppointmentStatus } from "@/lib/types"
import {
  format,
  parseISO,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMinutes,
  parse,
  getDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  Calendar as CalendarIcon,
  X,
  Search,
  Plus,
  Clock,
  User,
  RefreshCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9)

const STATUS_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  PENDENTE: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    dot: "bg-orange-500",
  },
  CONFIRMADO: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
  FINALIZADO: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    dot: "bg-primary",
  },
  PAGO: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  CANCELADO: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
  NO_SHOW: {
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20",
    dot: "bg-zinc-500",
  },
}

type ViewMode = "month" | "week" | "list"

function AgendaContent() {
  const [appointments, setAppointmentsList] = useState<Appointment[]>([])
  const [barbers, setBarbersList] = useState<Barber[]>([])
  const [services, setServicesList] = useState<Service[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [view, setView] = useState<ViewMode>("month")
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [filterBarber, setFilterBarber] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showNewModal, setShowNewModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAppointments()
      setAppointmentsList(data)
      setBarbersList(getBarbers())
      setServicesList(getServices())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    // Real-time subscription
    const channel = supabase
      .channel('realtime:appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          // console.log('Real-time update:', payload)
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadData])

  /* eslint-disable-next-line @next/next/no-img-element */
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowNewModal(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("new")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  const filteredAppointments = appointments.filter((a) => {
    if (filterBarber && a.barberId !== filterBarber) return false
    if (filterStatus && a.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !a.customerName.toLowerCase().includes(q) &&
        !a.customerPhone.includes(q)
      )
        return false
    }
    return true
  })

  const getApptForSlot = (day: Date, hour: number) => {
    return filteredAppointments.filter((a) => {
      const start = parseISO(a.startAt)
      return isSameDay(start, day) && start.getHours() === hour
    })
  }

  const getApptForDay = (day: Date) => {
    return filteredAppointments
      .filter((a) => isSameDay(parseISO(a.startAt), day))
      .sort(
        (a, b) =>
          parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime()
      )
  }

  const todayAppointments = filteredAppointments
    .filter((a) => isSameDay(parseISO(a.startAt), new Date()))
    .sort(
      (a, b) =>
        parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime()
    )

  // Build month calendar days
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStartDay = getDay(monthStart)
  // Adjust for Monday start: 0=Mon, 1=Tue, ... 6=Sun
  const mondayOffset = calendarStartDay === 0 ? 6 : calendarStartDay - 1
  const calendarStart = addDays(monthStart, -mondayOffset)
  const calendarDays: Date[] = []
  for (let i = 0; i < 42; i++) {
    calendarDays.push(addDays(calendarStart, i))
  }
  // Trim trailing rows if not needed
  const lastRelevantIndex = calendarDays.findLastIndex(
    (d) => isSameMonth(d, currentDate) || isSameDay(d, monthEnd)
  )
  const rowsNeeded = Math.ceil((lastRelevantIndex + 1) / 7)
  const displayDays = calendarDays.slice(0, rowsNeeded * 7)

  const openAppt = (appt: Appointment) => {
    setSelectedAppt(appt)
    setDrawerOpen(true)
  }

  // Navigation label
  const navLabel =
    view === "month"
      ? format(currentDate, "MMMM yyyy", { locale: ptBR })
      : `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(addDays(weekStart, 5), "dd MMM yyyy", { locale: ptBR })}`

  const handlePrev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
    else setWeekStart(subWeeks(weekStart, 1))
  }
  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
    else setWeekStart(addWeeks(weekStart, 1))
  }
  const goToToday = () => {
    setCurrentDate(new Date())
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Agenda</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os agendamentos da barbearia
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-secondary pl-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={filterBarber}
          onChange={(e) => setFilterBarber(e.target.value)}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todos barbeiros</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todos status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="CONFIRMADO">Confirmado</option>
          <option value="FINALIZADO">Finalizado</option>
          <option value="PAGO">Pago</option>
          <option value="CANCELADO">Cancelado</option>
          <option value="NO_SHOW">No-show</option>
        </select>
      </div>

      {/* Navigation + View toggle */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToToday}
            className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Hoje
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Proximo"
          >
            <ChevronRight size={18} />
          </button>
          <span className="ml-1 text-sm font-semibold capitalize text-foreground">
            {navLabel}
          </span>
          <button
            onClick={loadData}
            disabled={loading}
            className={`ml-2 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground ${loading ? "animate-spin" : ""}`}
            title="Atualizar agenda"
          >
            <RefreshCcw size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/50 p-0.5">
          {([
            { mode: "month" as ViewMode, icon: CalendarIcon, label: "Mensal" },
            { mode: "week" as ViewMode, icon: CalendarDays, label: "Semanal" },
            { mode: "list" as ViewMode, icon: List, label: "Lista" },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view === mode
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
              aria-label={`Visao ${label}`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status legend */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(Object.entries(STATUS_COLORS) as [AppointmentStatus, typeof STATUS_COLORS[AppointmentStatus]][]).map(
          ([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors.dot}`} />
              <span className="text-xs text-muted-foreground">
                {status === "NO_SHOW" ? "No-show" : status.charAt(0) + status.slice(1).toLowerCase()}
              </span>
            </div>
          )
        )}
      </div>

      {/* ===== MONTH VIEW ===== */}
      {
        view === "month" && (
          <div className="overflow-auto rounded-xl border border-border">
            <div className="min-w-[700px]">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-border bg-secondary/50">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((d) => (
                  <div
                    key={d}
                    className="border-r border-border px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground last:border-r-0"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {displayDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isToday = isSameDay(day, new Date())
                  const dayAppts = getApptForDay(day)

                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] border-b border-r border-border p-1.5 transition-colors last:border-r-0 ${idx >= displayDays.length - 7 ? "border-b-0" : ""
                        } ${!isCurrentMonth ? "bg-secondary/20" : ""} ${isToday ? "bg-primary/5" : ""
                        }`}
                    >
                      {/* Day number */}
                      <div className="mb-1 flex items-center justify-between px-0.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday
                            ? "bg-primary text-primary-foreground"
                            : isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground/40"
                            }`}
                        >
                          {format(day, "d")}
                        </span>
                        {dayAppts.length > 0 && isCurrentMonth && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {dayAppts.length}
                          </span>
                        )}
                      </div>

                      {/* Appointment cards (max 3 visible, "+N mais" if more) */}
                      <div className="flex flex-col gap-0.5">
                        {dayAppts.slice(0, 3).map((appt) => {
                          const colors = STATUS_COLORS[appt.status]
                          return (
                            <button
                              key={appt.id}
                              onClick={() => openAppt(appt)}
                              className={`group flex w-full items-center gap-1 rounded border-l-2 px-1.5 py-0.5 text-left transition-all hover:brightness-125 ${colors.bg} ${colors.border}`}
                            >
                              <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors.dot}`} />
                              <span className="truncate text-[10px] font-medium text-foreground/90">
                                {format(parseISO(appt.startAt), "HH:mm")}
                              </span>
                              <span className="truncate text-[10px] text-foreground/70">
                                {appt.customerName.split(" ")[0]}
                              </span>
                            </button>
                          )
                        })}
                        {dayAppts.length > 3 && (
                          <div className="mt-1 px-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setWeekStart(startOfWeek(day, { weekStartsOn: 1 }))
                                setView("week")
                              }}
                              className="w-full rounded bg-primary/10 py-0.5 text-center text-[10px] font-medium text-primary transition-colors hover:bg-primary/20 hover:text-primary-foreground"
                            >
                              Ver todos (+{dayAppts.length - 3})
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      }

      {/* ===== WEEK VIEW ===== */}
      {
        view === "week" && (
          <div className="overflow-auto rounded-xl border border-border">
            <div className="min-w-[700px]">
              {/* Day headers */}
              <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-border bg-secondary/50">
                <div className="p-3" />
                {weekDays.map((d) => (
                  <div
                    key={d.toISOString()}
                    className={`border-l border-border p-3 text-center text-sm ${isSameDay(d, new Date())
                      ? "bg-primary/10 font-bold text-primary"
                      : "font-medium text-card-foreground"
                      }`}
                  >
                    <div className="text-xs uppercase text-muted-foreground">
                      {format(d, "EEE", { locale: ptBR })}
                    </div>
                    <div>{format(d, "dd")}</div>
                  </div>
                ))}
              </div>

              {/* Hour rows */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-border last:border-b-0"
                >
                  <div className="flex items-start justify-end border-r border-border p-2 text-xs text-muted-foreground">
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>
                  {weekDays.map((day) => {
                    const appts = getApptForSlot(day, hour)
                    return (
                      <div
                        key={day.toISOString()}
                        className="min-h-[60px] border-l border-border p-1 first:border-l-0"
                      >
                        {appts.map((a) => {
                          const colors = STATUS_COLORS[a.status]
                          return (
                            <button
                              key={a.id}
                              onClick={() => openAppt(a)}
                              className={`mb-1 w-full rounded-md border-l-2 px-2 py-1 text-left text-xs transition-colors hover:brightness-125 ${colors.bg} ${colors.border}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors.dot}`} />
                                <span className="truncate font-medium text-card-foreground">
                                  {a.customerName}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                                <Clock size={10} />
                                {format(parseISO(a.startAt), "HH:mm")}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* ===== LIST VIEW ===== */}
      {
        view === "list" && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Agendamentos de Hoje ({todayAppointments.length})
            </h3>
            {todayAppointments.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhum agendamento para hoje com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Horario
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Servico
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Barbeiro
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Preco
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppointments.map((a) => {
                      const colors = STATUS_COLORS[a.status]
                      return (
                        <tr
                          key={a.id}
                          onClick={() => openAppt(a)}
                          className={`cursor-pointer border-b border-border last:border-b-0 hover:bg-secondary/30`}
                        >
                          <td className="px-4 py-3 text-card-foreground">
                            {format(parseISO(a.startAt), "HH:mm")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                              <div>
                                <div className="font-medium text-card-foreground">
                                  {a.customerName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {a.customerPhone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-card-foreground">
                            {services.find((s) => s.id === a.serviceId)?.name}
                          </td>
                          <td className="px-4 py-3 text-card-foreground">
                            {barbers.find((b) => b.id === a.barberId)?.name}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-primary">
                            R$ {a.price.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      }

      {/* Drawer */}
      <AppointmentDrawer
        appointment={selectedAppt}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedAppt(null)
        }}
        onUpdate={async () => {
          await loadData()
          // Update selectedAppt with fresh data from the newly fetched list
          // We can't rely on appointments state immediately because setting state is async
          // So we fetch again or find in the new list if we had access to it.
          // Since loadData sets state, let's just find it in the new data if we could, 
          // or simpler: just re-fetch this single appointment or trust loadData to trigger re-render 
          // but we need to update selectedAppt object to reflect changes in the UI immediately.

          // Actually, the cleanest way without refactoring everything:
          const data = await fetchAppointments()
          // loadData calls fetchAppointments too, but we need the return value here to find the updated appt
          if (selectedAppt) {
            const updated = data.find(a => a.id === selectedAppt.id)
            if (updated) setSelectedAppt(updated)
          }
        }}
      />

      {/* New appointment modal */}
      {
        showNewModal && (
          <NewAppointmentModal
            barbers={barbers}
            services={services}
            onClose={() => setShowNewModal(false)}
            onCreated={() => {
              loadData()
              setShowNewModal(false)
            }}
          />
        )
      }
    </AdminShell >
  )
}

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <AdminShell>
          <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Carregando agenda...</p>
            </div>
          </div>
        </AdminShell>
      }
    >
      <AgendaContent />
    </Suspense>
  )
}

function NewAppointmentModal({
  barbers,
  services,
  onClose,
  onCreated,
}: {
  barbers: Barber[]
  services: Service[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [serviceId, setServiceId] = useState(services[0]?.id || "")
  const [barberId, setBarberId] = useState(barbers[0]?.id || "")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [time, setTime] = useState("10:00")

  const handleCreate = () => {
    const service = serviceId ? services.find((s) => s.id === serviceId) : null
    if (!name || !phone) return

    const startDate = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date())
    const durationMin = service ? service.durationMin : 15
    const price = service ? service.price : 0
    const endDate = addMinutes(startDate, durationMin)

    addAppointment({
      id: `a_${Date.now()}`,
      customerName: name,
      customerPhone: phone,
      barberId,
      serviceId: serviceId || "",
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      status: "CONFIRMADO",
      price: price,
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    })
    onCreated()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">Novo Agendamento</h2>
          <button onClick={onClose} aria-label="Fechar">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nome do cliente"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
          />
          <Input
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
          />
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="">Apenas Produto (Sem serviço)</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - R$ {s.price.toFixed(2)}
              </option>
            ))}
          </select>
          <select
            value={barberId}
            onChange={(e) => setBarberId(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-border bg-secondary text-foreground"
            />
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border-border bg-secondary text-foreground"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name || !phone}
            className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Criar Agendamento
          </Button>
        </div>
      </div>
    </>
  )
}
