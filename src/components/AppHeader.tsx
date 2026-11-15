import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string | undefined }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b-2 border-foreground bg-primary px-4 py-3 text-primary-foreground">
      <Package className="size-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-sm font-semibold opacity-90">{subtitle}</p>}
      </div>
      <button onClick={sair} aria-label="Sair" className="flex size-12 items-center justify-center rounded-lg border-2 border-primary-foreground">
        <LogOut className="size-6" />
      </button>
    </header>
  );
}
