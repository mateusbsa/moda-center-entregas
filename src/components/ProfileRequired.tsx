import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { profileQuery } from "@/lib/profile";
import { profileErrorMessage } from "@/lib/onboarding";
import { AppHeader } from "./AppHeader";
import { Button } from "./ui/button";

export function ProfileRequired({ children }: { children: ReactNode }) {
  const profile = useQuery(profileQuery);
  if (profile.isPending) return <><AppHeader title="Carregando cadastro" /><p className="p-5 font-semibold">Aguarde…</p></>;
  if (profile.isError || !profile.data) return (
    <div className="mx-auto min-h-screen max-w-md">
      <AppHeader title="Cadastro pendente" />
      <div className="space-y-4 p-5">
        <p role="alert" className="font-semibold text-destructive">{profile.isError ? profileErrorMessage(profile.error) : "Conclua seu cadastro para continuar."}</p>
        <Button asChild variant="action" size="xl"><Link to="/">Revisar cadastro</Link></Button>
      </div>
    </div>
  );
  return children;
}