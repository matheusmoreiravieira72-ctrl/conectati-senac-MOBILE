"use client";

import { useMemo } from "react";
import { Loader2, Percent, Laptop, Paperclip, Ticket } from "lucide-react";
import {
  corStatusChamado,
  type Chamado,
  type Equipamento,
} from "@/lib/conectati";

interface PropsIndicadores {
  chamados: Chamado[];
  equipamentos: Equipamento[];
  carregando: boolean;
}

const SATISFACAO = 96;

export function AbaIndicadores({
  chamados,
  equipamentos,
  carregando,
}: PropsIndicadores) {
  const abertos = chamados.filter((c) => c.status === "Aberto").length;
  const disponiveis = equipamentos.filter((e) => e.status === "Disponível").length;
  const reservados = equipamentos.filter((e) => e.status === "Reservado").length;
  const manutencao = equipamentos.filter((e) => e.status === "Manutenção").length;

  const resolvidos = chamados.filter((c) => c.status === "Resolvido");
  const comEvidencia = resolvidos.filter((c) => c.evidenciaNome).length;
  const pctEvidencia = resolvidos.length
    ? Math.round((comEvidencia / resolvidos.length) * 100)
    : 0;

  const porStatus = useMemo(
    () => [
      { rotulo: "Abertos", valor: abertos, cor: "bg-blue-500" },
      {
        rotulo: "Em atendimento",
        valor: chamados.filter((c) => c.status === "Em atendimento").length,
        cor: "bg-orange-500",
      },
      {
        rotulo: "Resolvidos",
        valor: chamados.filter((c) => c.status === "Resolvido").length,
        cor: "bg-emerald-500",
      },
    ],
    [abertos, chamados],
  );

  const porTipo = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const c of chamados) {
      mapa.set(c.tipo, (mapa.get(c.tipo) ?? 0) + 1);
    }
    const total = chamados.length || 1;
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tipo, valor]) => ({
        tipo,
        valor,
        pct: Math.round((valor / total) * 100),
      }));
  }, [chamados]);

  const cartoes = [
    {
      valor: String(abertos),
      rotulo: "Chamados abertos",
      icone: Ticket,
      cor: "text-blue-700 dark:text-blue-300",
    },
    {
      valor: String(disponiveis),
      rotulo: "Notebooks disponíveis",
      icone: Laptop,
      cor: "text-blue-700 dark:text-blue-300",
    },
    {
      valor: `${SATISFACAO}%`,
      rotulo: "satisfação",
      icone: Percent,
      cor: "text-blue-700 dark:text-blue-300",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Indicadores</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Visão geral para coordenação e gestão
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {cartoes.map((c) => (
          <div
            key={c.rotulo}
            className="rounded-2xl border border-white/70 bg-white p-3 text-center shadow-lg shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900"
          >
            {carregando ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <p className={`text-2xl font-extrabold leading-none ${c.cor}`}>
                {c.valor}
              </p>
            )}
            <p className="mt-1.5 text-[11px] font-medium leading-tight text-slate-500 dark:text-slate-400">
              {c.rotulo}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/70 bg-white p-4 shadow-lg shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Chamados por status
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          {porStatus.map((s) => {
            const pct = chamados.length
              ? Math.round((s.valor / chamados.length) * 100)
              : 0;
            return (
              <div key={s.rotulo}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${corStatusChamado(s.rotulo === "Abertos" ? "Aberto" : s.rotulo === "Resolvidos" ? "Resolvido" : "Em atendimento")}`}
                      aria-hidden="true"
                    />
                    {s.rotulo}
                  </span>
                  <span className="font-semibold">{s.valor}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-2 rounded-full ${s.cor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white p-4 shadow-lg shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Chamados por tipo
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          {porTipo.map((t) => (
            <div key={t.tipo}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>{t.tipo}</span>
                <span className="font-semibold">{t.valor}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${Math.max(t.pct, 6)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white p-4 shadow-lg shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Evidências de atendimento
        </h3>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Paperclip className="h-3 w-3" aria-hidden="true" />
              Fechados com anexo
            </span>
            <span className="font-semibold">
              {comEvidencia}/{resolvidos.length} · {pctEvidencia}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{ width: `${pctEvidencia}%` }}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Todo fechamento exige uma evidência anexada (imagem ou documento)
          como prova do atendimento.
        </p>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white p-4 shadow-lg shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Equipamentos
        </h3>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
          {reservados} reservados no momento · {manutencao} em manutenção ·{" "}
          {equipamentos.length} no total do acervo.
        </p>
      </section>
    </div>
  );
}
