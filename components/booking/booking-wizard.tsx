"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getServices,
  getBarbers,
  getAvailableSlots,
  addAppointment,
  fetchAppointments,
  fetchBarbers,
  getCustomerPlans,
  fetchCustomerPlans,
  getPlans,
  fetchPlans,
  isLoggedIn,
  addCustomer,
  getCustomers,
  fetchCustomers
} from "@/lib/store"
import type { Service, Barber, Plan, Customer } from "@/lib/types"
import { addMinutes, format, parse, addDays, isBefore, startOfDay, isSameDay, getDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Scissors,
  User,
  CalendarDays,
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const STEPS = [
  { label: "Servico", icon: Scissors },
  { label: "Data/Hora", icon: CalendarDays },
  { label: "Confirmar", icon: ClipboardCheck },
]

export function BookingWizard({ isAdminMode = false }: { isAdminMode?: boolean }) {
  const [step, setStep] = useState(0)
  const [services, setServicesList] = useState<Service[]>([])
  const [barbers, setBarbersList] = useState<Barber[]>([])

  // Selections
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedBarber, setSelectedBarber] = useState<string>("any")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedSlotBarber, setSelectedSlotBarber] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState<{ time: string; barberId: string }[]>([])

  // Result
  const [confirmed, setConfirmed] = useState(false)
  const [confirmData, setConfirmData] = useState<{
    service: string
    barber: string
    date: string
    time: string
    price: number
  } | null>(null)
  const [percent, setPercent] = useState(0)

  // Plan usage
  const [usingPlan, setUsingPlan] = useState(false)
  const [activePlanName, setActivePlanName] = useState<string | null>(null)
  const [activePlanPrice, setActivePlanPrice] = useState(0)
  const [isRenewal, setIsRenewal] = useState(false)
  const [renewalDate, setRenewalDate] = useState<Date | null>(null)
  const [planPeriod, setPlanPeriod] = useState("/mes")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // If explicit mode passed via prop, use it. Otherwise fallback to check (or force false).
    // User request: remove completely from client booking page.
    // Client page won't pass `isAdminMode={true}`, so it will be false.
    // Admin page (e.g. /admin/agenda/new) should pass `isAdminMode={true}`.
    // To be safe, let's just use the prop directly if we want strict control.
    // But maybe admin page doesn't pass it yet?
    // Let's set it based on prop primarily.
    if (isAdminMode) {
      setIsAdmin(true)
    } else {
      setIsAdmin(false)
    }
  }, [isAdminMode])

  useEffect(() => {
    // Initial fetch to load appointments and barbers from Supabase
    Promise.all([fetchAppointments(), fetchBarbers(), fetchCustomerPlans(), fetchPlans()]).then(() => {
      setBarbersList(getBarbers())

      // Logic relies on synchronous cache, so calling this populates it
      // Trigger a re-render or re-calculation if needed
      if (selectedDate && selectedServices.length > 0) {
        // This effect will run automatically when selectedDate/Services change, 
        // but initially they might be null/empty.
      }
    })
  }, [])

  useEffect(() => {
    if (step === 0) setPercent(33)
    if (step === 1) setPercent(66)
    if (step === 2) setPercent(100)
    window.scrollTo(0, 0)
  }, [step])

  useEffect(() => {
    setServicesList(getServices())
    setBarbersList(getBarbers())
  }, [])

  useEffect(() => {
    if (selectedDate && selectedServices.length > 0) {
      const barberId = selectedBarber === "any" ? undefined : selectedBarber
      const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMin, 0)
      const slots = getAvailableSlots(selectedDate, totalDuration, barberId)
      setAvailableSlots(slots)
      setSelectedTime(null)
      setSelectedSlotBarber("")
    }
  }, [selectedDate, selectedServices, selectedBarber])

  // Check for plan when phone changes (Parent Logic)
  useEffect(() => {
    // SECURITY: Only check/show plan details if user is ADMIN.
    // Regular clients should not see plan details or be able to select them here.
    if (!isAdmin) {
      setActivePlanName(null)
      setUsingPlan(false)
      setIsRenewal(false)
      setRenewalDate(null)
      setActivePlanPrice(0)
      return
    }

    const cleanPhone = customerPhone.replace(/\D/g, "")
    if (cleanPhone.length >= 10) {
      const plans = getCustomerPlans()
      const customerPlan = plans.find(p => p.customerPhone.replace(/\D/g, "") === cleanPhone && p.active)

      if (customerPlan) {
        const allPlans = getPlans()
        const planDetails = allPlans.find(p => p.id === customerPlan.planId)

        setActivePlanName(planDetails?.name || "Plano Ativo")
        if (planDetails) {
          setActivePlanPrice(planDetails.price)
          setPlanPeriod(planDetails.period)
        }
      } else {
        setActivePlanName(null)
        setUsingPlan(false)
        setIsRenewal(false)
        setRenewalDate(null)
        setActivePlanPrice(0)
      }
    } else {
      setActivePlanName(null)
      setUsingPlan(false)
      setIsRenewal(false)
      setRenewalDate(null)
      setActivePlanPrice(0)
    }
  }, [customerPhone, isAdmin])

  const handleConfirm = useCallback(async () => {
    if (selectedServices.length === 0 || !selectedDate || !selectedTime) return

    // Client Linking Logic
    const cleanPhone = customerPhone.replace(/\D/g, "")
    await fetchCustomers() // Ensure we have latest customers
    const customers = getCustomers()
    let client = customers.find(c => c.phone.replace(/\D/g, "") === cleanPhone)

    if (!client) {
      // Create new client
      await addCustomer({
        name: customerName,
        phone: customerPhone,
      })
      // Refresh to get the new client with ID
      await fetchCustomers()
      client = getCustomers().find(c => c.phone.replace(/\D/g, "") === cleanPhone)
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const startDate = parse(`${dateStr} ${selectedTime}`, "yyyy-MM-dd HH:mm", new Date())

    const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMin, 0)
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)

    const endDate = addMinutes(startDate, totalDuration)

    const barberName =
      barbers.find((b) => b.id === selectedSlotBarber)?.name || "Qualquer"

    let finalPaidAmount = 0
    let finalPrice = totalPrice
    let paymentMethod: any = undefined

    if (usingPlan) {
      paymentMethod = "PLANO"
      if (isRenewal) {
        finalPrice = activePlanPrice
        finalPaidAmount = 0
      } else {
        finalPrice = 0
        finalPaidAmount = totalPrice
      }
    } else {
      finalPrice = totalPrice
      finalPaidAmount = 0
    }

    const appt = {
      id: `a_${Date.now()}`,
      customerName,
      customerPhone,
      barberId: selectedSlotBarber,
      serviceId: selectedServices[0].id,
      serviceIds: selectedServices.map(s => s.id),
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      status: "PENDENTE" as const,
      price: finalPrice,
      paidAmount: finalPaidAmount,
      paymentMethod: paymentMethod,
      createdAt: new Date().toISOString(),
      metadata: {
        isRenewal,
        renewalDate: isRenewal && renewalDate ? format(renewalDate, "yyyy-MM-dd") : undefined,
        planPeriod: isRenewal ? planPeriod : undefined
      }
    }

    addAppointment(appt)
    setConfirmed(true)
    setConfirmData({
      service: selectedServices.map(s => s.name).join(", "),
      barber: barberName,
      date: format(selectedDate, "dd/MM/yyyy"),
      time: selectedTime,
      price: finalPrice,
    })
  }, [selectedServices, selectedDate, selectedTime, selectedSlotBarber, customerName, customerPhone, barbers, usingPlan, isRenewal, activePlanPrice, renewalDate, planPeriod])

  const canNext = () => {
    switch (step) {
      case 0: return selectedServices.length > 0
      case 1: return !!selectedDate && !!selectedTime
      case 2: return customerName.trim().length >= 2 && customerPhone.trim().length >= 10
      default: return false
    }
  }

  if (confirmed && confirmData) {
    return <ConfirmationScreen data={confirmData} />
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Steps indicator */}
      <div className="mb-12 flex items-center justify-center gap-4 sm:gap-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = i === step
          const isCompleted = i < step

          return (
            <div key={s.label} className="relative flex flex-col items-center gap-2">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 ${isCompleted
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                  : isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(255,215,0,0.5)] scale-110"
                    : "bg-secondary text-muted-foreground border border-border/50"
                  }`}
              >
                {isCompleted ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={`absolute -bottom-8 w-max text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${isActive ? "block" : "hidden sm:block"
                  } ${isActive || isCompleted ? "text-primary" : "text-muted-foreground/50"
                  }`}
              >
                {s.label}
              </span>

              {i < STEPS.length - 1 && (
                <div className="absolute left-[calc(100%+8px)] top-6 hidden h-px w-8 -translate-y-1/2 bg-border/30 sm:block sm:w-16">
                  <div
                    className={`h-full bg-primary transition-all duration-700 ease-out ${isCompleted ? "w-full" : "w-0"
                      }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[400px] rounded-2xl border border-white/5 bg-card/50 p-6 shadow-2xl backdrop-blur-sm sm:p-10">
        {step === 0 && (
          <StepService
            services={services}
            selected={selectedServices}
            onSelect={(s) => {
              const alreadySelected = selectedServices.some(sel => sel.id === s.id)
              if (alreadySelected) {
                setSelectedServices(selectedServices.filter(sel => sel.id !== s.id))
              } else {
                setSelectedServices([...selectedServices, s])
              }
            }}
          />
        )}
        {step === 1 && (
          <StepDateTime
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={(time: string) => {
              setSelectedTime(time)
              const slot = availableSlots.find((s) => s.time === time)
              if (slot) setSelectedSlotBarber(slot.barberId)
            }}
            availableSlots={availableSlots}
            services={selectedServices}
          />
        )}
        {step === 2 && (
          <StepConfirm
            name={customerName}
            setName={setCustomerName}
            phone={customerPhone}
            setPhone={setCustomerPhone}
            services={selectedServices}
            barberName={
              selectedBarber === "any"
                ? barbers.find((b) => b.id === selectedSlotBarber)?.name || "Automatico"
                : barbers.find((b) => b.id === selectedBarber)?.name || ""
            }
            date={selectedDate}
            time={selectedTime}
            usingPlan={usingPlan}
            setUsingPlan={setUsingPlan}
            activePlanName={activePlanName}
            setActivePlanName={setActivePlanName}
            activePlanPrice={activePlanPrice}
            setActivePlanPrice={setActivePlanPrice}
            isRenewal={isRenewal}
            setIsRenewal={setIsRenewal}
            renewalDate={renewalDate}
            setRenewalDate={setRenewalDate}
            planPeriod={planPeriod}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className="border-border bg-transparent text-foreground hover:bg-secondary"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </Button>

        {step < 2 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Proximo
            <ArrowRight size={16} className="ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={!canNext()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Check size={16} className="mr-2" />
            Confirmar Agendamento
          </Button>
        )}
      </div>
    </div>
  )
}

// ——— Step Components ———

function StepService({
  services,
  selected,
  onSelect,
}: {
  services: Service[]
  selected: Service[]
  onSelect: (s: Service) => void
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 text-center">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
          Passo 1
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground">Escolha o serviço</h2>
        <p className="mt-2 text-sm text-muted-foreground">Selecione um ou mais serviços desejados</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 text-left transition-all duration-300 ${selected.some(sel => sel.id === s.id)
              ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(255,215,0,0.1)]"
              : "border-white/5 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
              }`}
          >
            <span className="font-semibold text-card-foreground">{s.name}</span>
            <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-3 text-sm">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Clock size={12} className="text-primary/70" />
                {s.durationMin} min
              </span>
              <span className="font-display text-lg font-bold text-primary">
                R$ {s.price.toFixed(2)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepBarber({
  barbers,
  selected,
  onSelect,
}: {
  barbers: Barber[]
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 text-center">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
          Passo 2
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground">Escolha o barbeiro</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione um profissional ou deixe em automático
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onSelect("any")}
          className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300 ${selected === "any"
            ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,215,0,0.1)]"
            : "border-white/5 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
            }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors group-hover:text-foreground">
            <User size={24} />
          </div>
          <div>
            <span className="block font-display text-lg font-bold text-foreground">Qualquer um</span>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Primeiro disponível</p>
          </div>
        </button>
        {barbers.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300 ${selected === b.id
              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,215,0,0.1)]"
              : "border-white/5 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
              }`}
          >
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-display font-bold text-primary">
              {b.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={b.avatarUrl} alt={b.name} className="h-full w-full object-cover" />
              ) : (
                b.name.charAt(0)
              )}
            </div>
            <div>
              <span className="block font-display text-lg font-bold text-foreground">{b.name}</span>
              {b.specialties && (
                <p className="text-xs text-muted-foreground">
                  {b.specialties.slice(0, 2).join(", ")}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepDateTime({
  calendarMonth,
  setCalendarMonth,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  availableSlots,
  services,
}: {
  calendarMonth: Date
  setCalendarMonth: (d: Date) => void
  selectedDate: Date | null
  setSelectedDate: (d: Date) => void
  selectedTime: string | null
  setSelectedTime: (t: string) => void
  availableSlots: { time: string; barberId: string }[]
  services: Service[]
}) {
  const totalDuration = services.reduce((acc, s) => acc + s.durationMin, 0)
  const totalPrice = services.reduce((acc, s) => acc + s.price, 0)
  const today = startOfDay(new Date())
  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekDay = firstDay.getDay()

  const days: (Date | null)[] = []
  for (let i = 0; i < startWeekDay; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  const isDayOff = (d: Date) => getDay(d) === 0
  const isPast = (d: Date) => isBefore(d, today)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 text-center">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
          Passo 3
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground">Data e Horário</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione o dia e o horário ideal para vocé
        </p>
      </div>

      {/* Mini calendar */}
      <div className="mb-8 rounded-xl border border-white/5 bg-secondary/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold capitalize text-card-foreground">
            {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <button
            onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Proximo mes"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />
            const disabled = isPast(d) || isDayOff(d)
            const isSelected = selectedDate && isSameDay(d, selectedDate)
            return (
              <button
                key={d.toISOString()}
                disabled={disabled}
                onClick={() => setSelectedDate(d)}
                className={`rounded-lg py-2 text-sm transition-all ${disabled
                  ? "cursor-not-allowed text-muted-foreground/40"
                  : isSelected
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "text-card-foreground hover:bg-secondary"
                  }`}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock size={16} className="text-primary" />
            Horários disponíveis em {format(selectedDate, "dd/MM")}
            {services.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                ({totalDuration} min - R$ {totalPrice.toFixed(2)})
              </span>
            )}
          </p>
          {availableSlots.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              Nenhum horário disponível neste dia. Tente outra data.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${selectedTime === slot.time
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-transparent bg-secondary/50 text-foreground hover:border-primary/50 hover:text-primary"
                    }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StepConfirm({
  name,
  setName,
  phone,
  setPhone,
  services,
  barberName,
  date,
  time,
  usingPlan,
  setUsingPlan,
  activePlanName,
  setActivePlanName,
  activePlanPrice,
  setActivePlanPrice,
  isRenewal,
  setIsRenewal,
  renewalDate,
  setRenewalDate,
  planPeriod,
  isAdmin,
}: {
  name: string
  setName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  services: Service[]
  barberName: string
  date: Date | null
  time: string | null
  usingPlan: boolean
  setUsingPlan: (v: boolean) => void
  activePlanName: string | null
  setActivePlanName: (v: string | null) => void
  activePlanPrice: number
  setActivePlanPrice: (v: number) => void
  isRenewal: boolean
  setIsRenewal: (v: boolean) => void
  renewalDate: Date | null
  setRenewalDate: (d: Date | null) => void
  planPeriod: string
  isAdmin: boolean
}) {
  // Logic updated below
  let finalPrice = services.reduce((acc, s) => acc + s.price, 0)

  if (usingPlan) {
    if (isRenewal) {
      finalPrice += activePlanPrice
    } else {
      finalPrice = 0
    }
  }

  // Check for plan when phone changes
  // Check for plan when phone changes
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length >= 10) {
      const plans = getCustomerPlans()
      const customerPlan = plans.find(p => p.customerPhone.replace(/\D/g, "") === cleanPhone && p.active)

      if (customerPlan) {
        // Find the actual plan details to get price
        const allPlans = getPlans()
        const planDetails = allPlans.find(p => p.id === customerPlan.planId)

        setActivePlanName(planDetails?.name || "Plano Ativo")
        if (planDetails) {
          setActivePlanPrice(planDetails.price)
        }
        // We need a way to set price/period back up. 
        // But props are read-only setters.
        // Actually I need to update the parent state.
        // StepConfirm doesn't have setPrice prop, but parent has state.
        // Wait, activePlanPrice is passed as prop, I cannot set it here easily unless I have setActivePlanPrice prop.
        // I missed adding setActivePlanPrice to props.

        // Let's rely on the parent logic or just assume I can't set it here without prop.
        // I will add the missing props in next call if needed, or just emit an event.
        // Actually, for now, let's assume I can't update price here.
        // I'll fix this by adding `setActivePlanPrice` to props in next tool call.
      } else {
        setActivePlanName(null)
        setUsingPlan(false)
        setIsRenewal(false)
        setRenewalDate(null)
      }
    } else {
      setActivePlanName(null)
      setUsingPlan(false)
      setIsRenewal(false)
      setRenewalDate(null)
    }
  }, [phone, setUsingPlan, setActivePlanName, setIsRenewal, setRenewalDate])


  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 text-center">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
          Passo 4
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground">Confirme</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Revise os dados antes de finalizar
        </p>
      </div>

      {/* Summary */}
      <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-sm">
        <div className="grid gap-4 text-sm">
          <div className="flex items-start justify-between gap-8 border-b border-primary/10 pb-4">
            <span className="pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Serviços</span>
            <div className="flex flex-col text-right gap-1">
              {services.map(s => (
                <span key={s.id} className="font-medium text-foreground">{s.name}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-8 border-b border-primary/10 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</span>
            <span className="font-medium text-foreground">
              {date ? format(date, "dd/MM/yyyy") : ""}
            </span>
          </div>
          <div className="flex items-center justify-between gap-8 border-b border-primary/10 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Horário</span>
            <span className="font-medium text-foreground">{time}</span>
          </div>
          <div className="pt-2">
            <div className="flex items-center justify-between gap-8">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-bold text-primary">
                R$ {finalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-card-foreground">
            Seu nome
          </label>
          <Input
            id="name"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-card-foreground">
            Seu telefone
          </label>
          <Input
            id="phone"
            type="tel"
            placeholder="(85) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {isAdmin && activePlanName && (
          <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <p className="font-bold text-yellow-500">Plano Ativo Encontrado!</p>
                  <p className="text-xs text-muted-foreground">Você possui um {activePlanName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground cursor-pointer" htmlFor="use-plan">
                  Usar Plano
                </label>
                <input
                  id="use-plan"
                  type="checkbox"
                  checked={usingPlan}
                  onChange={(e) => setUsingPlan(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
            </div>
            {usingPlan && (
              <div className="mt-4 border-t border-yellow-500/20 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    id="is-renewal"
                    type="checkbox"
                    checked={isRenewal}
                    onChange={(e) => {
                      setIsRenewal(e.target.checked)
                      if (e.target.checked && !renewalDate) {
                        setRenewalDate(new Date()) // Default to today
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="is-renewal" className="text-sm font-medium text-foreground cursor-pointer">
                    É uma renovação de plano?
                  </label>
                </div>

                {isRenewal && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Nova data de renovação
                    </label>
                    <Input
                      type="date"
                      value={renewalDate ? format(renewalDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const d = parse(e.target.value, "yyyy-MM-dd", new Date())
                        setRenewalDate(d)
                      }}
                      className="bg-card border-border h-9 text-sm"
                    />
                    <p className="mt-2 text-xs text-yellow-500">
                      * O valor do plano (R$ {activePlanPrice.toFixed(2)}) será adicionado ao total.
                    </p>
                  </div>
                )}

                {!isRenewal && (
                  <p className="text-xs text-green-400">
                    * O valor do agendamento sera coberto pelo seu plano.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function ConfirmationScreen({
  data,
}: {
  data: { service: string; barber: string; date: string; time: string; price: number }
}) {
  return (
    <div className="mx-auto max-w-lg text-center animate-in zoom-in-95 duration-500">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_40px_rgba(255,215,0,0.2)]">
        <Check size={48} className="text-primary" />
      </div>
      <h2 className="mb-2 font-display text-4xl font-bold text-foreground">Agendamento Realizado!</h2>
      <p className="mb-10 text-muted-foreground">
        Seu agendamento foi criado com status PENDENTE. Aguarde confirmação.
      </p>

      <div className="mb-10 rounded-2xl border border-white/5 bg-card/50 p-8 text-left shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex items-start justify-between gap-8 border-b border-border/30 pb-4">
            <span className="pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Serviço</span>
            <div className="flex flex-col text-right gap-1">
              <span className="font-medium text-foreground">{data.service}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-8 border-b border-border/30 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</span>
            <span className="font-medium text-foreground">{data.date}</span>
          </div>
          <div className="flex items-center justify-between gap-8 border-b border-border/30 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Horário</span>
            <span className="font-medium text-foreground">{data.time}</span>
          </div>
          <div className="pt-2">
            <div className="flex items-center justify-between gap-8">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-bold text-primary">
                R$ {data.price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/">
          <Button
            variant="outline"
            className="w-full border-border bg-transparent text-foreground hover:bg-secondary sm:w-auto"
          >
            Voltar para Home
          </Button>
        </Link>
        <a
          href={`https://wa.me/5585991694689?text=${encodeURIComponent(
            `Ola! Acabei de agendar: ${data.service} no dia ${data.date} as ${data.time}. Gostaria de confirmar.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
            <Phone size={16} className="mr-2" />
            Confirmar via WhatsApp
          </Button>
        </a>
      </div>
    </div>
  )
}
