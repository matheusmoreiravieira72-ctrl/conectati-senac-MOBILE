"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Star, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { UNIDADES } from "@/lib/conectati";

const ROTULOS_NOTA = [
  "Muito ruim",
  "Ruim",
  "Razoável",
  "Bom",
  "Excelente",
] as const;

/** Página aberta pelo QR Code: avaliação do atendimento do Suporte TI. */
export default function PaginaAvaliacao() {
  const router = useRouter();
  const [nota, setNota] = useState(0);
  const [unidade, setUnidade] = useState<string>("Taguatinga");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const comentarioRef = useRef<HTMLTextAreaElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);

  const gradiente =
    "radial-gradient(60% 46% at 104% 60%, rgba(163, 138, 208, 0.92) 0%, rgba(163, 138, 208, 0) 100%), " +
    "radial-gradient(52% 42% at 104% 105%, rgba(232, 172, 110, 1) 0%, rgba(232, 172, 110, 0) 100%), " +
    "radial-gradient(85% 45% at 30% -10%, rgba(72, 110, 160, 0.5) 0%, rgba(72, 110, 160, 0) 100%), " +
    "linear-gradient(180deg, #8fadcf 0%, #93aed2 24%, #c2d0e2 40%, #ecf0f4 56%, #f3f0ea 76%, #f4ede1 100%)";

  async function enviarAvaliacao() {
    if (nota < 1 || enviando) return;
    setEnviando(true);
    try {
      const resposta = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota,
          comentario: comentarioRef.current?.value ?? "",
          unidade,
          nome: nomeRef.current?.value ?? "",
        }),
      });
      if (resposta.ok) setEnviada(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative min-h-dvh" style={{ background: gradiente }}>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-8">
        {/* Botão X — sai da avaliação e volta ao sistema */}
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Sair da avaliação"
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-md backdrop-blur transition hover:bg-white hover:text-slate-800 active:scale-95 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex flex-1 flex-col justify-center">
          {!enviada ? (
            <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1 shadow">
                  <img
                    src="/senac-logo.png"
                    alt="Logo Senac"
                    className="h-full w-full object-contain"
                  />
                </div>
                <h1 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
                  Avalie o atendimento
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Sua opinião ajuda o Suporte TI a melhorar.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <button
                        key={estrela}
                        type="button"
                        onClick={() => setNota(estrela)}
                        aria-label={`${estrela} estrela${estrela > 1 ? "s" : ""}`}
                        className="p-1 transition active:scale-90"
                      >
                        <Star
                          className={`h-9 w-9 transition-colors ${
                            estrela <= nota
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-[#2f5996] dark:text-blue-300">
                    {nota >= 1 ? ROTULOS_NOTA[nota - 1] : "Toque nas estrelas"}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="avaliacao-unidade">Unidade</Label>
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger
                      id="avaliacao-unidade"
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
                  <Label htmlFor="avaliacao-nome">Seu nome (opcional)</Label>
                  <Input
                    id="avaliacao-nome"
                    ref={nomeRef}
                    placeholder="ex.: Prof. Maria Silva"
                    maxLength={60}
                    className="h-11 border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="avaliacao-comentario">Comentário (opcional)</Label>
                  <Textarea
                    id="avaliacao-comentario"
                    ref={comentarioRef}
                    placeholder="Como foi o atendimento do Suporte TI?"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <Button
                  className="h-12 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-orange-400 text-base font-bold text-white hover:brightness-105"
                  onClick={enviarAvaliacao}
                  disabled={nota < 1 || enviando}
                >
                  {enviando ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Star className="h-5 w-5" aria-hidden="true" />
                  )}
                  Enviar avaliação
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/60 bg-white/95 p-8 text-center shadow-xl shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
              <CheckCircle2
                className="h-16 w-16 text-emerald-500"
                aria-hidden="true"
              />
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Obrigado pela avaliação!
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Sua nota de {nota} estrela{nota > 1 ? "s" : ""} foi registrada
                  para a unidade Senac {unidade}.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setEnviada(false);
                  setNota(0);
                }}
                className="h-11 border-2 border-blue-600 bg-white text-blue-900 hover:bg-blue-50 dark:border-blue-400 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800"
              >
                Avaliar novamente
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
