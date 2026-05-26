import type { AppointmentStatus } from "@/lib/types"

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  PENDENTE: {
    label: "Pendente",
    className: "bg-orange-600/15 text-orange-600 border-orange-600/30",
  },
  CONFIRMADO: {
    label: "Confirmado",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  FINALIZADO: {
    label: "Finalizado",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  PAGO: {
    label: "Pago",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  NO_SHOW: {
    label: "No-show",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
