export type AppointmentStatus =
  | "PENDENTE"
  | "CONFIRMADO"
  | "FINALIZADO"
  | "PAGO"
  | "CANCELADO"
  | "NO_SHOW"

export type PaymentMethod = "PIX" | "CARTAO" | "DINHEIRO" | "PLANO" | "CARTAO_DEBITO" | "CARTAO_CREDITO"

export interface Barber {
  id: string
  name: string
  avatarUrl?: string
  specialties?: string[]
  role?: string
  instagram?: string
  commissionRate?: number // Percentage 0-100
  active?: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'OPERATIONAL'
}

export interface Service {
  id: string
  name: string
  durationMin: number
  price: number
  visible?: boolean
  category?: string
  type?: "barbearia" | "salao"
  order?: number
  commissionPercent?: number | null // 0-100 or null for default
}

export interface Plan {
  id: string
  name: string
  price: number
  period: string // e.g. "/mes"
  description: string
  features: string[]
  discountPercent?: number
  visible?: boolean
  featured?: boolean
  professionalCommissionPercent?: number // 0-100
  usageLimit?: number // Max number of uses per period
}

export interface CustomerPlan {
  id: string
  customerName: string
  customerPhone: string
  planId: string
  startDate: string
  renewsAt?: string
  status: "active" | "inactive" | "cancelled"
  usageCount: number
  createdAt?: string
  active?: boolean // Deprecated, kept for checks
}

export interface Customer {
  id: string
  name: string
  phone: string
  birthDate?: string // ISO date "YYYY-MM-DD"
  notes?: string
  createdAt?: string
  tags?: string[]
}

export interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: string
  paymentMethod?: PaymentMethod
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  stock: number
  imageUrl?: string
  categoryId?: string
  visible?: boolean
  commissioned?: boolean // Default true
}

export interface AppointmentProduct {
  productId: string
  quantity: number
  price: number // Price at the time of appointment (snapshot)
}

export interface Appointment {
  id: string
  customerName: string
  customerPhone: string
  barberId: string
  serviceId: string
  /** Actual services performed (may differ from the originally booked serviceId) */
  serviceIds?: string[]
  /** Products purchased during the appointment */
  products?: AppointmentProduct[]
  startAt: string
  endAt: string
  status: AppointmentStatus
  price: number
  /** Custom/overridden price set by admin (discount, extra service, etc.) */
  customPrice?: number
  paidAmount: number
  paymentMethod?: PaymentMethod
  notes?: string
  createdAt: string
  metadata?: {
    isRenewal?: boolean
    renewalDate?: string
    [key: string]: any
  }
}

export interface BusinessConfig {
  openTime: string
  closeTime: string
  bufferMin: number
  daysOff: number[]
  cancellationPolicy: string
  gallery?: string[]
  heroBgImage?: string
  heroTitle?: string
  heroSubtitle?: string

  // About Section
  aboutImage?: string
  aboutTitle?: string
  aboutDescription?: string

  // Location Section
  locationTitle?: string
  locationAddress?: string
  locationMapUrl?: string
  locationPhone?: string
  contactWhatsapp?: string

  // Differentials Section
  differentials?: { title: string; description: string; icon?: string }[]

  // Testimonials Section
  testimonials?: { name: string; text: string }[]

  // Default Commissions
  defaultServiceCommissionPercent?: number
  defaultProductCommissionPercent?: number

  // RBAC
  allowedOperationalPages?: string[]

  // WhatsApp Reminders
  whatsappOverdueTemplate?: string

  // Customer Tags (List of available tags)
  customerTags?: { id: string; name: string; color: string }[]
}
