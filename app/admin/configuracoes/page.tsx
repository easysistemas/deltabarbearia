"use client"

import { useState, useEffect } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { fetchBusinessConfig, updateBusinessConfig } from "@/lib/db_actions"
import type { BusinessConfig } from "@/lib/types"
import { useRouter } from "next/navigation" // Added
import { getCurrentUser } from "@/lib/store" // Added
import { Save, Clock, Shield, Calendar, ImageIcon, Type, X, LayoutTemplate, Building2, MessageSquare, TrendingUp, Lock, GripVertical, Tags, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"

const DAYS = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terca", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sabado", value: 6 },
]

export default function ConfiguracoesPage() {
  const [config, setLocalConfig] = useState<BusinessConfig | null>(null)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // RBAC Check
    const user = getCurrentUser()
    if (user && user.role !== "ADMIN") {
      router.push("/admin/agenda")
      return
    }

    fetchBusinessConfig().then(data => {
      if (data) setLocalConfig(data)
    })
  }, [])

  if (!config) return null

  const handleSave = async () => {
    try {
      await updateBusinessConfig(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error: any) {
      console.error("Failed to save config", error)
      alert("Erro ao salvar configurações: " + (error.message || JSON.stringify(error)))
    }
  }

  const toggleDayOff = (day: number) => {
    setLocalConfig({
      ...config,
      daysOff: config.daysOff.includes(day)
        ? config.daysOff.filter((d) => d !== day)
        : [...config.daysOff, day],
    })
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !config) return

    const { source, destination } = result

    // If dropped in the same list
    if (source.droppableId === destination.droppableId) {
      return // We don't care about order for now
    }

    const availablePages = NAV_OPTIONS.filter(p => !config.allowedOperationalPages?.includes(p))
    const allowedPages = config.allowedOperationalPages || []

    let newAllowed = [...allowedPages]

    if (source.droppableId === "available" && destination.droppableId === "allowed") {
      const pageToAdd = availablePages[source.index]
      newAllowed.push(pageToAdd)
    } else if (source.droppableId === "allowed" && destination.droppableId === "available") {
      newAllowed.splice(source.index, 1)
    }

    setLocalConfig({ ...config, allowedOperationalPages: newAllowed })
  }

  const NAV_OPTIONS = [
    "Agenda", "Relatorios", "Financeiro", "Clientes", "Barbeiros", "Combos", "Produtos", "Servicos", "Configuracoes"
  ]

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as informações da empresa e do site
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save size={16} className="mr-2" />
          {saved ? "Salvo!" : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ——— Left Column: Company Info ——— */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Building2 className="text-primary" size={20} />
            <h2 className="text-lg font-semibold text-foreground">Informações da Empresa</h2>
          </div>

          {/* Business hours */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2 text-card-foreground">
              <Clock size={16} className="text-muted-foreground" />
              <h3 className="font-semibold">Horario de Funcionamento</h3>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Abertura</label>
                <Input
                  type="time"
                  value={config.openTime}
                  onChange={(e) => setLocalConfig({ ...config, openTime: e.target.value })}
                  className="border-border bg-secondary text-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Fechamento</label>
                <Input
                  type="time"
                  value={config.closeTime}
                  onChange={(e) => setLocalConfig({ ...config, closeTime: e.target.value })}
                  className="border-border bg-secondary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Days off */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2 text-card-foreground">
              <Calendar size={16} className="text-muted-foreground" />
              <h3 className="font-semibold">Dias de Folga</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => toggleDayOff(d.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${config.daysOff.includes(d.value)
                    ? "bg-destructive/20 text-destructive border border-destructive/20"
                    : "bg-secondary text-muted-foreground border border-transparent hover:bg-secondary/80"
                    }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buffer & Cancellation */}
          <div className="space-y-6">
            {/* Buffer */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center gap-2 text-card-foreground">
                <Clock size={16} className="text-muted-foreground" />
                <h3 className="font-semibold">Intervalo (Buffer)</h3>
              </div>
              <div className="max-w-[150px]">
                <Input
                  type="number"
                  value={config.bufferMin}
                  onChange={(e) => setLocalConfig({ ...config, bufferMin: parseInt(e.target.value) || 0 })}
                  className="border-border bg-secondary text-foreground"
                />
                <span className="text-xs text-muted-foreground">Minutos entre agendamentos</span>
              </div>
            </div>

            {/* Cancellation */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center gap-2 text-card-foreground">
                <Shield size={16} className="text-muted-foreground" />
                <h3 className="font-semibold">Política de Cancelamento</h3>
              </div>
              <textarea
                value={config.cancellationPolicy}
                onChange={(e) => setLocalConfig({ ...config, cancellationPolicy: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Default Commissions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2 text-card-foreground">
                <TrendingUp size={16} className="text-muted-foreground" />
                <h3 className="font-semibold">Comissões Padrão (%)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Serviços</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={config.defaultServiceCommissionPercent ?? 40}
                      onChange={(e) => setLocalConfig({ ...config, defaultServiceCommissionPercent: parseFloat(e.target.value) || 0 })}
                      className="border-border bg-secondary text-foreground pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Produtos</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={config.defaultProductCommissionPercent ?? 10}
                      onChange={(e) => setLocalConfig({ ...config, defaultProductCommissionPercent: parseFloat(e.target.value) || 0 })}
                      className="border-border bg-secondary text-foreground pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Valores padrão para cálculo de comissão. Podem ser sobrescritos por configurações específicas de Planos/Combos.
              </p>
            </div>

          </div>
        </div>

        {/* ——— Right Column: Site Info ——— */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <LayoutTemplate className="text-primary" size={20} />
            <h2 className="text-lg font-semibold text-foreground">Informações do Site</h2>
          </div>

          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-5 bg-muted/50 p-1">
              <TabsTrigger value="hero" className="text-xs">Capa</TabsTrigger>
              <TabsTrigger value="testimonials" className="text-xs">Depoimentos</TabsTrigger>
              <TabsTrigger value="messages" className="text-xs">Mensagens</TabsTrigger>
              <TabsTrigger value="tags" className="text-xs">Etiquetas</TabsTrigger>
              <TabsTrigger value="access" className="text-xs">Acessos</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="space-y-6">
              {/* Hero */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 font-semibold text-card-foreground">Capa (Hero)</h3>
                <div className="space-y-3">
                  <Input
                    value={config.heroBgImage || ""}
                    onChange={(e) => setLocalConfig({ ...config, heroBgImage: e.target.value })}
                    placeholder="Imagem de fundo (URL)"
                    className="border-border bg-secondary text-foreground px-3 py-2 h-9 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={config.heroTitle || ""}
                      onChange={(e) => setLocalConfig({ ...config, heroTitle: e.target.value })}
                      placeholder="Título Principal"
                      className="border-border bg-secondary text-foreground px-3 py-2 h-9 text-sm"
                    />
                    <Input
                      value={config.heroSubtitle || ""}
                      onChange={(e) => setLocalConfig({ ...config, heroSubtitle: e.target.value })}
                      placeholder="Subtítulo"
                      className="border-border bg-secondary text-foreground px-3 py-2 h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 font-semibold text-card-foreground">Sobre</h3>
                <div className="space-y-3">
                  <Input
                    value={config.aboutImage || ""}
                    onChange={(e) => setLocalConfig({ ...config, aboutImage: e.target.value })}
                    placeholder="Imagem Sobre (URL)"
                    className="border-border bg-secondary text-foreground px-3 py-2 h-9 text-sm"
                  />
                  <Input
                    value={config.aboutTitle || ""}
                    onChange={(e) => setLocalConfig({ ...config, aboutTitle: e.target.value })}
                    placeholder="Título Sobre"
                    className="border-border bg-secondary text-foreground px-3 py-2 h-9 text-sm"
                  />
                  <textarea
                    value={config.aboutDescription || ""}
                    onChange={(e) => setLocalConfig({ ...config, aboutDescription: e.target.value })}
                    rows={4}
                    placeholder="Descrição"
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Gallery */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 font-semibold text-card-foreground">Galeria</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL da imagem"
                      id="gallery-input"
                      className="h-8 text-xs border-border bg-secondary text-foreground"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const input = document.getElementById("gallery-input") as HTMLInputElement
                        if (input && input.value) {
                          setLocalConfig({ ...config, gallery: [...(config.gallery || []), input.value] })
                          input.value = ""
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {config.gallery?.slice(0, 8).map((url, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded bg-secondary">
                        <img src={url} className="h-full w-full object-cover" />
                        <button
                          onClick={() => {
                            const newG = [...(config.gallery || [])]
                            newG.splice(i, 1)
                            setLocalConfig({ ...config, gallery: newG })
                          }}
                          className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-red-500"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="space-y-3">
                  <Input
                    value={config.locationTitle || ""}
                    onChange={(e) => setLocalConfig({ ...config, locationTitle: e.target.value })}
                    placeholder="Título da Seção Localização"
                    className="border-border bg-secondary text-foreground"
                  />
                  <textarea
                    value={config.locationAddress || ""}
                    onChange={(e) => setLocalConfig({ ...config, locationAddress: e.target.value })}
                    rows={3}
                    placeholder="Endereço"
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Input
                    value={config.locationMapUrl || ""}
                    onChange={(e) => setLocalConfig({ ...config, locationMapUrl: e.target.value })}
                    placeholder="URL do Iframe do Mapa"
                    className="border-border bg-secondary text-foreground"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={config.locationPhone || ""}
                      onChange={(e) => setLocalConfig({ ...config, locationPhone: e.target.value })}
                      placeholder="Telefone"
                      className="border-border bg-secondary text-foreground"
                    />
                    <Input
                      value={config.contactWhatsapp || ""}
                      onChange={(e) => setLocalConfig({ ...config, contactWhatsapp: e.target.value })}
                      placeholder="Link WhatsApp"
                      className="border-border bg-secondary text-foreground"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="differentials" className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex justify-between">
                  <h3 className="font-semibold text-card-foreground">Diferenciais</h3>
                  <Button size="sm" variant="outline" onClick={() => {
                    const newDiffs = [...(config.differentials || []), { title: "Novo", description: "Descricao" }]
                    setLocalConfig({ ...config, differentials: newDiffs })
                  }}>Adicionar</Button>
                </div>
                <div className="space-y-4">
                  {config.differentials?.map((diff, i) => (
                    <div key={i} className="relative rounded border border-border bg-secondary/30 p-3">
                      <button onClick={() => {
                        const newD = [...(config.differentials || [])]
                        newD.splice(i, 1)
                        setLocalConfig({ ...config, differentials: newD })
                      }} className="absolute right-2 top-2 text-destructive hover:scale-110"><X size={14} /></button>
                      <Input
                        value={diff.title}
                        onChange={(e) => {
                          const newD = [...(config.differentials || [])]
                          newD[i] = { ...newD[i], title: e.target.value }
                          setLocalConfig({ ...config, differentials: newD })
                        }}
                        className="mb-2 h-7 border-transparent bg-transparent px-0 font-semibold focus:border-b-primary focus:ring-0"
                      />
                      <textarea
                        value={diff.description}
                        onChange={(e) => {
                          const newD = [...(config.differentials || [])]
                          newD[i] = { ...newD[i], description: e.target.value }
                          setLocalConfig({ ...config, differentials: newD })
                        }}
                        rows={2}
                        className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="testimonials" className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex justify-between">
                  <h3 className="font-semibold text-card-foreground">Depoimentos</h3>
                  <Button size="sm" variant="outline" onClick={() => {
                    const newItems = [...(config.testimonials || []), { name: "Cliente", text: "Depoimento..." }]
                    setLocalConfig({ ...config, testimonials: newItems })
                  }}>Adicionar</Button>
                </div>
                <div className="space-y-4">
                  {config.testimonials?.map((t, i) => (
                    <div key={i} className="relative rounded border border-border bg-secondary/30 p-3">
                      <button onClick={() => {
                        const newItems = [...(config.testimonials || [])]
                        newItems.splice(i, 1)
                        setLocalConfig({ ...config, testimonials: newItems })
                      }} className="absolute right-2 top-2 text-destructive hover:scale-110"><X size={14} /></button>

                      <Input
                        value={t.name}
                        onChange={(e) => {
                          const newItems = [...(config.testimonials || [])]
                          newItems[i] = { ...newItems[i], name: e.target.value }
                          setLocalConfig({ ...config, testimonials: newItems })
                        }}
                        className="mb-2 h-7 border-transparent bg-transparent px-0 font-semibold focus:border-b-primary focus:ring-0"
                        placeholder="Nome do Cliente"
                      />
                      <textarea
                        value={t.text}
                        onChange={(e) => {
                          const newItems = [...(config.testimonials || [])]
                          newItems[i] = { ...newItems[i], text: e.target.value }
                          setLocalConfig({ ...config, testimonials: newItems })
                        }}
                        rows={3}
                        className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none focus:bg-background/50 rounded p-1"
                        placeholder="Texto do depoimento"
                      />
                    </div>
                  ))}
                  {(!config.testimonials || config.testimonials.length === 0) && (
                    <p className="text-center text-xs text-muted-foreground">Nenhum depoimento.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  <h3 className="font-semibold text-card-foreground">Templates de Mensagens</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Lembrete de Retorno (WhatsApp)</label>
                      <Badge variant="outline" className="text-[10px]">Análise de Frequência</Badge>
                    </div>
                    <textarea
                      value={config.whatsappOverdueTemplate || ""}
                      onChange={(e) => setLocalConfig({ ...config, whatsappOverdueTemplate: e.target.value })}
                      rows={4}
                      placeholder="Template da mensagem..."
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                      <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">Variáveis Disponíveis:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{"{cliente}"}</code>
                          <span>Nome do cliente</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{"{servico}"}</code>
                          <span>Nome do serviço</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tags size={18} className="text-primary" />
                    <h3 className="font-semibold text-card-foreground">Etiquetas de Clientes</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-2 border-primary/20 text-primary hover:bg-primary/10"
                    onClick={() => {
                      const newTag = { id: crypto.randomUUID(), name: "Nova Etiqueta", color: "#6b7280" }
                      setLocalConfig({ ...config, customerTags: [...(config.customerTags || []), newTag] })
                    }}
                  >
                    <Plus size={14} /> Nova
                  </Button>
                </div>
                <div className="space-y-3">
                  {(config.customerTags || []).map((t, i) => (
                    <div key={t.id} className="relative flex items-center gap-3 rounded border border-border bg-secondary/30 p-3 pr-10">
                      <input
                        type="color"
                        value={t.color}
                        onChange={(e) => {
                          const newItems = [...(config.customerTags || [])]
                          newItems[i] = { ...newItems[i], color: e.target.value }
                          setLocalConfig({ ...config, customerTags: newItems })
                        }}
                        className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent outline-none flex-shrink-0"
                      />
                      <Input
                        value={t.name}
                        onChange={(e) => {
                          const newItems = [...(config.customerTags || [])]
                          newItems[i] = { ...newItems[i], name: e.target.value }
                          setLocalConfig({ ...config, customerTags: newItems })
                        }}
                        className="h-8 bg-transparent focus:bg-background border-border flex-1 text-sm font-medium"
                        placeholder="Nome da Etiqueta"
                      />
                      <button onClick={() => {
                        const newItems = [...(config.customerTags || [])]
                        newItems.splice(i, 1)
                        setLocalConfig({ ...config, customerTags: newItems })
                      }} className="absolute right-3 text-destructive hover:scale-110 flex-shrink-0"><X size={16} /></button>
                    </div>
                  ))}
                  {(!config.customerTags || config.customerTags.length === 0) && (
                    <p className="text-center text-xs text-muted-foreground p-4">Nenhuma etiqueta cadastrada.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access" className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Lock size={18} className="text-primary" />
                  <h3 className="font-semibold text-card-foreground">Acesso Operacional</h3>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  Arraste as páginas para definir o que o perfil <strong>Operacional</strong> pode visualizar e acessar.
                </p>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Available Pages */}
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Páginas Bloqueadas</span>
                      <Droppable droppableId="available">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="min-h-[300px] flex-1 rounded-xl border border-dashed border-border p-4 bg-muted/20"
                          >
                            {NAV_OPTIONS.filter(p => !config.allowedOperationalPages?.includes(p)).map((page, index) => (
                              <Draggable key={page} draggableId={page} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="mb-2 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm hover:border-primary/50 transition-colors"
                                  >
                                    <span className="font-medium">{page}</span>
                                    <GripVertical size={14} className="text-muted-foreground" />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>

                    {/* Allowed Pages */}
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">Páginas Permitidas</span>
                      <Droppable droppableId="allowed">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="min-h-[300px] flex-1 rounded-xl border border-dashed border-primary/30 p-4 bg-primary/5"
                          >
                            {(config.allowedOperationalPages || []).map((page, index) => (
                              <Draggable key={page} draggableId={page} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="mb-2 flex items-center justify-between rounded-lg border border-primary/20 bg-card px-4 py-3 text-sm shadow-sm hover:border-primary/50 transition-colors"
                                  >
                                    <span className="font-medium text-primary">{page}</span>
                                    <GripVertical size={14} className="text-primary/50" />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                </DragDropContext>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </AdminShell>
  )
}
