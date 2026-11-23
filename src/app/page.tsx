"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Home,
  Laptop,
  LogOut,
  Moon,
  Sun,
  Ticket,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TelaInicio } from "@/components/conectati/tela-inicio";
import { TelaLogin } from "@/components/conectati/tela-login";
import { AbaChamados } from "@/components/conectati/aba-chamados";
import { AbaEquipamentos } from "@/components/conectati/aba-equipamentos";
import { AbaIndicadores } from "@/components/conectati/aba-indicadores";
import { ConectaRobot } from "@/components/conectati/conecta-robot";
import type {
  AuthUsuario,
  Chamado,
  Evidencia,
  Equipamento,
} from "@/lib/conectati";

type Aba = "inicio" | "chamados" | "equipamentos" | "indicadores";

const ABAS: { id: Aba; rotulo: string; icone: typeof Home }[] = [
  { id: "inicio", rotulo: "Início", icone: Home },
  { id: "chamados", rotulo: "Chamados", icone: Ticket },
  { id: "equipamentos", rotulo: "Equipamentos", icone: Laptop },
  { id: "indicadores", rotulo: "Indicadores", icone: BarChart3 },
];

function AlternarTema() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar modo claro/escuro"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="text-slate-700 hover:bg-white/50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <Sun className="h-5 w-5 dark:hidden" aria-hidden="true" />
      <Moon className="h-5 w-5 hidden dark:block" aria-hidden="true" />
    </Button>
  );
}

export default function Page() {
  const { toast } = useToast();
  const [montado, setMontado] = useState(false);
  const [auth, setAuth] = useState<AuthUsuario | null>(null);
  const [aba, setAba] = useState<Aba>("inicio");
  const [abaPendente, setAbaPendente] = useState<Aba>("inicio");
  const [telaLogin, setTelaLogin] = useState(false);

  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    try {
      const salvoAuth = localStorage.getItem("hd_auth");
      if (salvoAuth) {
        const obj = JSON.parse(salvoAuth) as Partial<AuthUsuario>;
        if (obj?.nome) {
          setAuth({
            nome: obj.nome,
            metodo: obj.metodo ?? "Sessão salva",
            unidade: obj.unidade ?? "Taguatinga",
          });
        }
      }
    } catch {
      /* storage indisponível */
    }
    setMontado(true);
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    try {
      const [rCh, rEq] = await Promise.all([
        fetch("/api/chamados", { cache: "no-store" }),
        fetch("/api/equipamentos", { cache: "no-store" }),
      ]);
      const dCh = await rCh.json();
      const dEq = await rEq.json();
      if (!rCh.ok) throw new Error(dCh?.erro ?? "erro");
      if (!rEq.ok) throw new Error(dEq?.erro ?? "erro");
      setChamados(dCh.chamados ?? []);
      setEquipamentos(dEq.equipamentos ?? []);
    } catch {
      setErro(true);
      toast({
        title: "Erro ao carregar dados",
        description: "Verifique a conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => {
    if (montado) carregar();
  }, [montado, carregar]);

  const entrar = useCallback(
    (nome: string, metodo: string, unidade: string) => {
      const usuario = { nome, metodo, unidade };
      try {
        localStorage.setItem("hd_auth", JSON.stringify(usuario));
        localStorage.setItem("hd_usuario", nome);
      } catch {
        /* ignore */
      }
      setAuth(usuario);
      setTelaLogin(false);
      setAba(abaPendente);
      toast({
        title: `Bem-vindo(a), ${nome.split(" ")[0]}!`,
        description: `Suporte TI · Senac ${unidade} · acesso por ${metodo}.`,
      });
    },
    [abaPendente, toast],
  );

  const sair = useCallback(() => {
    try {
      localStorage.removeItem("hd_auth");
    } catch {
      /* ignore */
    }
    setAuth(null);
    setAba("inicio");
    setAbaPendente("inicio");
  }, []);

  const abrirLogin = useCallback((destino: Aba) => {
    setAbaPendente(destino);
    setTelaLogin(true);
  }, []);

  const clicarAba = useCallback(
    (destino: Aba) => {
      const protegida = destino !== "inicio";
      if (protegida && !auth) {
        abrirLogin(destino);
        return;
      }
      setAba(destino);
    },
    [auth, abrirLogin],
  );

  const atualizarChamado = useCallback(
    async (
      id: string,
      dados: Partial<
        Pick<Chamado, "tipo" | "local" | "descricao" | "prioridade" | "status">
      > & { evidencia?: Evidencia },
    ): Promise<boolean> => {
      try {
        const resposta = await fetch(`/api/chamados/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        });
        const corpo = await resposta.json();
        if (!resposta.ok) throw new Error(corpo?.erro ?? "erro");
        await carregar();
        return true;
      } catch (e) {
        toast({
          title: "Não foi possível atualizar",
          description:
            e instanceof Error && e.message !== "erro"
              ? e.message
              : "Tente novamente em instantes.",
          variant: "destructive",
        });
        return false;
      }
    },
    [carregar, toast],
  );

  const criarChamado = useCallback(
    async (dados: {
      tipo: string;
      local: string;
      descricao: string;
      prioridade: string;
      solicitante: string;
      evidencia?: Evidencia;
    }): Promise<boolean> => {
      try {
        if (dados.descricao.length < 10) {
          throw new Error("Descreva o problema com pelo menos 10 caracteres.");
        }
        if (!dados.solicitante.trim()) {
          throw new Error("Informe o nome do solicitante.");
        }
        const resposta = await fetch("/api/chamados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            dados.evidencia ? dados : { ...dados, evidencia: undefined },
          ),
        });
        const corpo = await resposta.json();
        if (!resposta.ok) throw new Error(corpo?.erro ?? "erro");
        await carregar();
        return true;
      } catch (e) {
        toast({
          title: "Não foi possível abrir o chamado",
          description:
            e instanceof Error && e.message !== "erro"
              ? e.message
              : "Tente novamente em instantes.",
          variant: "destructive",
        });
        return false;
      }
    },
    [carregar, toast],
  );

  const atualizarEquipamento = useCallback(
    async (
      id: string,
      dados: { status: string; reservadoPor?: string | null },
    ): Promise<boolean> => {
      try {
        const resposta = await fetch(`/api/equipamentos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        });
        const corpo = await resposta.json();
        if (!resposta.ok) throw new Error(corpo?.erro ?? "erro");
        await carregar();
        return true;
      } catch (e) {
        toast({
          title: "Não foi possível atualizar o equipamento",
          description:
            e instanceof Error && e.message !== "erro"
              ? e.message
              : "Tente novamente em instantes.",
          variant: "destructive",
        });
        return false;
      }
    },
    [carregar, toast],
  );

  if (!montado) {
    return (
      <div
        className="min-h-dvh"
        style={{
          background:
            "linear-gradient(180deg, #8fadcf 0%, #93aed2 24%, #c2d0e2 40%, #ecf0f4 56%, #f3f0ea 76%, #f4ede1 100%)",
        }}
        aria-hidden="true"
      />
    );
  }

  // Gradiente fixo da viewport (igual à base original: azul no topo,
  // lilás à direita, pêssego no canto inferior direito)
  const gradienteClaro =
    "radial-gradient(60% 46% at 104% 60%, rgba(163, 138, 208, 0.92) 0%, rgba(163, 138, 208, 0) 100%), " +
    "radial-gradient(52% 42% at 104% 105%, rgba(232, 172, 110, 1) 0%, rgba(232, 172, 110, 0) 100%), " +
    "radial-gradient(85% 45% at 30% -10%, rgba(72, 110, 160, 0.5) 0%, rgba(72, 110, 160, 0) 100%), " +
    "linear-gradient(180deg, #8fadcf 0%, #93aed2 24%, #c2d0e2 40%, #ecf0f4 56%, #f3f0ea 76%, #f4ede1 100%)";
  const gradienteEscuro =
    "radial-gradient(60% 46% at 104% 60%, rgba(88, 68, 150, 0.55) 0%, rgba(88, 68, 150, 0) 100%), " +
    "radial-gradient(46% 34% at 102% 102%, rgba(180, 110, 40, 0.4) 0%, rgba(180, 110, 40, 0) 100%), " +
    "linear-gradient(180deg, #0b1220 0%, #171233 55%, #2b1608 100%)";

  return (
    <div className="relative min-h-dvh">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 dark:hidden"
        style={{ background: gradienteClaro }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 hidden dark:block"
        style={{ background: gradienteEscuro }}
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col shadow-2xl shadow-slate-900/20">
        {telaLogin ? (
          <TelaLogin
            onFechar={() => setTelaLogin(false)}
            onEntrar={entrar}
          />
        ) : (
          <>
            {/* Cabeçalho */}
            <header className="sticky top-0 z-40 border-b border-white/30 bg-white/15 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/40">
              <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
                    {/* Logo original do Senac */}
                    <img
                      src="/senac-logo.png"
                      alt="Logo Senac"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="truncate text-lg font-bold leading-tight text-[#24508e] dark:text-blue-200">
                    ConectaTI{" "}
                    <span className="text-[#e69532] dark:text-orange-400">Senac</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <AlternarTema />
                  {auth ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Sair da conta"
                      onClick={sair}
                      className="text-slate-700 hover:bg-white/50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <LogOut className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirLogin("inicio")}
                      className="rounded-lg px-2 py-1.5 text-[15px] font-semibold text-[#2f5996] transition hover:bg-white/50 dark:text-blue-300 dark:hover:bg-white/10"
                    >
                      Entrar
                    </button>
                  )}
                </div>
              </div>

              {/* Perfil fixo: apenas Suporte TI (sem módulo de perfis de acesso) */}
              {auth && (
                <div className="px-4 pb-3">
                  <p className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Conectado: <span className="font-semibold">{auth.nome}</span>{" "}
                    · Suporte TI · Senac {auth.unidade} · {auth.metodo}
                  </p>
                </div>
              )}
            </header>

            {/* Conteúdo */}
            <main className="flex-1 px-5 pb-28 pt-4">
              {erro && (
                <Card className="mb-4 border-red-200 bg-white/95 shadow-none dark:border-red-500/30 dark:bg-slate-900/95">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      <AlertTriangle
                        className="h-4 w-4 text-red-500"
                        aria-hidden="true"
                      />
                      Falha ao carregar os dados
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={carregar}
                      className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                    >
                      Tentar novamente
                    </Button>
                  </CardContent>
                </Card>
              )}

              {aba === "inicio" && (
                <TelaInicio
                  chamados={chamados}
                  equipamentos={equipamentos}
                  carregando={carregando}
                  logado={!!auth}
                  unidade={auth?.unidade}
                  onLogin={() => abrirLogin("inicio")}
                  onSair={sair}
                  onDashboard={() =>
                    auth
                      ? setAba("indicadores")
                      : abrirLogin("indicadores")
                  }
                  onNavegar={clicarAba}
                />
              )}
              {aba === "chamados" && (
                <AbaChamados
                  chamados={chamados}
                  carregando={carregando}
                  logado={!!auth}
                  nome={auth?.nome ?? ""}
                  atualizar={atualizarChamado}
                  criar={criarChamado}
                />
              )}
              {aba === "equipamentos" && (
                <AbaEquipamentos
                  equipamentos={equipamentos}
                  carregando={carregando}
                  logado={!!auth}
                  nome={auth?.nome ?? ""}
                  atualizar={atualizarEquipamento}
                />
              )}
              {aba === "indicadores" && (
                <AbaIndicadores
                  chamados={chamados}
                  equipamentos={equipamentos}
                  carregando={carregando}
                />
              )}
            </main>

            {/* Barra de abas — sempre visível, inclusive no início */}
            <nav
              className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-slate-300/60 bg-white/75 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-slate-950/75"
              aria-label="Navegação principal"
            >
              <ul className="grid grid-cols-4">
                {ABAS.map((a) => {
                  const ativo = aba === a.id;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => clicarAba(a.id)}
                        aria-current={ativo ? "page" : undefined}
                        className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                          ativo
                            ? "font-semibold text-blue-700 dark:text-blue-300"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        }`}
                      >
                        <a.icone className="h-5 w-5" aria-hidden="true" />
                        {a.rotulo}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Chatbot de IA Conecta Robot */}
            <ConectaRobot />
          </>
        )}
      </div>
    </div>
  );
}
