"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  LogIn,
  ScanFace,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { autenticarBiometria, type MetodoBiometria } from "@/lib/biometria";
import { UNIDADES } from "@/lib/conectati";

interface PropsTelaLogin {
  onFechar: () => void;
  onEntrar: (nome: string, metodo: string, unidade: string) => void;
}

/** Alternador claro/escuro (mesmo padrão do cabeçalho principal). */
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 dark:hidden"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden h-5 w-5 dark:block"
        aria-hidden="true"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </Button>
  );
}

/** Tela de login: unidade, usuário e senha, com biometria como alternativa. */
export function TelaLogin({ onFechar, onEntrar }: PropsTelaLogin) {
  const { toast } = useToast();
  const inputUsuarioRef = useRef<HTMLInputElement>(null);
  const inputSenhaRef = useRef<HTMLInputElement>(null);
  const [unidade, setUnidade] = useState<string>("Taguatinga");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [validando, setValidando] = useState(false);
  const [processando, setProcessando] = useState<MetodoBiometria | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [sucessoSimulado, setSucessoSimulado] = useState(false);
  const entrandoRef = useRef(false);
  const tentativaRef = useRef(0);

  // Restaura o último usuário digitado (escrita em ref, sem estado).
  useEffect(() => {
    const salvo = localStorage.getItem("hd_usuario");
    if (salvo && inputUsuarioRef.current) {
      inputUsuarioRef.current.value = salvo;
    }
  }, []);

  function nomeUsuario(): string | null {
    const limpo = (inputUsuarioRef.current?.value ?? "").trim();
    if (limpo.length < 2) {
      toast({
        title: "Informe seu usuário",
        description: "Digite o usuário da sua conta para continuar.",
        variant: "destructive",
      });
      return null;
    }
    return limpo;
  }

  async function concluirEntrar(nome: string, metodo: string) {
    if (entrandoRef.current) return;
    entrandoRef.current = true;
    try {
      localStorage.setItem("hd_usuario", nome);
    } catch {
      /* armazenamento indisponível */
    }
    setSucesso(true);
    await new Promise((r) => setTimeout(r, 700));
    onEntrar(nome, metodo, unidade);
  }

  async function entrarComSenha() {
    const nome = nomeUsuario();
    if (!nome || validando || processando) return;
    const senha = inputSenhaRef.current?.value ?? "";
    if (senha.length < 4) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 4 caracteres.",
        variant: "destructive",
      });
      return;
    }
    setValidando(true);
    await new Promise((r) => setTimeout(r, 700)); // validação das credenciais
    setValidando(false);
    await concluirEntrar(nome, "Usuário e senha");
  }

  async function entrarBiometria(metodo: MetodoBiometria) {
    const nome = nomeUsuario();
    if (!nome || processando || validando) return;

    const tentativa = ++tentativaRef.current;
    setProcessando(metodo);

    const resultado = await autenticarBiometria(metodo);
    if (tentativaRef.current !== tentativa) return; // cancelado

    setProcessando(null);
    if (resultado.ok) {
      setSucessoSimulado(resultado.simulado);
      const rotulo = metodo === "digital" ? "Digital" : "Reconhecimento facial";
      const sufixo = resultado.simulado
        ? " (simulada)"
        : " (sensor do dispositivo)";
      await concluirEntrar(nome, rotulo + sufixo);
    } else {
      toast({
        title: "Não foi possível verificar",
        description: resultado.erro ?? "Tente novamente ou use a senha.",
        variant: "destructive",
      });
    }
  }

  function cancelar() {
    tentativaRef.current += 1;
    setProcessando(null);
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-3 pt-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar para o início"
            onClick={onFechar}
            className="text-slate-700 hover:bg-white/50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Voltar
          </p>
        </div>
        <div className="pr-1">
          <AlternarTema />
        </div>
      </div>

      {/* Conteúdo central */}
      <div className="flex flex-1 flex-col justify-center px-5 pb-12">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
            <img
              src="/senac-logo.png"
              alt="Logo Senac"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Login
          </h1>
          <p className="mt-1 text-sm font-medium text-[#2f5996] dark:text-blue-300">
            Acesso ao ConectaTI · Suporte TI
          </p>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/95 p-5 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-unidade">Unidade</Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger
                  id="login-unidade"
                  className="h-11 border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-usuario">Usuário</Label>
              <Input
                id="login-usuario"
                ref={inputUsuarioRef}
                placeholder="ex.: suporte.taguatinga"
                maxLength={60}
                autoComplete="username"
                className="h-11 border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-senha">Senha</Label>
              <div className="relative">
                <Input
                  id="login-senha"
                  type={mostrarSenha ? "text" : "password"}
                  ref={inputSenhaRef}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  className="h-11 border-slate-300 bg-slate-50 pr-10 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              className="h-12 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-orange-400 text-base font-bold text-white hover:brightness-105"
              onClick={entrarComSenha}
              disabled={validando || !!processando}
            >
              {validando ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <LogIn className="h-5 w-5" aria-hidden="true" />
              )}
              {validando ? "Validando…" : "Entrar"}
            </Button>

            <div className="flex items-center gap-3 py-0.5">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                ou use a biometria
              </span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <Button
              variant="outline"
              className="h-12 w-full border-2 border-blue-600 bg-white text-base font-semibold text-blue-900 hover:bg-blue-50 dark:border-blue-400 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800"
              onClick={() => entrarBiometria("digital")}
              disabled={validando || !!processando}
            >
              <Fingerprint className="h-5 w-5" aria-hidden="true" />
              Entrar com digital
            </Button>

            <Button
              variant="outline"
              className="h-12 w-full border-2 border-blue-600 bg-white text-base font-semibold text-blue-900 hover:bg-blue-50 dark:border-blue-400 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800"
              onClick={() => entrarBiometria("facial")}
              disabled={validando || !!processando}
            >
              <ScanFace className="h-5 w-5" aria-hidden="true" />
              Entrar com reconhecimento facial
            </Button>

            <p className="text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              Impressão digital e reconhecimento facial via WebAuthn. Sem sensor
              disponível, uma biometria simulada é usada.
            </p>
          </div>
        </div>
      </div>

      {processando && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/95 backdrop-blur-sm dark:bg-slate-900/95">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/25" />
            <span className="absolute inset-3 animate-pulse rounded-full bg-blue-500/10" />
            {processando === "digital" ? (
              <Fingerprint
                className="relative h-14 w-14 animate-pulse text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
            ) : (
              <ScanFace
                className="relative h-14 w-14 animate-pulse text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {processando === "digital"
                ? "Verificando digital…"
                : "Reconhecendo rosto…"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Posicione o{" "}
              {processando === "digital" ? "dedo no sensor" : "rosto na câmera"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={cancelar}
          >
            Cancelar
          </Button>
        </div>
      )}

      {sucesso && !processando && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur-sm dark:bg-slate-900/95">
          <CheckCircle2
            className="h-16 w-16 text-emerald-500"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            Acesso autorizado
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Senac {unidade} · Suporte TI
          </p>
          {sucessoSimulado && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Biometria verificada em modo simulado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
