export type StatusChamado = "Aberto" | "Em atendimento" | "Resolvido";
export type StatusEquipamento = "Disponível" | "Reservado" | "Manutenção";

export const STATUS_CHAMADO: StatusChamado[] = [
  "Aberto",
  "Em atendimento",
  "Resolvido",
];

export const TIPOS = [
  "Notebook",
  "Projetor",
  "Internet",
  "Impressora",
  "Computador",
  "Software",
  "Outro",
] as const;

export const LOCAIS = [
  "Lab 01",
  "Lab 02",
  "Lab 03",
  "Sala 05",
  "Sala 12",
  "Sala 20",
  "Biblioteca",
  "Coordenação",
  "Secretaria",
] as const;

export const PRIORIDADES = ["Baixa", "Média", "Alta"] as const;

/** Evidência obrigatória para fechar chamado: formatos aceitos e limite. */
export const EVIDENCIA_LIMITE_BYTES = 5 * 1024 * 1024; // 5 MB
export const EVIDENCIA_ACEITA =
  "image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv";
export const EVIDENCIA_ROTULO_FORMATOS =
  "Imagens (JPG, PNG…), PDF, Word, Excel, PowerPoint, TXT ou CSV · até 5 MB";

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Aceita qualquer imagem ou tipos de documento comuns (validação leve no cliente). */
export function formatoEvidenciaValido(tipo: string, nome: string): boolean {
  if (tipo.startsWith("image/")) return true;
  const permitidos = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-excel",
    "text/plain",
    "text/csv",
    "application/zip",
  ];
  if (permitidos.some((p) => tipo.startsWith(p))) return true;
  const extensao = nome.split(".").pop()?.toLowerCase() ?? "";
  return ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "zip"].includes(
    extensao,
  );
}

/** Unidades do Senac DF disponíveis para acesso ao sistema. */
export const UNIDADES = [
  "Taguatinga",
  "Asa Norte",
  "Asa Sul",
  "Ceilândia",
  "Gama",
  "Guará",
  "Planaltina",
  "Recanto das Emas",
  "Santa Maria",
  "São Sebastião",
  "Sobradinho",
] as const;

export interface Chamado {
  id: string;
  numero: number;
  tipo: string;
  local: string;
  descricao: string;
  prioridade: string;
  status: string;
  solicitante: string;
  evidenciaNome: string | null;
  evidenciaTipo: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Arquivo de evidência enviado ao fechar um chamado (data URL base64). */
export interface Evidencia {
  nome: string;
  tipo: string;
  dados: string;
}

export interface Equipamento {
  id: string;
  patrimonio: string;
  modelo: string;
  status: string;
  reservadoPor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUsuario {
  nome: string;
  metodo: string;
  unidade: string;
}

/** Ponto colorido + rótulo, igual aos cards da base original. */
export function corStatusChamado(status: string): string {
  switch (status) {
    case "Aberto":
      return "bg-blue-400";
    case "Em atendimento":
      return "bg-orange-400";
    case "Resolvido":
      return "bg-emerald-400";
    default:
      return "bg-slate-400";
  }
}

export function classeStatusChamado(status: string): string {
  switch (status) {
    case "Aberto":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30";
    case "Em atendimento":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30";
    case "Resolvido":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30";
  }
}

export function classeStatusEquipamento(status: string): string {
  switch (status) {
    case "Disponível":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30";
    case "Reservado":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30";
    case "Manutenção":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30";
  }
}

export function classePrioridade(prioridade: string): string {
  switch (prioridade) {
    case "Alta":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30";
    case "Média":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30";
    case "Baixa":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function formatarData(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function numeroFormatado(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}
