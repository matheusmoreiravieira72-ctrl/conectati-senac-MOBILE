"use client";

import { useMemo, useState } from "react";
import { Loader2, Lock, Wrench, Search, Laptop } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  classeStatusEquipamento,
  type Equipamento,
  type StatusEquipamento,
} from "@/lib/conectati";

type Filtro = "Todos" | StatusEquipamento;

interface PropsEquipamentos {
  equipamentos: Equipamento[];
  carregando: boolean;
  logado: boolean;
  nome: string;
  atualizar: (
    id: string,
    dados: { status: string; reservadoPor?: string | null },
  ) => Promise<boolean>;
}

export function AbaEquipamentos({
  equipamentos,
  carregando,
  logado,
  nome,
  atualizar,
}: PropsEquipamentos) {
  const { toast } = useToast();
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [busca, setBusca] = useState("");
  const [processando, setProcessando] = useState<string | null>(null);

  const contagem = useMemo(
    () => ({
      Todos: equipamentos.length,
      "Disponível": equipamentos.filter((e) => e.status === "Disponível").length,
      "Reservado": equipamentos.filter((e) => e.status === "Reservado").length,
      "Manutenção": equipamentos.filter((e) => e.status === "Manutenção").length,
    }) as Record<Filtro, number>,
    [equipamentos],
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return equipamentos.filter((e) => {
      const combinaFiltro = filtro === "Todos" || e.status === filtro;
      const combinaBusca =
        !termo ||
        e.patrimonio.toLowerCase().includes(termo) ||
        e.modelo.toLowerCase().includes(termo) ||
        (e.reservadoPor ?? "").toLowerCase().includes(termo);
      return combinaFiltro && combinaBusca;
    });
  }, [equipamentos, filtro, busca]);

  async function acao(
    equipamento: Equipamento,
    status: string,
    reservadoPor: string | null,
    mensagem: string,
  ) {
    if (processando) return;
    setProcessando(equipamento.id + status);
    const ok = await atualizar(equipamento.id, { status, reservadoPor });
    setProcessando(null);
    if (ok) {
      toast({
        title: mensagem,
        description: `${equipamento.patrimonio} · ${equipamento.modelo}`,
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Equipamentos</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {contagem["Disponível"]} notebooks disponíveis para reserva
        </p>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          aria-hidden="true"
        />
        <Input
          placeholder="Buscar por patrimônio ou modelo…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border-slate-300/70 bg-white/90 pl-9 text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500"
          aria-label="Buscar equipamentos"
        />
      </div>

      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
        role="group"
        aria-label="Filtrar por status do equipamento"
      >
        {(["Todos", "Disponível", "Reservado", "Manutenção"] as Filtro[]).map(
          (f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              aria-pressed={filtro === f}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                filtro === f
                  ? "border-blue-600 bg-blue-600 font-semibold text-white dark:border-blue-500 dark:bg-blue-600"
                  : "border-slate-300/70 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              {f} ({contagem[f]})
            </button>
          ),
        )}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300/60 bg-white/60 py-10 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando equipamentos…
        </div>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-500/40 py-10 text-center dark:border-white/20">
          <Laptop className="h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Nenhum equipamento encontrado{busca ? " para essa busca" : ""}.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border border-white/70 bg-white p-4 shadow-lg shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
                  {e.patrimonio}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[11px] ${classeStatusEquipamento(e.status)}`}
                >
                  {e.status}
                </Badge>
              </div>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {e.modelo}
              </p>
              {e.reservadoPor && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Reservado por {e.reservadoPor}
                </p>
              )}

              {logado && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {e.status === "Disponível" && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 via-blue-500 to-orange-400 font-bold text-white hover:brightness-105"
                      disabled={processando !== null}
                      onClick={() =>
                        acao(e, "Reservado", nome, "Notebook reservado!")
                      }
                      aria-label={`Reservar ${e.patrimonio}`}
                    >
                      {processando === e.id + "Reservado" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Laptop className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Reservar
                    </Button>
                  )}

                  {e.status === "Reservado" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                      disabled={processando !== null}
                      onClick={() => acao(e, "Disponível", null, "Reserva liberada!")}
                      aria-label={`Liberar ${e.patrimonio}`}
                    >
                      {processando === e.id + "Disponível" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Liberar
                    </Button>
                  )}

                  {e.status === "Disponível" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                      disabled={processando !== null}
                      onClick={() =>
                        acao(e, "Manutenção", null, "Equipamento em manutenção.")
                      }
                      aria-label={`Enviar ${e.patrimonio} para manutenção`}
                    >
                      <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                      Manutenção
                    </Button>
                  )}

                  {e.status === "Manutenção" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                      disabled={processando !== null}
                      onClick={() =>
                        acao(e, "Disponível", null, "Manutenção concluída!")
                      }
                      aria-label={`Concluir manutenção de ${e.patrimonio}`}
                    >
                      <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                      Concluir manutenção
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
