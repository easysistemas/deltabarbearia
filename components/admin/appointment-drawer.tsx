"use client"

import { useState, useEffect, useMemo } from "react"
import type { Appointment, AppointmentStatus, PaymentMethod, AppointmentProduct, Plan } from "@/lib/types"
import {
  getBarbers, getServices, addAppointment,
  updateAppointment,
  deleteAppointment,
  getPlans,
  getCurrentUser,
} from "@/lib/store"
import { PlanSelector } from "./plan-selector"
import { fetchCustomerActivePlanDB } from "@/lib/db_actions" // This import is still needed for the PlanSelector component or its internal hook
import { cn } from "@/lib/utils"
import { fetchProductsDB } from "@/lib/db_actions"
import { format, parseISO } from "date-fns"
import {
  X,
  Phone,
  User,
  Scissors,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Check,
  Plus,
  Trash2,
  Package,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "./status-badge"

const STATUSES: AppointmentStatus[] = [
  "PENDENTE",
  "CONFIRMADO",
  "FINALIZADO",
  "PAGO",
  "CANCELADO",
  "NO_SHOW",
]

const PAY_METHODS: PaymentMethod[] = ["DINHEIRO", "PIX", "CARTAO_DEBITO", "CARTAO_CREDITO", "PLANO"]

interface Props {
  appointment: Appointment | null
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function AppointmentDrawer({
  appointment,
  open,
  onClose,
  onUpdate,
}: Props) {
  const barbers = getBarbers()
  const allServices = getServices()
  const allPlans = getPlans()
  // const allProducts = getProducts() // Removed static store call
  const [allProducts, setAllProducts] = useState<any[]>([])

  const [notes, setNotes] = useState("")
  const [paidAmount, setPaidAmount] = useState("0")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("")
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  // Editable services state
  const [editingServices, setEditingServices] = useState(false)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

  // Editable products state
  const [editingProducts, setEditingProducts] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<AppointmentProduct[]>([])

  // Editable price state
  const [editingPrice, setEditingPrice] = useState(false)
  const [customPrice, setCustomPrice] = useState("")

  // Editable customer state
  const [editingCustomer, setEditingCustomer] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")

  // Editable barber state
  const [editingBarber, setEditingBarber] = useState(false)
  const [selectedBarberId, setSelectedBarberId] = useState("")

  // State for plan eligibility
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  // Removed local checkingPlan/hasActivePlan states in favor of independent component logic

  // Reset local state whenever the appointment changes
  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes || "")
      setPaidAmount(appointment.paidAmount?.toString() || "0")
      setPaymentMethod(appointment.paymentMethod || "")
      setSelectedServiceIds(
        appointment.serviceIds && appointment.serviceIds.length > 0
          ? appointment.serviceIds
          : [appointment.serviceId]
      )
      setCustomPrice(
        appointment.customPrice != null
          ? appointment.customPrice.toString()
          : ""
      )
      setSelectedProducts(appointment.products || [])
      setEditingServices(false)
      setEditingProducts(false)
      setEditingPrice(false)
      setEditingCustomer(false)
      setEditName(appointment.customerName || "")
      setEditPhone(appointment.customerPhone || "")
      setEditingBarber(false)
      setSelectedBarberId(appointment.barberId)
      setSelectedPlanId(null) // Reset combo selection
    }
  }, [appointment])

  // Fetch products from DB when drawer opens
  useEffect(() => {
    if (open) {
      fetchProductsDB().then(products => {
        setAllProducts(products.filter(p => p.stock > 0)) // Only show products in stock? Or all? User said "de acordo com o banco".
        // Let's show all, but maybe visual cue for out of stock.
        setAllProducts(products)
      })
    }
  }, [open])

  // Plan checking logic moved to PlanSelector component + useCustomerPlan hook
  // Removed the useEffect for checking active plan as it's now handled by PlanSelector

  // if (!open || !appointment) return null // Moved below hooks

  const barber = barbers.find((b) => b.id === appointment?.barberId)

  // Effective services being displayed (either edited or original)
  const effectiveServiceIds = useMemo(() =>
    appointment && appointment.serviceIds && appointment.serviceIds.length > 0
      ? appointment.serviceIds
      : appointment ? [appointment.serviceId] : []
    , [appointment?.serviceId, appointment?.serviceIds])

  const effectiveServices = effectiveServiceIds
    .map((id) => allServices.find((s) => s.id === id))
    .filter(Boolean)

  const calculatedPrice = selectedServiceIds.reduce((sum, id) => {
    const svc = allServices.find((s) => s.id === id)
    return sum + (svc?.price || 0)
  }, 0) + selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0)

  // The final display price
  const displayPrice = appointment
    ? (appointment.customPrice != null
      ? appointment.customPrice
      : appointment.price)
    : 0

  if (!open || !appointment) return null

  const handleStatusChange = async (status: AppointmentStatus) => {
    if (status === "CANCELADO" || status === "NO_SHOW") {
      setShowConfirm(status)
      return
    }

    const updates: Partial<Appointment> = { status }

    await updateAppointment(appointment.id, updates)
    onUpdate()
  }

  const confirmAction = async () => {
    if (showConfirm) {
      await updateAppointment(appointment.id, {
        status: showConfirm as AppointmentStatus,
      })
      setShowConfirm(null)
      onUpdate()
    }
  }

  const handleSaveServices = async () => {
    if (selectedServiceIds.length === 0) return

    const servicesPrice = selectedServiceIds.reduce((sum, id) => {
      const svc = allServices.find((s) => s.id === id)
      return sum + (svc?.price || 0)
    }, 0)

    const productsPrice = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0)

    const newCalcPrice = servicesPrice + productsPrice

    try {
      await updateAppointment(appointment.id, {
        serviceIds: selectedServiceIds,
        products: selectedProducts,
        price: newCalcPrice,
        // If there was a custom price, keep it only if user explicitly set one
        customPrice:
          appointment.customPrice != null ? appointment.customPrice : undefined,
      })
      setEditingServices(false)
      setEditingProducts(false)
      onUpdate()
    } catch (error: any) {
      console.error("Failed to save services/products:", error)
      alert("Erro ao salvar: " + (error.message || JSON.stringify(error)))
    }
  }

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleUpdateProductQuantity = (productId: string, change: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId)
      const product = allProducts.find(p => p.id === productId)

      if (!product) return prev

      if (existing) {
        const newQuantity = existing.quantity + change
        if (newQuantity <= 0) {
          return prev.filter(p => p.productId !== productId)
        }
        return prev.map(p => p.productId === productId ? { ...p, quantity: newQuantity } : p)
      } else {
        if (change > 0) {
          return [...prev, { productId, quantity: change, price: product.price }]
        }
        return prev
      }
    })
  }

  const handleSaveCustomPrice = async () => {
    const value = parseFloat(customPrice)
    if (isNaN(value) || value < 0) return
    await updateAppointment(appointment.id, {
      customPrice: value,
    })
    setEditingPrice(false)
    onUpdate()
  }

  const handleRemoveCustomPrice = async () => {
    await updateAppointment(appointment.id, {
      customPrice: undefined,
    })
    setCustomPrice("")
    setEditingPrice(false)
    onUpdate()
  }

  const handleMarkPaid = async () => {
    await updateAppointment(appointment.id, {
      status: "PAGO",
      paidAmount: parseFloat(paidAmount) || 0,
      paymentMethod: (paymentMethod as PaymentMethod) || undefined,
    })
    onUpdate()
  }

  const handleSaveNotes = async () => {
    await updateAppointment(appointment.id, { notes })
    onUpdate()
  }

  const handleSaveBarber = async () => {
    if (!selectedBarberId) return
    await updateAppointment(appointment.id, { barberId: selectedBarberId })
    setEditingBarber(false)
    onUpdate()
  }

  const handleSaveCustomer = async () => {
    if (!editName || !editPhone) return
    await updateAppointment(appointment.id, {
      customerName: editName,
      customerPhone: editPhone
    })
    setEditingCustomer(false)
    onUpdate()
  }

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir permanentemente este agendamento?")) {
      await deleteAppointment(appointment.id)
      onClose()
      onUpdate()
    }
  }

  const handlePlanSelect = async (planId: string | null) => {
    setSelectedPlanId(planId)
    if (planId) {
      const plan = allPlans.find(p => p.id === planId)
      if (plan) {
        // Calculate usage commission: (Price / Limit) * Rate%
        const usageComm = plan.usageLimit
          ? (plan.price / plan.usageLimit) * (plan.professionalCommissionPercent || 40) / 100
          : undefined

        // Apply plan usage: free for customer, but generates commission for barber
        await updateAppointment(appointment.id, {
          customPrice: 0,
          paymentMethod: "PLANO",
          metadata: {
            ...appointment.metadata,
            planId: plan.id,
            planName: plan.name,
            usageCommission: usageComm,
            isPlanUsage: true
          }
        })
        setCustomPrice("0")
        setPaymentMethod("PLANO")
        onUpdate()
      }
    } else {
      // If plan is deselected, remove custom price and payment method
      await updateAppointment(appointment.id, {
        customPrice: undefined,
        paymentMethod: undefined,
        metadata: {
          ...appointment.metadata,
          planId: undefined,
          planName: undefined,
          usageCommission: undefined,
          isPlanUsage: false
        }
      })
      setCustomPrice("")
      setPaymentMethod("")
      onUpdate()
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-xl">
        <div className="flex h-full flex-col overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-bold text-card-foreground">
              Detalhes do Agendamento
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-auto px-6 py-5">
            {/* Client info */}
            <div className="mb-6">
              {!editingCustomer ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-card-foreground">
                        {appointment.customerName}
                      </h3>
                      <button
                        onClick={() => setEditingCustomer(true)}
                        className="text-[10px] font-medium text-primary hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <a
                    href={`tel:${appointment.customerPhone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Phone size={14} />
                    {appointment.customerPhone}
                  </a>
                </>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-card-foreground">Editar Dados do Cliente</span>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome do Cliente"
                    className="h-8 text-sm bg-background"
                  />
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Telefone do Cliente"
                    className="h-8 text-sm bg-background"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditName(appointment.customerName || "")
                        setEditPhone(appointment.customerPhone || "")
                        setEditingCustomer(false)
                      }}
                      className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveCustomer}
                      className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Check size={12} />
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Details grid */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary p-3">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User size={12} />
                    Barbeiro
                  </div>
                  {!editingBarber ? (
                    <button
                      onClick={() => setEditingBarber(true)}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingBarber(false)}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        <X size={12} />
                      </button>
                      <button
                        onClick={handleSaveBarber}
                        className="text-[10px] text-primary hover:text-primary/80"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {!editingBarber ? (
                  <p className="text-sm font-medium text-card-foreground">
                    {barber?.name || "Sem preferência"}
                  </p>
                ) : (
                  <select
                    value={selectedBarberId}
                    onChange={(e) => setSelectedBarberId(e.target.value)}
                    className="h-6 w-full rounded border border-border bg-background px-1 text-xs"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  Data
                </div>
                <p className="text-sm font-medium text-card-foreground">
                  {format(parseISO(appointment.startAt), "dd/MM/yyyy")}
                </p>
              </div>
              <div className="col-span-2 rounded-lg bg-secondary p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={12} />
                  Horario
                </div>
                <p className="text-sm font-medium text-card-foreground">
                  {format(parseISO(appointment.startAt), "HH:mm")} -{" "}
                  {format(parseISO(appointment.endAt), "HH:mm")}
                </p>
              </div>
            </div>

            {/* ===== SERVICES SECTION (editable) ===== */}
            <div className="mb-6 rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <Scissors size={15} />
                  Servicos Realizados
                </div>
                {!editingServices ? (
                  <button
                    onClick={() => setEditingServices(true)}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    Editar
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedServiceIds(effectiveServiceIds)
                        setEditingServices(false)
                      }}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveServices}
                      disabled={selectedServiceIds.length === 0}
                      className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Check size={12} />
                      Salvar
                    </button>
                  </div>
                )}
              </div>

              {!editingServices ? (
                // Display mode
                <div className="flex flex-col gap-2">
                  {effectiveServices.map((svc) => (
                    <div
                      key={svc!.id}
                      className="flex items-center justify-between rounded-md bg-secondary/70 px-3 py-2"
                    >
                      <span className="text-sm text-card-foreground">
                        {svc!.name}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        R$ {svc!.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">
                      Total dos servicos
                    </span>
                    <span className="text-sm font-semibold text-card-foreground">
                      R${" "}
                      {effectiveServices
                        .reduce((s, svc) => s + (svc?.price || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                // Edit mode - checkboxes
                <div className="flex flex-col gap-1.5">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Selecione todos os servicos realizados:
                  </p>
                  {allServices.map((svc) => {
                    const isSelected = selectedServiceIds.includes(svc.id)
                    return (
                      <button
                        key={svc.id}
                        onClick={() => handleToggleService(svc.id)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/50 hover:border-border hover:bg-secondary"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-4.5 w-4.5 items-center justify-center rounded border ${isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40"
                              }`}
                          >
                            {isSelected && (
                              <Check
                                size={10}
                                className="text-primary-foreground"
                              />
                            )}
                          </div>
                          <span
                            className={`text-sm ${isSelected ? "font-medium text-card-foreground" : "text-muted-foreground"}`}
                          >
                            {svc.name}
                          </span>
                        </div>
                        <span
                          className={`text-sm ${isSelected ? "font-medium text-primary" : "text-muted-foreground"}`}
                        >
                          R$ {svc.price.toFixed(2)}
                        </span>
                      </button>
                    )
                  })}
                  <div className="mt-2 flex items-center justify-between rounded-md bg-primary/5 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Novo total
                    </span>
                    <span className="text-sm font-bold text-primary">
                      R$ {calculatedPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ===== PRODUCTS SECTION (editable) ===== */}
            <div className="mb-6 rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <Package size={15} />
                  Produtos
                </div>
                {!editingProducts ? (
                  <button
                    onClick={() => setEditingProducts(true)}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    Editar
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedProducts(appointment.products || [])
                        setEditingProducts(false)
                      }}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveServices} // Save both services and products
                      className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Check size={12} />
                      Salvar
                    </button>
                  </div>
                )}
              </div>

              {!editingProducts ? (
                // Display mode
                <div className="flex flex-col gap-2">
                  {selectedProducts.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">Nenhum produto adicionado</span>
                  ) : (
                    selectedProducts.map((p) => {
                      const product = allProducts.find(prod => prod.id === p.productId)
                      return (
                        <div
                          key={p.productId}
                          className="flex items-center justify-between rounded-md bg-secondary/70 px-3 py-2"
                        >
                          <span className="text-sm text-card-foreground">
                            {p.quantity}x {product?.name || "Produto Desconhecido"}
                          </span>
                          <span className="text-sm font-medium text-primary">
                            R$ {(p.price * p.quantity).toFixed(2)}
                          </span>
                        </div>
                      )
                    })
                  )}
                  {selectedProducts.length > 0 && (
                    <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                      <span className="text-xs text-muted-foreground">
                        Total dos produtos
                      </span>
                      <span className="text-sm font-semibold text-card-foreground">
                        R${" "}
                        {selectedProducts
                          .reduce((s, p) => s + (p.price * p.quantity), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Edit mode
                <div className="flex flex-col gap-1.5">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Adicionar produtos:
                  </p>
                  {allProducts.map((prod) => {
                    const current = selectedProducts.find(p => p.productId === prod.id)
                    const quantity = current?.quantity || 0

                    return (
                      <div
                        key={prod.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all ${quantity > 0
                          ? "border-primary bg-primary/5"
                          : "border-border bg-secondary/50"
                          }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-card-foreground">
                            {prod.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            R$ {prod.price.toFixed(2)} • Estoque: {prod.stock}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {quantity > 0 && (
                            <span className="text-sm font-bold text-primary">{quantity}</span>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateProductQuantity(prod.id, -1)}
                              className="h-6 w-6 rounded bg-secondary text-foreground hover:bg-secondary/80 flex items-center justify-center font-bold"
                              disabled={quantity === 0}
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleUpdateProductQuantity(prod.id, 1)}
                              className="h-6 w-6 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center font-bold"
                            // disabled={prod.stock <= 0} // Allow adding even if stock is low? Admin override.
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="mt-2 flex items-center justify-between rounded-md bg-primary/5 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Novo total (Serviços + Produtos)
                    </span>
                    <span className="text-sm font-bold text-primary">
                      R$ {calculatedPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ===== CUSTOM PRICE / VALUE OVERRIDE ===== */}
            <div className="mb-6 rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <CreditCard size={15} />
                  Valor Total
                </div>
                {!editingPrice ? (
                  <button
                    onClick={() => {
                      setCustomPrice(displayPrice.toFixed(2))
                      setEditingPrice(true)
                    }}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    Editar Valor
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingPrice(false)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveCustomPrice}
                      className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Check size={12} />
                      Salvar
                    </button>
                  </div>
                )}
              </div>

              {!editingPrice ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-card-foreground">
                      R$ {displayPrice.toFixed(2)}
                    </span>
                    {appointment.customPrice != null && (
                      <span className="text-xs text-muted-foreground line-through">
                        R$ {appointment.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {appointment.customPrice != null && (
                    <p className="mt-1 text-xs text-primary">
                      Valor personalizado aplicado
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">
                    Altere o valor cobrado (desconto, acrescimo, etc.):
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="0.00"
                      className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Preco original dos servicos:</span>
                    <span>R$ {appointment.price.toFixed(2)}</span>
                  </div>
                  {appointment.customPrice != null && (
                    <button
                      onClick={handleRemoveCustomPrice}
                      className="flex items-center gap-1.5 self-start rounded-md px-2.5 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 size={12} />
                      Remover valor personalizado
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Status actions */}
            <div className="mb-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Alterar Status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={appointment.status === s}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${appointment.status === s
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      } disabled:opacity-50`}
                  >
                    {s === "NO_SHOW" ? "No-show" : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment - mark as paid */}
            <div className={`mb-6 rounded-lg border ${appointment.status === "PAGO" && appointment.paidAmount === 0 && displayPrice > 0 ? "border-destructive/50 bg-destructive/10" : "border-border"} p-4`}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <CreditCard size={15} />
                  Registrar Pagamento
                </div>
                {appointment.status === "PAGO" && (
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-500 uppercase">
                    Status Pago
                  </span>
                )}
              </div>

              {appointment.status === "PAGO" && appointment.paidAmount === 0 && displayPrice > 0 && (
                <div className="mb-4 rounded bg-destructive/20 p-2 text-xs text-destructive-foreground">
                  <strong>Atenção:</strong> Este agendamento consta como PAGO, mas nenhum valor foi registrado.
                </div>
              )}

              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Valor a cobrar</span>
                <span className="font-medium text-card-foreground">
                  R$ {displayPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Valor pago"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as PaymentMethod)
                    }
                    className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Metodo</option>
                    {PAY_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method === "CARTAO_DEBITO" ? "CARTÃO DE DÉBITO" :
                          method === "CARTAO_CREDITO" ? "CARTÃO DE CRÉDITO" :
                            method === "CARTAO" ? "CARTÃO (Antigo)" :
                              method}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  size="sm"
                  onClick={handleMarkPaid}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Marcar como Pago
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                <FileText size={15} />
                Observacoes
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Adicionar observacao..."
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveNotes}
                className="mt-2 border-border bg-transparent text-foreground hover:bg-secondary"
              >
                Salvar Observacao
              </Button>
            </div>

            {/* ===== COMBOS / PLANOS ===== */}
            {/* ===== COMBOS / PLANOS ===== */}
            <div className="mb-6">
              <PlanSelector
                customerPhone={appointment.customerPhone}
                selectedPlanId={selectedPlanId || undefined}
                plans={allPlans}
                onSelectPlan={handlePlanSelect}
              />
            </div>

            {/* Delete button - ADMIN only */}
            {getCurrentUser()?.role === "ADMIN" && (
              <div className="mt-4 border-t border-border pt-6 pb-6">
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} />
                  Excluir Agendamento
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-card-foreground">
              Confirmar acao
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {showConfirm === "CANCELADO"
                ? "Tem certeza que deseja cancelar este agendamento?"
                : "Tem certeza que deseja marcar como No-show?"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(null)}
                className="flex-1 border-border bg-transparent text-foreground hover:bg-secondary"
              >
                Voltar
              </Button>
              <Button
                onClick={confirmAction}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
