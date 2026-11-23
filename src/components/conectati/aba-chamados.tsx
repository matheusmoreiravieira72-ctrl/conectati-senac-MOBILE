"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  ImagePlus,
  Loader2,
  Pencil,
  Paperclip,
  Play,
  Plus,
  RotateCcw,
  Search,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import {
  EVIDENCIA_ACEITA,
  EVIDENCIA_LIMITE_BYTES,
  EVIDENCIA_ROTULO_FORMATOS,
  LOCAIS,
  PRIORIDADES,
  TIPOS,
  classePrioridade,
  classeStatusChamado,
  corStatusChamado,
  formatoEvidenciaValido,
  formatarData,
  numeroFormatado,
  tamanhoLegivel,
  type Chamado,
  type Evidencia,
  type StatusChamado,
} from "@/lib/conectati";

type Filtro = "Todos" | StatusChamado;

interface DadosForm {
  tipo: string;
  local: string;
  prioridade: string;
  descricao: string;
  solicitante: string;
  evidencia?: Evidencia;
}

interface PropsChamados {
  chamados: Chamado[];
  carregando: boolean;
  logado: boolean;
  nome: string;
  atualizar: (
    id: string,
    dados: Partial<
      Pick<Chamado, "tipo" | "local" | "descricao" | "prioridade" | "status">
    > & { evidencia?: Evidencia },
  ) => Promise<boolean>;
  criar: (dados: {
    tipo: string;
    local: string;
    descricao: string;
    prioridade: string;
    solicitante: string;
    evidencia?: Evidencia;
  }) => Promise<boolean>;
}

export function AbaChamados({
  chamados,
  carregando,
  logado,
  nome,
  atualizar,
  criar,
}: PropsChamados) {
  const { toast } = useToast();
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [busca, setBusca] = useState("");

  const [novoAberto, setNovoAberto] = useState(false);
  const [editando, setEditando] = useState<Chamado | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [fechando, setFechando] = useState<Chamado | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState<string | null>(null);

  const contagem = useMemo(() => {
    return {
      Todos: chamados.length,
      Aberto: chamados.filter((c) => c.status === "Aberto").length,
      "Em atendimento": chamados.filter((c) => c.status === "Em atendimento")
        .length,
      Resolvido: chamados.filter((c) => c.status === "Resolvido").length,
    } as Record<Filtro, number>;
  }, [chamados]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return chamados.filter((c) => {
      const combinaFiltro = filtro === "Todos" || c.status === filtro;
      const combinaBusca =
        !termo ||
        c.tipo.toLowerCase().includes(termo) ||
        c.local.toLowerCase().includes(termo) ||
        c.descricao.toLowerCase().includes(termo) ||
        c.solicitante.toLowerCase().includes(termo) ||
        String(c.numero).includes(termo);
      return combinaFiltro && combinaBusca;
    });
  }, [chamados, filtro, busca]);

  async function acaoStatus(
    chamado: Chamado,
    status: StatusChamado,
    mensagem: string,
  ) {
    if (processandoAcao) return;
    setProcessandoAcao(chamado.id + status);
    const ok = await atualizar(chamado.id, { status });
    setProcessandoAcao(null);
    if (ok) {
      toast({
        title: mensagem,
        description: `${numeroFormatado(chamado.numero)} · ${chamado.tipo} · ${chamado.local}`,
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chamados</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {contagem.Todos} registros · histórico completo
          </p>
        </div>
        <Button
          className="h-9 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-400 font-bold text-white hover:brightness-105"
          onClick={() => setNovoAberto(true)}
          disabled={!logado}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo
        </Button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          aria-hidden="true"
        />
        <Input
          placeholder="Buscar por tipo, local, nº ou solicitante…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border-slate-300/70 bg-white/90 pl-9 text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500"
          aria-label="Buscar chamados"
        />
      </div>

      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
        role="group"
        aria-label="Filtrar por status"
      >
        {(["Todos", "Aberto", "Em atendimento", "Resolvido"] as Filtro[]).map(
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
          Carregando chamados…
        </div>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-500/40 py-10 text-center dark:border-white/20">
          <Search className="h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Nenhum chamado encontrado{busca ? " para essa busca" : ""}.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-white/70 bg-white p-4 shadow-lg shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {numeroFormatado(c.numero)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                  <span
                    className={`h-2 w-2 rounded-full ${corStatusChamado(c.status)}`}
                    aria-hidden="true"
                  />
                  {c.status}
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                {c.tipo} · {c.local}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                {c.descricao}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" aria-hidden="true" />
                  {c.solicitante}
                </span>
                <span>{formatarData(c.createdAt)}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${classePrioridade(c.prioridade)}`}
                >
                  {c.prioridade}
                </span>
              </div>

              {c.evidenciaNome && (
                <div className="mt-3">
                  <a
                    href={`/api/chamados/${c.id}/evidencia`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir evidência ${c.evidenciaNome} do chamado ${c.numero}`}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Paperclip className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="shrink-0">Evidência:</span>
                    <span className="min-w-0 truncate">{c.evidenciaNome}</span>
                  </a>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                  onClick={() => setEditando(c)}
                  disabled={!logado}
                  aria-label={`Editar chamado ${c.numero}`}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </Button>

                {logado && (
                  <>
                    {c.status === "Aberto" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                        disabled={processandoAcao !== null}
                        onClick={() =>
                          acaoStatus(c, "Em atendimento", "Atendimento iniciado!")
                        }
                        aria-label={`Iniciar atendimento do chamado ${c.numero}`}
                      >
                        {processandoAcao === c.id + "Em atendimento" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        Iniciar atendimento
                      </Button>
                    )}

                    {c.status !== "Resolvido" && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 via-blue-500 to-orange-400 font-bold text-white hover:brightness-105"
                        disabled={processandoAcao !== null}
                        onClick={() => setFechando(c)}
                        aria-label={`Fechar chamado ${c.numero}`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Fechar chamado
                      </Button>
                    )}

                    {c.status === "Resolvido" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 dark:text-slate-300"
                        disabled={processandoAcao !== null}
                        onClick={() => acaoStatus(c, "Aberto", "Chamado reaberto!")}
                        aria-label={`Reabrir chamado ${c.numero}`}
                      >
                        {processandoAcao === c.id + "Aberto" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        Reabrir
                      </Button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Diálogo: novo chamado (montado apenas quando aberto) */}
      {novoAberto && (
        <FormularioChamado
          titulo="Novo chamado"
          descricao="Descreva o problema com tipo e local para o suporte atender."
          solicitanteSugerido={nome}
          salvando={salvando}
          onFechar={() => setNovoAberto(false)}
          onSalvar={async (dados) => {
            setSalvando(true);
            const ok = await criar(dados);
            setSalvando(false);
            if (ok) {
              setNovoAberto(false);
              toast({
                title: "Chamado aberto!",
                description: dados.evidencia
                  ? `${dados.tipo} · ${dados.local} · anexo "${dados.evidencia.nome}" incluído.`
                  : `${dados.tipo} · ${dados.local}`,
              });
            }
          }}
        />
      )}

      {/* Diálogo: editar chamado existente */}
      {editando && (
        <FormularioChamado
          key={`editar-${editando.id}`}
          titulo={`Editar ${numeroFormatado(editando.numero)}`}
          descricao={`Aberto por ${editando.solicitante} · status: ${editando.status}`}
          solicitanteSugerido={editando.solicitante}
          fixarSolicitante
          salvando={salvando}
          evidenciaAtualNome={editando.evidenciaNome}
          inicial={{
            tipo: editando.tipo,
            local: editando.local,
            prioridade: editando.prioridade,
            descricao: editando.descricao,
          }}
          onFechar={() => setEditando(null)}
          onSalvar={async (dados) => {
            setSalvando(true);
            const ok = await atualizar(editando.id, {
              tipo: dados.tipo,
              local: dados.local,
              prioridade: dados.prioridade,
              descricao: dados.descricao,
              ...(dados.evidencia ? { evidencia: dados.evidencia } : {}),
            });
            setSalvando(false);
            if (ok) {
              toast({
                title: "Chamado atualizado!",
                description: dados.evidencia
                  ? `${numeroFormatado(editando.numero)} salvo · anexo "${dados.evidencia.nome}" atualizado.`
                  : `${numeroFormatado(editando.numero)} salvo com as novas informações.`,
              });
              setEditando(null);
            }
          }}
        />
      )}

      {/* Fechamento: exige anexo de evidência (imagem ou documento) */}
      {fechando && (
        <DialogoFecharChamado
          key={fechando.id}
          chamado={fechando}
          salvando={processandoAcao !== null}
          onFechar={() => setFechando(null)}
          onConfirmar={async (evidencia) => {
            const alvo = fechando;
            setProcessandoAcao(alvo.id + "Resolvido");
            const ok = await atualizar(alvo.id, {
              status: "Resolvido",
              evidencia,
            });
            setProcessandoAcao(null);
            if (ok) {
              setFechando(null);
              toast({
                title: "Chamado fechado como Resolvido!",
                description: `${numeroFormatado(alvo.numero)} · evidência "${evidencia.nome}" anexada.`,
              });
            }
          }}
        />
      )}
    </div>
  );
}

/* ---------- Formulário (novo + editar) ---------- */

interface PropsForm {
  titulo: string;
  descricao: string;
  solicitanteSugerido: string;
  salvando: boolean;
  inicial?: Pick<DadosForm, "tipo" | "local" | "prioridade" | "descricao">;
  fixarSolicitante?: boolean;
  evidenciaAtualNome?: string | null;
  onFechar: () => void;
  onSalvar: (dados: DadosForm) => void | Promise<void>;
}

function FormularioChamado({
  titulo,
  descricao,
  solicitanteSugerido,
  salvando,
  inicial,
  fixarSolicitante,
  evidenciaAtualNome,
  onFechar,
  onSalvar,
}: PropsForm) {
  const [tipo, setTipo] = useState(inicial?.tipo ?? "Notebook");
  const [local, setLocal] = useState(inicial?.local ?? "Lab 01");
  const [prioridade, setPrioridade] = useState(inicial?.prioridade ?? "Média");
  const [texto, setTexto] = useState(inicial?.descricao ?? "");
  const [solicitante, setSolicitante] = useState(
    fixarSolicitante ? solicitanteSugerido : solicitanteSugerido || "",
  );
  const [anexo, setAnexo] = useState<ArquivoEvidencia | null>(null);

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-tipo">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="form-tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-local">Local</Label>
              <Select value={local} onValueChange={setLocal}>
                <SelectTrigger id="form-local">
                  <SelectValue placeholder="Local" />
                </SelectTrigger>
                <SelectContent>
                  {LOCAIS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-prio">Prioridade</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger id="form-prio">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!fixarSolicitante && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-autor">Solicitante</Label>
              <Input
                id="form-autor"
                placeholder={solicitanteSugerido || "Seu nome"}
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                maxLength={60}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-desc">Descrição</Label>
            <Textarea
              id="form-desc"
              placeholder="O que aconteceu, desde quando e o que já foi tentado…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <span className="text-right text-xs text-slate-500">
              {texto.length}/1000
            </span>
          </div>

          <CampoEvidencia
            idInput="form-evidencia"
            rotulo="Anexo"
            obrigatoria={false}
            arquivo={anexo}
            onSelecionar={setAnexo}
            onRemover={() => setAnexo(null)}
            disabled={salvando}
          />

          {fixarSolicitante && evidenciaAtualNome && !anexo && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evidência atual do chamado:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {evidenciaAtualNome}
              </span>{" "}
              (mantida se você não anexar outro arquivo).
            </p>
          )}
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-orange-400 font-bold text-white hover:brightness-105"
            disabled={salvando}
            onClick={() =>
              onSalvar({
                tipo,
                local,
                prioridade,
                descricao: texto.trim(),
                solicitante: (fixarSolicitante
                  ? solicitanteSugerido
                  : solicitante.trim()) || solicitanteSugerido,
                evidencia: anexo
                  ? {
                      nome: anexo.nome,
                      tipo: anexo.tipo,
                      dados: anexo.dados,
                    }
                  : undefined,
              })
            }
          >
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Evidência: anexo obrigatório + diálogo de fechamento ---------- */

interface ArquivoEvidencia {
  nome: string;
  tipo: string;
  dados: string; // data URL base64
  tamanho: number;
}

/** Campo de anexo: imagem ou documento, com prévia, tamanho e remoção. */
function CampoEvidencia({
  idInput,
  arquivo,
  onSelecionar,
  onRemover,
  disabled,
  rotulo = "Evidência do atendimento",
  obrigatoria = true,
}: {
  idInput: string;
  arquivo: ArquivoEvidencia | null;
  onSelecionar: (arquivo: ArquivoEvidencia) => void;
  onRemover: () => void;
  disabled?: boolean;
  rotulo?: string;
  obrigatoria?: boolean;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [lendo, setLendo] = useState(false);

  function selecionar(evento: React.ChangeEvent<HTMLInputElement>) {
    const file = evento.target.files?.[0];
    evento.target.value = ""; // permite reselecionar o mesmo arquivo
    setErro(null);
    if (!file) return;

    if (file.size > EVIDENCIA_LIMITE_BYTES) {
      setErro(
        `Arquivo muito grande (${tamanhoLegivel(file.size)}). O limite é 5 MB.`,
      );
      return;
    }
    if (!formatoEvidenciaValido(file.type, file.name)) {
      setErro(
        "Formato não suportado. Use imagem, PDF, Word, Excel, PowerPoint, TXT ou CSV.",
      );
      return;
    }

    setLendo(true);
    const leitor = new FileReader();
    leitor.onload = () => {
      setLendo(false);
      onSelecionar({
        nome: file.name,
        tipo: file.type || "application/octet-stream",
        dados: String(leitor.result),
        tamanho: file.size,
      });
    };
    leitor.onerror = () => {
      setLendo(false);
      setErro("Não foi possível ler o arquivo. Tente novamente.");
    };
    leitor.readAsDataURL(file);
  }

  const previaImagem = arquivo?.tipo.startsWith("image/") ?? false;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={idInput}>
        {rotulo}
        {obrigatoria ? (
          <span className="text-red-500" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span
            className="ml-1.5 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
            aria-hidden="true"
          >
            opcional
          </span>
        )}
      </Label>

      {arquivo ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-slate-800">
          {previaImagem ? (
            <img
              src={arquivo.dados}
              alt={`Prévia da evidência ${arquivo.nome}`}
              className="h-11 w-11 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
              <FileText
                className="h-5 w-5 text-blue-600 dark:text-blue-300"
                aria-hidden="true"
              />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {arquivo.nome}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tamanhoLegivel(arquivo.tamanho)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setErro(null);
              onRemover();
            }}
            aria-label="Remover evidência"
            disabled={disabled}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={idInput}
          className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center transition hover:border-blue-500 hover:bg-blue-50/60 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-blue-400 dark:hover:bg-slate-800"
        >
          {lendo ? (
            <Loader2
              className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-300"
              aria-hidden="true"
            />
          ) : (
            <ImagePlus
              className="h-5 w-5 text-blue-600 dark:text-blue-300"
              aria-hidden="true"
            />
          )}
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Anexar imagem ou documento
          </span>
          <span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
            {EVIDENCIA_ROTULO_FORMATOS}
          </span>
        </label>
      )}

      <input
        id={idInput}
        type="file"
        accept={EVIDENCIA_ACEITA}
        onChange={selecionar}
        disabled={disabled || lendo}
        className="sr-only"
      />
      {erro && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Fechamento do chamado: só confirma com uma evidência anexada. */
function DialogoFecharChamado({
  chamado,
  salvando,
  onFechar,
  onConfirmar,
}: {
  chamado: Chamado;
  salvando: boolean;
  onFechar: () => void;
  onConfirmar: (evidencia: Evidencia) => void | Promise<void>;
}) {
  const [arquivo, setArquivo] = useState<ArquivoEvidencia | null>(null);

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Fechar chamado {numeroFormatado(chamado.numero)}
          </DialogTitle>
          <DialogDescription>
            O chamado será marcado como <strong>Resolvido</strong> pelo Suporte
            TI e sairá da fila. Para concluir, anexe uma evidência do
            atendimento (imagem ou documento).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-800/60">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {chamado.tipo} · {chamado.local}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
              {chamado.descricao}
            </p>
          </div>

          {chamado.evidenciaNome && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evidência atual:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {chamado.evidenciaNome}
              </span>{" "}
              (será substituída pelo novo anexo).
            </p>
          )}

          <CampoEvidencia
            idInput="fechar-evidencia"
            arquivo={arquivo}
            onSelecionar={setArquivo}
            onRemover={() => setArquivo(null)}
            disabled={salvando}
          />
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={onFechar} disabled={salvando}>
            Voltar
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-orange-400 font-bold text-white hover:brightness-105"
            disabled={!arquivo || salvando}
            onClick={() =>
              arquivo &&
              onConfirmar({
                nome: arquivo.nome,
                tipo: arquivo.tipo,
                dados: arquivo.dados,
              })
            }
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            Fechar chamado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
