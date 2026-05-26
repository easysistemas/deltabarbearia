"use client"

import type {
  Appointment,
  AppointmentStatus,
  Barber,
  BusinessConfig,
  PaymentMethod,
  Service,
  Product,
  Plan,
  CustomerPlan,
  Customer,
  Expense
} from "./types"
import { addMinutes, format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isSameDay, addDays } from "date-fns"

const STORAGE_KEYS = {
  barbers: "delta_barbers",
  services: "delta_services",
  products: "delta_products",
  appointments: "delta_appointments",
  config: "delta_config",
  auth: "delta_auth",
}

// ——— Default Data ———

const defaultBarbers: Barber[] = [
  {
    id: "b1",
    name: "Carlos Silva",
    specialties: ["Corte Masculino", "Barba", "Pigmentacao"],
  },
  {
    id: "b2",
    name: "Rafael Costa",
    specialties: ["Corte Masculino", "Sobrancelha", "Nevou"],
  },
]

const defaultServices: Service[] = [
  { id: "s1", name: "Corte Masculino", durationMin: 40, price: 35 },
  { id: "s2", name: "Barba", durationMin: 30, price: 25 },
  { id: "s3", name: "Corte + Barba", durationMin: 60, price: 55 },
  { id: "s4", name: "Sobrancelha", durationMin: 15, price: 15 },
  { id: "s5", name: "Pigmentacao", durationMin: 45, price: 60 },
  { id: "s6", name: "Nevou", durationMin: 50, price: 50 },
]

const defaultConfig: BusinessConfig = {
  openTime: "09:00",
  closeTime: "19:00",
  bufferMin: 10,
  daysOff: [0],
  cancellationPolicy:
    "Cancelamentos devem ser feitos com pelo menos 2 horas de antecedencia.",
  whatsappOverdueTemplate: 'Olá {cliente}! Notamos que faz tempo que você não vem fazer seu {servico}. Que tal agendar um horário?',
}

function generateMockAppointments(): Appointment[] {
  const now = new Date()
  const appointments: Appointment[] = []
  const statuses: AppointmentStatus[] = [
    "PENDENTE",
    "CONFIRMADO",
    "FINALIZADO",
    "PAGO",
    "CANCELADO",
    "NO_SHOW",
    "PAGO",
    "CONFIRMADO",
    "PENDENTE",
    "FINALIZADO",
  ]
  const names = [
    "Joao Pedro",
    "Matheus Lima",
    "Lucas Souza",
    "Gabriel Santos",
    "Pedro Henrique",
    "Thiago Oliveira",
    "Bruno Alves",
    "Felipe Costa",
    "Andre Moreira",
    "Gustavo Rocha",
  ]
  const phones = [
    "85991000001",
    "85991000002",
    "85991000003",
    "85991000004",
    "85991000005",
    "85991000006",
    "85991000007",
    "85991000008",
    "85991000009",
    "85991000010",
  ]
  // Expanded list to include new methods for random assignment if needed, or just legacy support?
  // Let's keep it simple for now, maybe favor PIX/DINHEIRO for dev data
  const payMethods: (PaymentMethod | undefined)[] = ["PIX", "DINHEIRO", "CARTAO_DEBITO", "CARTAO_CREDITO", undefined]

  for (let i = 0; i < 10; i++) {
    const dayOffset = Math.floor(i * 2.5) - 5
    const date = addDays(now, dayOffset)
    if (date.getDay() === 0) date.setDate(date.getDate() + 1)

    const hour = 9 + (i % 8)
    date.setHours(hour, 0, 0, 0)

    const barberId = i % 2 === 0 ? "b1" : "b2"
    const serviceId = defaultServices[i % defaultServices.length].id
    const service = defaultServices.find((s) => s.id === serviceId)!
    const startAt = date.toISOString()
    const endAt = addMinutes(date, service.durationMin).toISOString()
    const status = statuses[i]
    const isPaid = status === "PAGO" || status === "FINALIZADO"

    appointments.push({
      id: `a${i + 1}`,
      customerName: names[i],
      customerPhone: phones[i],
      barberId,
      serviceId,
      startAt,
      endAt,
      status,
      price: service.price,
      paidAmount: isPaid ? service.price : 0,
      paymentMethod: isPaid ? payMethods[i % 3] as PaymentMethod : undefined,
      notes: i === 0 ? "Cliente preferiu corte mais curto nas laterais" : undefined,
      createdAt: addDays(date, -1).toISOString(),
    })
  }
  return appointments
}

// ——— Storage helpers ———

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, data: T) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

// ——— Public API ———

// Cache for barbers
let barbersCache: Barber[] = []
let barbersLoaded = false

function mapRowToBarber(row: any): Barber {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    specialties: row.specialties || [],
    avatarUrl: row.image_url,
    instagram: row.instagram,
    commissionRate: row.commission_rate || 50, // Default 50%
    active: row.is_active
  }
}

export async function fetchBarbers(): Promise<Barber[]> {
  // If we haven't loaded yet, try to load from local storage first as temporary placeholder
  if (!barbersLoaded && typeof window !== "undefined") {
    const cached = getItem<Barber[]>(STORAGE_KEYS.barbers, [])
    if (cached.length > 0) barbersCache = cached
  }

  const { data, error } = await supabase
    .from("barbers")
    .select("*")
    .order("name")

  if (error || !data) {
    // console.error("Error fetching barbers:", error)
    return barbersCache.length > 0 ? barbersCache : defaultBarbers
  }

  barbersCache = data.map(mapRowToBarber)
  barbersLoaded = true

  // Update local storage as backup
  setItem(STORAGE_KEYS.barbers, barbersCache)

  return barbersCache
}

export function getBarbers(): Barber[] {
  if (barbersCache.length > 0) return barbersCache
  return getItem(STORAGE_KEYS.barbers, defaultBarbers)
}

export function setBarbers(barbers: Barber[]) {
  barbersCache = barbers
  setItem(STORAGE_KEYS.barbers, barbers)
}


// ——— Services ———
let servicesCache: Service[] = []
let servicesLoaded = false

function mapRowToService(row: any): Service {
  return {
    id: row.id,
    name: row.name,
    durationMin: row.duration_min,
    price: row.price,
    visible: row.visible,
    category: row.category || "Geral",
    type: row.type || "barbearia",
    order: row.order || 0,
    commissionPercent: row.commission_percent
  }
}

export async function reorderServices(services: Service[]) {
  // Update local cache immediately
  servicesCache = services
  setItem(STORAGE_KEYS.services, services)

  // Update in DB
  const updates = services.map((s, index) => ({
    id: s.id,
    name: s.name,
    duration_min: s.durationMin,
    price: s.price,
    visible: s.visible,
    category: s.category,
    type: s.type,
    order: index,
    commission_percent: s.commissionPercent
  }))

  const { error } = await supabase.from("services").upsert(updates, { onConflict: 'id' })
  if (error) console.error("Error reordering services:", error)
}

export async function fetchServices(): Promise<Service[]> {
  if (!servicesLoaded && typeof window !== "undefined") {
    const cached = getItem<Service[]>(STORAGE_KEYS.services, [])
    if (cached.length > 0) servicesCache = cached
  }

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("order", { ascending: true })

  if (error || !data) {
    if (servicesCache.length > 0) return servicesCache
    return defaultServices.map(s => ({ ...s, visible: true, category: "Cortes", type: "barbearia" }))
  }

  servicesCache = data.map(mapRowToService)
  servicesLoaded = true
  setItem(STORAGE_KEYS.services, servicesCache)
  return servicesCache
}

export function getServices(): Service[] {
  if (servicesCache.length > 0) return servicesCache
  return getItem(STORAGE_KEYS.services, defaultServices.map(s => ({ ...s, visible: true, category: "Cortes", type: "barbearia" })))
}

export function setServices(services: Service[]) {
  servicesCache = services
  setItem(STORAGE_KEYS.services, services)
}

export async function addService(service: Service) {
  const all = getServices()
  all.push(service)
  setServices(all)

  const { error } = await supabase.from("services").insert({
    id: service.id,
    name: service.name,
    duration_min: service.durationMin,
    price: service.price,
    visible: service.visible,
    category: service.category,
    type: service.type,
    order: service.order ?? 9999,
    commission_percent: service.commissionPercent
  })

  if (error) console.error("Error adding service:", error)
}

export async function updateService(id: string, updates: Partial<Service>) {
  const all = getServices()
  const idx = all.findIndex(s => s.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates }
    setServices([...all])
  }

  const dbUpdates: any = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.durationMin !== undefined) dbUpdates.duration_min = updates.durationMin
  if (updates.price !== undefined) dbUpdates.price = updates.price
  if (updates.visible !== undefined) dbUpdates.visible = updates.visible
  if (updates.category !== undefined) dbUpdates.category = updates.category
  if (updates.type !== undefined) dbUpdates.type = updates.type
  if (updates.order !== undefined) dbUpdates.order = updates.order
  if (updates.commissionPercent !== undefined) dbUpdates.commission_percent = updates.commissionPercent

  const { error } = await supabase.from("services").update(dbUpdates).eq("id", id)
  if (error) console.error("Error updating service:", error)
}

export async function deleteService(id: string) {
  const all = getServices().filter(s => s.id !== id)
  setServices(all)

  const { error } = await supabase.from("services").delete().eq("id", id)
  if (error) console.error("Error deleting service:", error)
}


// ——— Plans (Combos) ———
const STORAGE_KEYS_PLANS = "triv_plans"
let plansCache: Plan[] = []
let plansLoaded = false

const defaultPlans: Plan[] = [
  {
    id: "p1",
    name: "Corte Mensal",
    price: 120,
    period: "/mes",
    description: "4 cortes masculinos por mes",
    features: ["4 cortes por mes", "Agendamento prioritario", "Desconto em outros servicos"],
    visible: true,
    featured: false
  }
]

function mapRowToPlan(row: any): Plan {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    period: row.period || "/mes",
    description: row.description,
    features: row.features || [],
    discountPercent: row.discount_percent,
    visible: row.visible,
    featured: row.featured,
    professionalCommissionPercent: row.professional_commission_percent
  }
}

export async function fetchPlans(): Promise<Plan[]> {
  if (!plansLoaded && typeof window !== "undefined") {
    const cached = getItem<Plan[]>(STORAGE_KEYS_PLANS, [])
    if (cached.length > 0) plansCache = cached
  }

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("price")

  if (error || !data) {
    if (plansCache.length > 0) return plansCache
    return defaultPlans
  }

  plansCache = data.map(mapRowToPlan)
  plansLoaded = true
  setItem(STORAGE_KEYS_PLANS, plansCache)
  return plansCache
}

export function getPlans(): Plan[] {
  if (plansCache.length > 0) return plansCache
  return getItem(STORAGE_KEYS_PLANS, defaultPlans)
}

export function setPlans(plans: Plan[]) {
  plansCache = plans
  setItem(STORAGE_KEYS_PLANS, plans)
}

export async function addPlan(plan: Plan) {
  const all = getPlans()
  all.push(plan)
  setPlans(all)

  const { error } = await supabase.from("plans").insert({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    period: plan.period,
    description: plan.description,
    features: plan.features, // Supabase handles array[]
    discount_percent: plan.discountPercent,
    visible: plan.visible,
    featured: plan.featured,
    professional_commission_percent: plan.professionalCommissionPercent
  })

  if (error) console.error("Error adding plan:", error)
}

export async function updatePlan(id: string, updates: Partial<Plan>) {
  const all = getPlans()
  const idx = all.findIndex(p => p.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates }
    setPlans([...all])
  }

  const dbUpdates: any = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.price !== undefined) dbUpdates.price = updates.price
  if (updates.period !== undefined) dbUpdates.period = updates.period
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.features !== undefined) dbUpdates.features = updates.features
  if (updates.discountPercent !== undefined) dbUpdates.discount_percent = updates.discountPercent
  if (updates.visible !== undefined) dbUpdates.visible = updates.visible
  if (updates.featured !== undefined) dbUpdates.featured = updates.featured
  if (updates.professionalCommissionPercent !== undefined) dbUpdates.professional_commission_percent = updates.professionalCommissionPercent

  const { error } = await supabase.from("plans").update(dbUpdates).eq("id", id)
  if (error) console.error("Error updating plan:", error)
}

export async function deletePlan(id: string) {
  const all = getPlans().filter(p => p.id !== id)
  setPlans(all)

  const { error } = await supabase.from("plans").delete().eq("id", id)
  if (error) console.error("Error deleting plan:", error)
}

// ——— Products ———

const defaultProducts: Product[] = [
  {
    id: "p1",
    name: "Pomada Modeladora",
    description: "Fixação forte e efeito matte",
    price: 35.0,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1626307416562-ee839676f5fc?w=300&h=300&fit=crop",
  },
  {
    id: "p2",
    name: "Óleo para Barba",
    description: "Hidratação e brilho para sua barba",
    price: 25.0,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1626307416562-ee839676f5fc?w=300&h=300&fit=crop",
  },
  {
    id: "p3",
    name: "Shampoo 2 em 1",
    description: "Cabelo e barba",
    price: 30.0,
    stock: 12,
  },
]

export function getProducts(): Product[] {
  return getItem(STORAGE_KEYS.products, defaultProducts)
}

export function setProducts(products: Product[]) {
  setItem(STORAGE_KEYS.products, products)
}

export function updateProductStock(productId: string, quantityChange: number) {
  const products = getProducts()
  const idx = products.findIndex(p => p.id === productId)
  if (idx !== -1) {
    products[idx].stock += quantityChange
    setProducts(products)
  }
}

// ——— Supabase Integration ———
import { supabase } from "./supabase"

// Cache for appointments to keep synchronous read access
let appointmentsCache: Appointment[] = []
let appointmentsLoaded = false

// Map Supabase row to Appointment type
function mapRowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    barberId: row.barber_id || "any",
    serviceId: row.service_ids?.[0] || row.service_id || "", // Fallback
    serviceIds: row.service_ids || [row.service_id].filter(Boolean),
    products: row.products || [], // JSONB field
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status as AppointmentStatus,
    price: row.price || 0,
    paidAmount: row.paid_amount || 0,
    paymentMethod: row.payment_method as PaymentMethod,
    notes: row.notes,
    customPrice: row.custom_price,
    createdAt: row.created_at,
    metadata: row.metadata || {},
  }
}

// Fetch all appointments from Supabase and update cache
export async function fetchAppointments(): Promise<Appointment[]> {
  // If we haven't loaded yet, try to load from local storage first as temporary placeholder
  if (!appointmentsLoaded && typeof window !== "undefined") {
    const cached = getItem<Appointment[]>(STORAGE_KEYS.appointments, [])
    if (cached.length > 0) appointmentsCache = cached
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")

  if (error || !data) {
    // console.error("Error fetching appointments:", error)
    return appointmentsCache
  }

  appointmentsCache = data.map(mapRowToAppointment)
  appointmentsLoaded = true

  // Update local storage as backup
  setItem(STORAGE_KEYS.appointments, appointmentsCache)

  return appointmentsCache
}

export function getAppointments(): Appointment[] {
  // Return in-memory cache
  return appointmentsCache
}

export function setAppointments(appointments: Appointment[]) {
  appointmentsCache = appointments
  setItem(STORAGE_KEYS.appointments, appointments)
}

export async function addAppointment(appt: Appointment) {
  // Optimistic update
  const all = getAppointments()
  all.push(appt)
  setAppointments(all)

  // Ensure customer exists
  try {
    const cleanPhone = appt.customerPhone.replace(/\D/g, "")
    if (cleanPhone.length >= 10) {
      await fetchCustomers()
      const customers = getCustomers()
      const existing = customers.find(c => c.phone.replace(/\D/g, "") === cleanPhone)

      if (!existing) {
        await addCustomer({
          name: appt.customerName,
          phone: appt.customerPhone,
        })
      }
    }
  } catch (err) {
    console.error("Error ensuring customer exists during appointment creation:", err)
  }

  // Update stock conceptually (optimistic)
  if (appt.products) {
    appt.products.forEach(p => updateProductStock(p.productId, -p.quantity))
  }

  // Send to Supabase
  const { error } = await supabase.from("appointments").insert({
    id: appt.id,
    customer_name: appt.customerName,
    customer_phone: appt.customerPhone,
    barber_id: appt.barberId,
    service_ids: appt.serviceIds || [appt.serviceId],
    products: appt.products,
    start_at: appt.startAt,
    end_at: appt.endAt,
    status: appt.status,
    price: appt.price,
    paid_amount: appt.paidAmount,
    payment_method: appt.paymentMethod,
    notes: appt.notes,
    custom_price: appt.customPrice,
    metadata: appt.metadata,
  })

  if (error) {
    console.error("Error adding appointment:", error)
  }
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  // Optimistic update
  const all = getAppointments()
  const idx = all.findIndex((a) => a.id === id)
  if (idx !== -1) {
    const oldAppt = all[idx]

    // Handle stock restore/deduct if products changed (complex logically, simple implementation for now)
    // If we were real sticklers we'd diff the products. 
    // For now assuming updates via UI might trigger full replacement of product list.

    all[idx] = { ...all[idx], ...updates }
    setAppointments([...all]) // Create new reference
  }

  // Map updates to snake_case for Supabase
  const dbUpdates: any = {}
  if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName
  if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone
  if (updates.barberId !== undefined) dbUpdates.barber_id = updates.barberId
  if (updates.serviceIds !== undefined) dbUpdates.service_ids = updates.serviceIds
  if (updates.products !== undefined) dbUpdates.products = updates.products
  if (updates.startAt !== undefined) dbUpdates.start_at = updates.startAt
  if (updates.endAt !== undefined) dbUpdates.end_at = updates.endAt
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.price !== undefined) dbUpdates.price = updates.price
  if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount
  if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes
  if (updates.customPrice !== undefined) dbUpdates.custom_price = updates.customPrice
  if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata

  const { error } = await supabase
    .from("appointments")
    .update(dbUpdates)
    .eq("id", id)

  if (error) {
    console.error("Error updating appointment:", error)
    throw error
  }
}

export async function deleteAppointment(id: string) {
  // Optimistic update
  const all = getAppointments().filter((a) => a.id !== id)
  setAppointments(all)

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting appointment:", error)
  }
}

export function getConfig(): BusinessConfig {
  return getItem(STORAGE_KEYS.config, defaultConfig)
}
export function setConfig(config: BusinessConfig) {
  setItem(STORAGE_KEYS.config, config)
}

// ——— Availability ———

export function getAvailableSlots(
  date: Date,
  durationMin: number,
  barberId?: string
): { time: string; barberId: string }[] {
  const config = getConfig()

  const dayOfWeek = date.getDay()
  if (config.daysOff.includes(dayOfWeek)) return []

  const [openH, openM] = config.openTime.split(":").map(Number)
  const [closeH, closeM] = config.closeTime.split(":").map(Number)

  // Uses cached appointments (synchronous)
  const allAppointments = getAppointments().filter(
    (a) => a.status !== "CANCELADO" && a.status !== "NO_SHOW"
  )

  const barbers = getBarbers().filter(b => b.active !== false)
  const targetBarbers = barberId
    ? barbers.filter((b) => b.id === barberId)
    : barbers

  const slots: { time: string; barberId: string }[] = []

  for (const barber of targetBarbers) {
    // ... (existing loop content) 
    // This replace seems risky because I am replacing "const slots..." which is inside getAvailableSlots.
    // I should append the new function at the end of the file or after getAppointments if possible.
    // Actually, I'll just add it at the end of the file.

    const barberAppts = allAppointments.filter(
      (a) => a.barberId === barber.id && isSameDay(parseISO(a.startAt), date)
    )

    const slotDate = new Date(date)
    slotDate.setHours(openH, openM, 0, 0)

    const endDate = new Date(date)
    endDate.setHours(closeH, closeM, 0, 0)

    while (slotDate < endDate) {
      const slotEnd = addMinutes(slotDate, durationMin)
      if (slotEnd > endDate) break

      // Check past
      if (slotDate <= new Date()) {
        slotDate.setMinutes(slotDate.getMinutes() + 30)
        continue
      }

      const hasConflict = barberAppts.some((appt) => {
        const apptStart = parseISO(appt.startAt)
        const apptEnd = addMinutes(parseISO(appt.endAt), config.bufferMin)
        return slotDate < apptEnd && slotEnd > apptStart
      })

      if (!hasConflict) {
        // Enforce max 2 concurrent appointments globally
        const concurrentAppts = allAppointments.filter((appt) => {
          const apptStart = parseISO(appt.startAt)
          const apptEnd = addMinutes(parseISO(appt.endAt), config.bufferMin)
          return slotDate < apptEnd && slotEnd > apptStart
        })

        if (concurrentAppts.length < barbers.length) {
          const existing = slots.find((s) => s.time === format(slotDate, "HH:mm"))
          if (!existing) {
            slots.push({
              time: format(slotDate, "HH:mm"),
              barberId: barber.id,
            })
          }
        }
      }

      slotDate.setMinutes(slotDate.getMinutes() + 30)
    }
  }

  slots.sort((a, b) => a.time.localeCompare(b.time))
  return slots
}

// ——— Customer Plans (Combos) ———

const defaultCustomerPlans: CustomerPlan[] = [] // Start empty
let customerPlansCache: CustomerPlan[] = []
let customerPlansLoaded = false

function mapRowToCustomerPlan(row: any): CustomerPlan {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    planId: row.plan_id,
    startDate: row.start_date,
    active: row.active,
    status: row.status || (row.active ? 'active' : 'inactive'), // Fallback
    usageCount: row.usage_count || 0
  }
}

export async function fetchCustomerPlans(): Promise<CustomerPlan[]> {
  if (!customerPlansLoaded && typeof window !== "undefined") {
    const cached = getItem<CustomerPlan[]>("triv_customer_plans", [])
    if (cached.length > 0) customerPlansCache = cached
  }

  const { data, error } = await supabase
    .from("customer_plans")
    .select("*")
    .order("customer_name") // Sorting by customer name is reasonable

  if (error || !data) {
    console.error("Error fetching customer plans:", error)
    if (customerPlansCache.length > 0) return customerPlansCache
    return defaultCustomerPlans
  }

  customerPlansCache = data.map(mapRowToCustomerPlan)

  customerPlansLoaded = true
  setItem("triv_customer_plans", customerPlansCache)
  return customerPlansCache
}

export function getCustomerPlans(): CustomerPlan[] {
  if (customerPlansCache.length > 0) return customerPlansCache
  return getItem("triv_customer_plans", defaultCustomerPlans)
}

export async function addCustomerPlan(plan: CustomerPlan) {
  const all = getCustomerPlans()
  all.push(plan)
  customerPlansCache = all
  setItem("triv_customer_plans", all)

  const { error } = await supabase.from("customer_plans").insert({
    id: plan.id,
    customer_name: plan.customerName,
    customer_phone: plan.customerPhone,
    plan_id: plan.planId,
    start_date: plan.startDate,
    active: plan.active,
    usage_count: plan.usageCount
  })
  if (error) console.error("Error adding customer plan", error)
}

export async function updateCustomerPlan(id: string, updates: Partial<CustomerPlan>) {
  const all = getCustomerPlans()
  const idx = all.findIndex(p => p.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates }
    customerPlansCache = all
    setItem("triv_customer_plans", all)
  }

  const dbUpdates: any = {}
  if (updates.active !== undefined) {
    dbUpdates.active = updates.active
    dbUpdates.status = updates.active ? 'active' : 'inactive'
  }
  if (updates.status !== undefined) {
    dbUpdates.status = updates.status
    // sync legacy active
    if (updates.status === 'active') dbUpdates.active = true
    else dbUpdates.active = false
  }
  if (updates.usageCount !== undefined) dbUpdates.usage_count = updates.usageCount
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate

  const { error } = await supabase.from("customer_plans").update(dbUpdates).eq("id", id)
  if (error) console.error("Error updating customer plan", error)
}


// ——— Expenses (Financeiro) ———

const defaultExpenses: Expense[] = []
let expensesCache: Expense[] = []
let expensesLoaded = false

function mapRowToExpense(row: any): Expense {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category,
    paymentMethod: row.payment_method
  }
}

export async function fetchExpenses(): Promise<Expense[]> {
  if (!expensesLoaded && typeof window !== "undefined") {
    const cached = getItem<Expense[]>("triv_expenses", [])
    if (cached.length > 0) expensesCache = cached
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })

  if (error || !data) {
    if (expensesCache.length > 0) return expensesCache
    return defaultExpenses
  }

  expensesCache = data.map(mapRowToExpense)
  expensesLoaded = true
  setItem("triv_expenses", expensesCache)
  return expensesCache
}

export function getExpenses(): Expense[] {
  if (expensesCache.length > 0) return expensesCache
  return getItem("triv_expenses", defaultExpenses)
}

export async function addExpense(expense: Expense) {
  const all = getExpenses()
  all.unshift(expense)
  expensesCache = all
  setItem("triv_expenses", all)

  const { error } = await supabase.from("expenses").insert({
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    category: expense.category,
    payment_method: expense.paymentMethod
  })
  if (error) console.error("Error adding expense", error)
}

export async function deleteExpense(id: string) {
  const all = getExpenses().filter(e => e.id !== id)
  expensesCache = all
  setItem("triv_expenses", all)

  const { error } = await supabase.from("expenses").delete().eq("id", id)
  if (error) console.error("Error deleting expense", error)
}


// ——— Auth ———

import { User } from "./types"

// Simple session storage
let currentUser: User | null = null

export async function login(email: string, pass: string): Promise<{ success: boolean, error?: string }> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password", pass) // Plain text as requested
    .single()

  if (error || !data) {
    return { success: false, error: "Email ou senha incorretos" }
  }

  currentUser = {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(currentUser))
  }

  return { success: true }
}

export function isLoggedIn(): boolean {
  return !!getCurrentUser()
}

export function getCurrentUser(): User | null {
  if (currentUser) return currentUser
  return getItem<User | null>(STORAGE_KEYS.auth, null)
}

export function logout() {
  currentUser = null
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.auth)
  }
}

// ——— CSV Export ———

export function exportCSV(appointments: Appointment[]): string {
  const barbers = getBarbers()
  const services = getServices()
  const headers = [
    "ID",
    "Cliente",
    "Telefone",
    "Barbeiro",
    "Servico",
    "Inicio",
    "Fim",
    "Status",
    "Preco",
    "Pago",
    "Metodo",
    "Obs",
    "Produtos",
  ]
  const rows = appointments.map((a) => {
    const productStr = a.products?.map(p => `${p.quantity}x ${p.productId}`).join("; ") || ""
    return [
      a.id,
      a.customerName,
      a.customerPhone,
      barbers.find((b) => b.id === a.barberId)?.name || "",
      services.find((s) => s.id === a.serviceId)?.name || "",
      format(parseISO(a.startAt), "dd/MM/yyyy HH:mm"),
      format(parseISO(a.endAt), "dd/MM/yyyy HH:mm"),
      a.status,
      `R$${a.price.toFixed(2)}`,
      `R$${a.paidAmount.toFixed(2)}`,
      a.paymentMethod || "",
      a.notes || "",
      productStr
    ]
  })
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
}

export function getPlanUsage(customerPhone: string, startDate: string): number {
  const appointments = getAppointments()
  const start = parseISO(startDate)
  const cleanPhone = customerPhone.replace(/\D/g, "")
  if (!cleanPhone) return 0

  return appointments.filter(a => {
    if (a.status === "CANCELADO" || a.status === "NO_SHOW") return false
    if (parseISO(a.startAt) < start) return false
    if (a.paymentMethod !== "PLANO") return false

    const aPhone = a.customerPhone.replace(/\D/g, "")
    // Robust match - requires at least 8 digits to avoid matching empty strings/short snippets incorrectly
    if (aPhone.length < 8 || cleanPhone.length < 8) return false
    return aPhone.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(aPhone.slice(-8))
  }).length
}

// ——— Customers ———

import { fetchCustomersDB, createCustomerDB, updateCustomerDB } from "./db_actions"

let customersCache: Customer[] = []

export async function fetchCustomers() {
  const data = await fetchCustomersDB()
  customersCache = data
  return data
}

export function getCustomers() {
  return customersCache
}

export async function addCustomer(customer: { name: string, phone: string, birthDate?: string, notes?: string, tags?: string[] }) {
  await createCustomerDB(customer)
  await fetchCustomers()
}

export async function updateCustomer(id: string, updates: { name?: string, phone?: string, birthDate?: string, notes?: string, tags?: string[] }) {
  await updateCustomerDB(id, updates)
  await fetchCustomers()
}

export async function deleteCustomer(id: string) {
  // We don't have deleteCustomerDB in db_actions yet, but let's try to add it to store first
  // Actually I'll implement it directly using supabase here if needed, or fix db_actions.
  // Let's try to add it to db_actions again but more carefully.
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting customer:", error)
    throw error
  }
  await fetchCustomers()
}
