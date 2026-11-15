import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeSignupProfile, profileQuery, type Perfil } from "@/lib/profile";
import { profileErrorMessage, validateProfileInput } from "@/lib/onboarding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carga MC — Entregas no Moda Center" },
      { name: "description", content: "Logística de entregas atacadistas no Moda Center Santa Cruz: lojistas e entregadores." },
      { property: "og:title", content: "Carga MC — Entregas no Moda Center" },
      { property: "og:description", content: "Cadastre entregas, monte a carga e saia em rota para excursões e transportadoras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [loading, setLoading] = useState(false);
  const [aguardando, setAguardando] = useState(false);
  const [completar, setCompletar] = useState(false);
  const [erroPerfil, setErroPerfil] = useState("");
  const [f, setF] = useState({ email: "", senha: "", nome: "", telefone: "", cpf: "", store_nome: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function rotear() {
    try {
      let p = await qc.fetchQuery(profileQuery);
      if (!p && await completeSignupProfile()) {
        qc.removeQueries({ queryKey: ["profile"] });
        p = await qc.fetchQuery(profileQuery);
      }
      if (!p) { setCompletar(true); return false; }
      await navigate({ to: p.role === "admin" ? "/entregas" : "/carga", replace: true });
      return true;
    } catch (error) {
      setErroPerfil(profileErrorMessage(error));
      setCompletar(true);
      return false;
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const m = data.session.user.user_metadata;
        setPerfil(m["perfil"] === "admin" ? "admin" : "entregador");
        setF((current) => ({ ...current, nome: m["nome"] ?? "", telefone: m["telefone"] ?? "", cpf: m["cpf"] ?? "", store_nome: m["store_nome"] ?? "" }));
        rotear().then((ok) => { if (!ok) setCompletar(true); }).catch((error) => {
          setErroPerfil(profileErrorMessage(error));
          setCompletar(true);
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (completar) {
        validateProfileInput(f);
        const { error } = await supabase.rpc("register_profile", {
          _perfil: perfil ?? "entregador", _nome: f.nome.trim(), _telefone: f.telefone,
          _cnpj: f.cpf, ...(perfil === "admin" ? { _store_nome: f.store_nome.trim() } : {}),
        });
        if (error) throw error;
        qc.removeQueries({ queryKey: ["profile"] });
        if (!(await rotear())) throw new Error("Perfil não encontrado para esta conta.");
      } else if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.senha });
        if (error) throw error;
        qc.removeQueries({ queryKey: ["profile"] });
        const { data: auth } = await supabase.auth.getUser();
        const m = auth.user?.user_metadata;
        if (m) {
          setPerfil(m["perfil"] === "admin" ? "admin" : "entregador");
          setF((current) => ({ ...current, nome: m["nome"] ?? "", telefone: m["telefone"] ?? "", cpf: m["cpf"] ?? "", store_nome: m["store_nome"] ?? "" }));
        }
        try {
          if (!(await rotear())) setCompletar(true);
        } catch (error) {
          setCompletar(true);
          setErroPerfil(profileErrorMessage(error));
        }
      } else {
        validateProfileInput(f);
        const { data, error } = await supabase.auth.signUp({
          email: f.email,
          password: f.senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { perfil, nome: f.nome, telefone: f.telefone, cpf: f.cpf, store_nome: f.store_nome },
          },
        });
        if (error) throw error;
        if (data.session) { qc.removeQueries({ queryKey: ["profile"] }); await rotear(); }
        else setAguardando(true);
      }
    } catch (err) {
      const message = profileErrorMessage(err);
      if (completar) setErroPerfil(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (aguardando)
    return (
      <Shell>
        <div className="card-hard p-6 text-center">
          <h2 className="text-2xl">Confirme seu e-mail</h2>
          <p className="mt-3 text-lg font-medium">Enviamos um link para <b>{f.email}</b>. Depois de confirmar, volte e entre.</p>
          <Button variant="dark" size="xl" className="mt-6" onClick={() => { setAguardando(false); setModo("entrar"); }}>Voltar para entrar</Button>
        </div>
      </Shell>
    );

  if (!perfil)
    return (
      <Shell>
        <p className="text-lg font-semibold">Como você vai usar o app?</p>
        <button onClick={() => setPerfil("admin")} className="card-hard flex w-full items-center gap-4 p-5 text-left active:translate-x-[2px] active:translate-y-[2px]">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-secondary"><Store className="size-9" /></span>
          <span><span className="block font-display text-2xl">Lojista</span><span className="font-medium text-muted-foreground">Cadastrar entregas da semana</span></span>
        </button>
        <button onClick={() => setPerfil("entregador")} className="card-hard flex w-full items-center gap-4 p-5 text-left active:translate-x-[2px] active:translate-y-[2px]">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Truck className="size-9" /></span>
          <span><span className="block font-display text-2xl">Entregador</span><span className="font-medium text-muted-foreground">Montar carga e sair em rota</span></span>
        </button>
      </Shell>
    );

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">{completar ? "Concluir cadastro" : perfil === "admin" ? "Lojista" : "Entregador"}</h2>
        {completar ? <Button variant="link" onClick={async () => { await supabase.auth.signOut(); qc.removeQueries({ queryKey: ["profile"] }); setCompletar(false); setErroPerfil(""); setPerfil(null); }}>Sair</Button> : <Button variant="link" onClick={() => setPerfil(null)}>Trocar perfil</Button>}
      </div>
      {completar && erroPerfil && <p role="alert" className="font-semibold text-destructive">{erroPerfil}</p>}
      {!completar && <div className="grid grid-cols-2 gap-2 rounded-xl border-2 border-foreground p-1">
        {(["entrar", "cadastrar"] as const).map((m) => (
          <button key={m} onClick={() => setModo(m)} className={`h-12 rounded-lg text-base font-bold ${modo === m ? "bg-primary text-primary-foreground" : ""}`}>
            {m === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>}
      <form onSubmit={enviar} className="space-y-4">
        {(modo === "cadastrar" || completar) && (
          <>
            <Campo label="Seu nome"><Input required value={f.nome} onChange={set("nome")} /></Campo>
            <Campo label="Telefone / WhatsApp"><Input type="tel" inputMode="tel" value={f.telefone} onChange={set("telefone")} /></Campo>
            {perfil === "admin" && <Campo label="Nome da loja"><Input required value={f.store_nome} onChange={set("store_nome")} /></Campo>}
            <Campo label={perfil === "admin" ? "Seu CPF" : "CPF do lojista"}>
              <Input required inputMode="numeric" placeholder="000.000.000-00" value={f.cpf} onChange={set("cpf")} />
            </Campo>
          </>
        )}
        {!completar && <><Campo label="E-mail"><Input required type="email" autoComplete="email" value={f.email} onChange={set("email")} /></Campo>
        <Campo label="Senha"><Input required type="password" minLength={6} autoComplete={modo === "entrar" ? "current-password" : "new-password"} value={f.senha} onChange={set("senha")} /></Campo></>}
        <Button type="submit" variant="action" size="xl" disabled={loading}>{loading ? "Aguarde..." : completar ? "Salvar cadastro" : modo === "entrar" ? "Entrar" : "Criar conta"}</Button>
      </form>
    </Shell>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-base font-bold">{label}</Label>{children}</div>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-10">
      <div className="-mx-5 mb-6 border-b-2 border-foreground bg-primary px-5 pb-6 pt-10 text-primary-foreground">
        <p className="text-sm font-bold uppercase tracking-widest">Moda Center Santa Cruz</p>
        <h1 className="mt-1 text-4xl">Carga MC</h1>
        <p className="mt-1 font-semibold">Entregas atacadistas sem perder excursão.</p>
      </div>
      <div className="space-y-4">{children}</div>
    </main>
  );
}
