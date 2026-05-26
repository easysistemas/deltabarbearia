"use client"

import { useState, useEffect } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { getServices, setServices, addService, updateService, deleteService, fetchServices, reorderServices } from "@/lib/store"
import type { Service } from "@/lib/types"
import { Plus, Edit2, Trash2, X, Clock, DollarSign, EyeOff, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export default function ServicosPage() {
  const [serviceList, setServiceList] = useState<Service[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = async () => {
    const data = await fetchServices()
    setServiceList(data)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    await deleteService(id)
    load()
    setConfirmDelete(null)
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return
    }

    const items = Array.from(serviceList)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setServiceList(items)

    // Updates order property based on new index and saves to DB
    reorderServices(items)
  }

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Servicos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os servicos oferecidos
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={16} className="mr-1.5" />
          Adicionar
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="services-list" direction="vertical">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {serviceList.map((s, index) => (
                <Draggable key={s.id} draggableId={s.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative rounded-xl border bg-card p-6 ${s.visible === false ? 'border-muted/50 opacity-60' : 'border-border'}`}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                            <GripVertical size={16} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground">{s.name}</h3>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{s.category}</span>
                              <span>•</span>
                              <span className="uppercase text-[10px] tracking-wider border border-border px-1 rounded">{s.type || "barbearia"}</span>
                            </div>
                          </div>
                        </div>
                        {s.visible === false && <EyeOff size={16} className="text-muted-foreground" />}
                      </div>

                      <div className="mb-4 flex items-center gap-4 pl-6">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock size={14} />
                          {s.durationMin} min
                        </span>
                        <span className="flex items-center gap-1 text-sm font-bold text-primary">
                          <DollarSign size={14} />
                          R$ {s.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2 pl-6">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditing(s); setModalOpen(true) }}
                          className="flex-1 border-border bg-transparent text-foreground hover:bg-secondary"
                        >
                          <Edit2 size={14} className="mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDelete(s.id)}
                          className="border-border bg-transparent text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Modal */}
      {modalOpen && (
        <ServiceModal
          service={editing}
          onClose={() => setModalOpen(false)}
          onSave={async (data) => {
            if (editing) {
              await updateService(editing.id, data)
            } else {
              await addService({ id: `s_${Date.now()}`, ...data })
            }
            load()
            setModalOpen(false)
          }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-card-foreground">
              Excluir Servico
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Tem certeza que deseja excluir este servico?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border-border bg-transparent text-foreground hover:bg-secondary"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </Button>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  )
}

function ServiceModal({
  service,
  onClose,
  onSave,
}: {
  service: Service | null
  onClose: () => void
  onSave: (data: { name: string; durationMin: number; price: number; visible: boolean; category: string; type: "barbearia" | "salao"; commissionPercent?: number | null }) => Promise<void>
}) {
  const [name, setName] = useState(service?.name || "")
  const [duration, setDuration] = useState(service?.durationMin?.toString() || "30")
  const [price, setPrice] = useState(service?.price?.toString() || "0")
  const [category, setCategory] = useState(service?.category || "")
  const [type, setType] = useState<"barbearia" | "salao">(service?.type || "barbearia")
  const [commissionPercent, setCommissionPercent] = useState(service?.commissionPercent?.toString() || "")
  const [visible, setVisible] = useState(service?.visible ?? true)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await onSave({
      name,
      durationMin: parseInt(duration) || 30,
      price: parseFloat(price) || 0,
      visible,
      category,
      type,
      commissionPercent: commissionPercent ? parseInt(commissionPercent) : null
    })
    setLoading(false)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">
            {service ? "Editar Servico" : "Novo Servico"}
          </h2>
          <button onClick={onClose} aria-label="Fechar">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Nome
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do servico"
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>



          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Categoria
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Cortes, Barba, Tratamentos..."
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              <option value="Cortes" />
              <option value="Barba & Acabamento" />
              <option value="Tratamentos" />
              <option value="Combos" />
            </datalist>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Duracao (min)
              </label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="border-border bg-secondary text-foreground"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Preco (R$)
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="border-border bg-secondary text-foreground"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Comissão (%)
              </label>
              <Input
                type="number"
                value={commissionPercent}
                placeholder="Padrão"
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="border-border bg-secondary text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-card-foreground">Visível no site</span>
            <Switch checked={visible} onCheckedChange={setVisible} />
          </div>

          <Button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Salvando..." : (service ? "Salvar" : "Adicionar")}
          </Button>
        </div>
      </div >
    </>
  )
}
