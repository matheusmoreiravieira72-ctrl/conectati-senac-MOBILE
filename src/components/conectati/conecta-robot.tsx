"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, SendHorizonal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Mensagem {
  papel: "usuario" | "robot";
  texto: string;
}

const BOAS_VINDAS: Mensagem = {
  papel: "robot",
  texto:
    "Olá! Sou o Conecta Robot, o assistente de IA do ConectaTI. Posso ajudar com chamados, equipamentos, avaliações e dúvidas do sistema. Como posso ajudar?",
};

/** Chatbot de IA "Conecta Robot": botão flutuante + painel de conversa. */
export function ConectaRobot() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([BOAS_VINDAS]);
  const [digitando, setDigitando] = useState(false);
  const [texto, setTexto] = useState("");
  const fimRef = useRef<HTMLDivElement>(null);
  const enviandoRef = useRef(false);

  // Rola para a última mensagem (manipulação de DOM, sem estado).
  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aberto, mensagens, digitando]);

  async function enviar() {
    const envio = texto.trim();
    if (!envio || digitando || enviandoRef.current) return;

    enviandoRef.current = true;
    const historico = [...mensagens, { papel: "usuario" as const, texto: envio }];
    setMensagens(historico);
    setTexto("");
    setDigitando(true);

    try {
      const resposta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagens: historico
            .filter((m) => m !== BOAS_VINDAS)
            .map((m) => ({ papel: m.papel, texto: m.texto })),
        }),
      });
      const corpo = (await resposta.json()) as { resposta?: string; erro?: string };
      setMensagens((atuais) => [
        ...atuais,
        {
          papel: "robot",
          texto:
            corpo.resposta ??
            corpo.erro ??
            "Não consegui responder agora. Tente novamente.",
        },
      ]);
    } catch {
      setMensagens((atuais) => [
        ...atuais,
        {
          papel: "robot",
          texto: "Sem conexão com o Conecta Robot. Verifique a internet.",
        },
      ]);
    } finally {
      setDigitando(false);
      enviandoRef.current = false;
    }
  }

  return (
    <>
      {/* Botão flutuante (acima da barra de abas) */}
      {!aberto && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir chat com o Conecta Robot"
          className="fixed bottom-[76px] left-1/2 z-40 flex h-14 w-14 translate-x-[calc(14rem-4.5rem)] items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-orange-400 text-white shadow-xl shadow-blue-900/30 transition hover:brightness-110 active:scale-95"
        >
          <Bot className="h-7 w-7" aria-hidden="true" />
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-950" />
        </button>
      )}

      {/* Painel de conversa */}
      {aberto && (
        <div className="fixed bottom-0 left-1/2 z-50 flex h-[70dvh] w-full max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-t-3xl border border-white/60 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">
          {/* Cabeçalho do chat */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-400 px-4 py-3 text-white dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Conecta Robot</p>
                <p className="text-[11px] leading-tight text-blue-100">
                  Assistente virtual de IA · online
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar chat"
              onClick={() => setAberto(false)}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-950/60">
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.papel === "usuario" ? "justify-end" : "justify-start"}`}
              >
                {m.papel === "robot" && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-orange-400 text-white">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    m.papel === "usuario"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                  }`}
                >
                  {m.texto}
                </div>
              </div>
            ))}
            {digitando && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="ml-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-orange-400 text-white">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </div>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Conecta Robot digitando…
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {/* Entrada de mensagem */}
          <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-slate-900">
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              placeholder="Converse com o Conecta Robot…"
              maxLength={500}
              aria-label="Mensagem para o Conecta Robot"
              className="h-11 border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <Button
              size="icon"
              onClick={enviar}
              disabled={digitando || !texto.trim()}
              aria-label="Enviar mensagem"
              className="h-11 w-11 shrink-0 bg-gradient-to-r from-blue-600 to-orange-400 text-white hover:brightness-110"
            >
              <SendHorizonal className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
