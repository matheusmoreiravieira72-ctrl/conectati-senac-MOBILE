"use client";

import { BarChart3, Laptop, Ticket } from "lucide-react";
import {
  corStatusChamado,
  numeroFormatado,
  type Chamado,
  type Equipamento,
} from "@/lib/conectati";

const SATISFACAO = 96;

interface PropsInicio {
  chamados: Chamado[];
  equipamentos: Equipamento[];
  carregando: boolean;
  logado: boolean;
  unidade?: string;
  onLogin: () => void;
  onSair: () => void;
  onDashboard: () => void;
  onNavegar: (destino: "chamados" | "equipamentos" | "indicadores") => void;
}

/** Tela inicial original: gradiente pastel, cards flutuantes e módulos. */
export function TelaInicio({
  chamados,
  equipamentos,
  carregando,
  logado,
  unidade,
  onLogin,
  onSair,
  onDashboard,
  onNavegar,
}: PropsInicio) {
  const previews = [3, 1, 2]
    .map((numero) => chamados.find((c) => c.numero === numero))
    .filter((c): c is Chamado => Boolean(c));

  const abertos = chamados.filter((c) => c.status === "Aberto").length;
  const disponiveis = equipamentos.filter((e) => e.status === "Disponível").length;

  const estatisticas = [
    { valor: abertos, rotulo: "Chamados abertos" },
    { valor: disponiveis, rotulo: "Notebooks disponíveis" },
    { valor: SATISFACAO, rotulo: "% satisfação" },
  ];

  const modulos = [
    {
      titulo: "Chamados",
      descricao:
        "Abra e acompanhe solicitações de suporte técnico com histórico completo.",
      icone: Ticket,
      destino: "chamados" as const,
    },
    {
      titulo: "Equipamentos",
      descricao:
        "Reserve notebooks e controle o patrimônio de TI em tempo real.",
      icone: Laptop,
      destino: "equipamentos" as const,
    },
    {
      titulo: "Indicadores",
      descricao:
        "Dashboards visuais para coordenação e administração acompanharem tudo.",
      icone: BarChart3,
      destino: "indicadores" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-6 pt-3">
      {/* Cards flutuantes (no topo, como na base original) */}
      <section
        aria-label="Chamados em destaque"
        className="flex flex-col px-2 pt-3"
      >
        {carregando ? (
          <div className="mx-auto flex h-16 w-64 items-center justify-center rounded-2xl border border-white/60 bg-white/60 text-sm text-slate-500 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
            Carregando chamados…
          </div>
        ) : (
          previews.map((c, indice) => (
            <div
              key={c.id}
              className={`w-fit max-w-[85%] rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 ${
                indice === 0
                  ? "self-start mb-[78px]"
                  : indice === 1
                    ? "self-end translate-x-[10px] mb-3"
                    : "self-start translate-x-8"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${corStatusChamado(c.status)}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {numeroFormatado(c.numero)} · {c.status}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {c.tipo} · {c.local}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Hero */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-slate-400/40 bg-white/50 px-4 py-1.5 text-xs font-medium text-slate-700 backdrop-blur dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
          Senac {unidade ?? "Taguatinga"} · Plataforma Interna
        </span>
        <h1 className="whitespace-nowrap text-[2.5rem] font-extrabold leading-none tracking-tighter">
          <span className="bg-gradient-to-r from-[#2e63b4] via-[#5b8496] to-[#c08b3f] bg-clip-text text-transparent">
            Conecta
          </span>
          <span className="text-[#3a393c] dark:text-slate-100">TI Senac</span>
        </h1>
        <p className="max-w-[22rem] text-[15px] font-semibold leading-snug text-[#2f5996] dark:text-blue-300">
          Sistema de Chamados, Suporte Técnico e Gestão de Equipamentos
        </p>
        <p className="max-w-[20.5rem] text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Conectando o Suporte TI, a coordenação e a administração em uma
          única plataforma inteligente.
        </p>
      </div>

      {/* Ações */}
      <div className="-mx-1 flex flex-col gap-3">
        {logado ? (
          <button
            type="button"
            onClick={onSair}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#3b6cb4] bg-white/95 text-base font-semibold text-[#2f5996] shadow transition hover:bg-blue-50 dark:border-blue-400 dark:bg-slate-900/90 dark:text-blue-200 dark:hover:bg-slate-800"
          >
            Sair da conta
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2e70c0] to-[#c9913f] text-base font-bold text-white shadow-lg shadow-blue-900/20 transition hover:brightness-105"
          >
            Login
          </button>
        )}
        <button
          type="button"
          onClick={onDashboard}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#3b6cb4] bg-white/95 text-base font-semibold text-[#2f5996] shadow transition hover:bg-blue-50 dark:border-blue-400 dark:bg-slate-900/90 dark:text-blue-200 dark:hover:bg-slate-800"
        >
          Ver dashboard
        </button>
      </div>

      {/* Estatísticas (como no painel original) */}
      <section aria-label="Estatísticas" className="-mx-2.5 pt-2">
        <div className="grid grid-cols-3 gap-2 text-center">
          {estatisticas.map((s) => (
            <div key={s.rotulo}>
              {carregando ? (
                <div className="mx-auto h-8 w-12 animate-pulse rounded bg-white/60 dark:bg-slate-800" />
              ) : (
                <p className="text-3xl font-extrabold text-[#3265b2] dark:text-blue-300">
                  {s.valor}
                </p>
              )}
              <p className="mx-auto mt-1 max-w-[7rem] text-[13px] font-medium leading-tight text-slate-600 dark:text-slate-300">
                {s.rotulo}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Módulos (cards originais) */}
      <section
        aria-label="Módulos do sistema"
        className="-mx-2.5 flex flex-col gap-3"
      >
        {modulos.map((m) => (
          <button
            key={m.titulo}
            type="button"
            onClick={() => onNavegar(m.destino)}
            className="rounded-2xl border border-white/60 bg-white/80 p-5 text-left shadow-lg shadow-slate-900/10 backdrop-blur-sm transition hover:shadow-xl dark:border-white/10 dark:bg-slate-900/85"
          >
            <p className="text-base font-semibold text-[#3565ae] dark:text-blue-300">
              {m.titulo}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {m.descricao}
            </p>
          </button>
        ))}
      </section>

      {/* QR Code — Avaliação do atendimento */}
      <section aria-label="Avalie o atendimento" className="-mx-2.5">
        <div className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-lg shadow-slate-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/85">
          <img
            src="/qr-avaliacao.png"
            alt="QR Code para abrir a avaliação do atendimento"
            className="h-20 w-20 shrink-0 rounded-xl bg-white p-1 shadow"
          />
          <div className="min-w-0">
            <p className="text-base font-semibold text-[#3565ae] dark:text-blue-300">
              Avalie o atendimento
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Escaneie o QR Code e dê sua nota de 1 a 5 estrelas ao Suporte TI.
            </p>
            <a
              href="/avaliacao"
              className="mt-1.5 inline-block text-sm font-semibold text-blue-700 underline-offset-2 hover:underline dark:text-blue-300"
            >
              Abrir formulário de avaliação
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
