"use client"

import { useState, useEffect } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { fetchBarbersDB, saveBarberDB, deleteBarberDB } from "@/lib/db_actions"
import type { Barber } from "@/lib/types"
import { Plus, Edit2, Trash2, X, Instagram, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function BarbeirosPage() {
  const [barberList, setBarberList] = useState<Barber[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Barber | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = () => {
    fetchBarbersDB().then(setBarberList)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    try {
      await deleteBarberDB(id)
      load()
      setConfirmDelete(null)
    } catch (e) {
      console.error(e)
      alert("Erro ao excluir barbeiro")
    }
  }

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Barbeiros</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie a equipe da barbearia
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {barberList.map((b) => (
          <div
            key={b.id}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-primary/10">
                {b.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={b.avatarUrl} alt={b.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                    {b.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-card-foreground">{b.name}</h3>
                  <Badge variant={b.active !== false ? "default" : "secondary"} className="h-4 px-1 text-[8px] uppercase tracking-tighter">
                    {b.active !== false ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {b.role && <p className="truncate text-xs text-muted-foreground">{b.role}</p>}
                {b.instagram && (
                  <a href={b.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-primary/80 hover:text-primary hover:underline">
                    <Instagram size={10} />
                    Instagram
                  </a>
                )}
              </div>
            </div>
            {b.specialties && (
              <div className="mb-4 flex flex-wrap gap-1">
                {b.specialties.slice(0, 3).map((s, i) => (
                  <span key={i} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {s}
                  </span>
                ))}
                {b.specialties.length > 3 && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    +{b.specialties.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditing(b); setModalOpen(true) }}
                className="flex-1 border-border bg-transparent text-foreground hover:bg-secondary"
              >
                <Edit2 size={14} className="mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(b.id)}
                className="border-border bg-transparent text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <BarberModal
          barber={editing}
          onClose={() => setModalOpen(false)}
          onSave={async (data) => {
            try {
              await saveBarberDB({ id: editing?.id, ...data })
              load()
              setModalOpen(false)
            } catch (e: any) {
              console.error(e)
              alert("Erro ao salvar barbeiro: " + (e.message || JSON.stringify(e)))
            }
          }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-card-foreground">
              Excluir Barbeiro
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Tem certeza que deseja excluir este barbeiro?
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

function BarberModal({
  barber,
  onClose,
  onSave,
}: {
  barber: Barber | null
  onClose: () => void
  onSave: (data: { name: string; specialties: string[]; role: string; avatarUrl: string; instagram: string; active: boolean }) => void
}) {
  const [name, setName] = useState(barber?.name || "")
  const [role, setRole] = useState(barber?.role || "")
  const [avatarUrl, setAvatarUrl] = useState(barber?.avatarUrl || "")
  const [instagram, setInstagram] = useState(barber?.instagram || "")
  const [active, setActive] = useState(barber?.active !== false)
  const [specialties, setSpecialties] = useState(
    barber?.specialties?.join(", ") || ""
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await onSave({
      name,
      role,
      avatarUrl,
      instagram,
      active,
      specialties: specialties.split(",").map(s => s.trim()).filter(Boolean)
    })
    setLoading(false)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">
            {barber ? "Editar Barbeiro" : "Novo Barbeiro"}
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
              placeholder="Nome do barbeiro"
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Cargo / Funcao
            </label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex: Barbeiro Senior"
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Foto (URL)
            </label>
            <div className="flex gap-2">
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {avatarUrl && (
              <div className="mt-2 h-20 w-20 overflow-hidden rounded-full border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Instagram (URL)
            </label>
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Especialidades (separadas por virgula)
            </label>
            <Input
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="Corte, Barba, Pigmentacao"
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-secondary/30">
            <div className="space-y-0.5">
              <Label htmlFor="active-status" className="text-sm font-medium text-card-foreground">
                Barbeiro Ativo
              </Label>
              <div className="text-[10px] text-muted-foreground">
                Define se o barbeiro está disponível para agendamentos
              </div>
            </div>
            <Switch
              id="active-status"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Salvando..." : (barber ? "Salvar" : "Adicionar")}
          </Button>
        </div>
      </div>
    </>
  )
}
