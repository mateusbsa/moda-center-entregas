import { STATUS_LABEL } from "@/lib/format";

export function StatusBadge({ status }: { status: keyof typeof STATUS_LABEL }) {
  const cls = { pendente_carga: "bg-secondary text-secondary-foreground", em_rota: "bg-primary text-primary-foreground", entregue: "bg-success text-success-foreground", atrasado: "bg-destructive text-destructive-foreground" }[status];
  return <span className={`shrink-0 rounded-md border-2 border-foreground px-2 py-0.5 text-sm font-black ${cls}`}>{STATUS_LABEL[status]}</span>;
}

