import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const MEIO_DIA_MS = 12 * 60 * 60 * 1000;

/** Limite do data URL base64 (~5 MB de arquivo + overhead da codificação). */
const EVIDENCIA_DADOS_MAX = 7_500_000;

/** Três primeiros chamados idênticos aos cards da tela inicial original. */
const BASE = [
  {
    numero: 1,
    tipo: "Notebook",
    local: "Lab 02",
    descricao:
      "Notebook do carrinho 1 não liga. A luz de carregamento não acende e a aula do período da tarde precisa do equipamento.",
    prioridade: "Alta",
    status: "Em atendimento",
    solicitante: "Prof. Ana Souza",
  },
  {
    numero: 2,
    tipo: "Projetor",
    local: "Sala 12",
    descricao:
      "Projetor liga mas não exibe imagem do computador. Já testei o cabo HDMI em outra fonte e o problema continua.",
    prioridade: "Alta",
    status: "Aberto",
    solicitante: "Prof. Carlos Lima",
  },
  {
    numero: 3,
    tipo: "Internet",
    local: "Lab 01",
    descricao:
      "Wi-Fi do laboratório caindo constantemente durante as aulas práticas. Já reiniciei o roteador do bloco.",
    prioridade: "Média",
    status: "Resolvido",
    solicitante: "Prof. Marcos Vieira",
  },
];

const TIPOS_SEED = [
  "Internet",
  "Notebook",
  "Projetor",
  "Impressora",
  "Computador",
  "Software",
];
const LOCAIS_SEED = [
  "Lab 01",
  "Lab 02",
  "Lab 03",
  "Sala 05",
  "Sala 12",
  "Sala 20",
  "Biblioteca",
  "Coordenação",
  "Secretaria",
];
const PROFESSORES = [
  "Prof. Ana Souza",
  "Prof. Carlos Lima",
  "Prof. Marcos Vieira",
  "Prof. Juliana Costa",
  "Prof. Rafael Dias",
  "Prof. Beatriz Alves",
  "Prof. Tiago Mendes",
  "Coordenação",
];
const DETALHES: Record<string, string> = {
  Internet: "Conexão muito lenta ou intermitente no ambiente.",
  Notebook: "Equipamento do carrinho portátil com falha ao iniciar.",
  Projetor: "Imagem instável ou ausente na projeção das aulas.",
  Impressora: "Impressora apresenta atolamento de papel e falhas.",
  Computador: "Computador do ambiente travando ao abrir programas.",
  Software: "Aplicativo utilizado em aula apresenta erro na abertura.",
};

async function garantirChamadosIniciais() {
  const total = await db.chamado.count();
  if (total > 0) return;

  // Evidência em texto de exemplo para os chamados já resolvidos do histórico.
  const evidenciaTexto = (titulo: string, corpo: string) => ({
    evidenciaNome: titulo,
    evidenciaTipo: "text/plain",
    evidenciaDados:
      "data:text/plain;base64," + Buffer.from(corpo, "utf8").toString("base64"),
  });

  const EVIDENCIA_3 = evidenciaTexto(
    "laudo-correcao-wifi.txt",
    "Laudo de correção — Wi-Fi Lab 01\n" +
      "Chamado #003 · Suporte TI Senac\n\n" +
      "Procedimento: substituição do ponto de acesso e reconfiguração do canal.\n" +
      "Teste: 2 horas de uso contínuo sem quedas de conexão.\n" +
      "Status final: RESOLVIDO.",
  );

  for (const c of BASE) {
    await db.chamado.create({
      data: {
        ...c,
        ...(c.numero === 3 ? EVIDENCIA_3 : {}),
        createdAt: new Date(Date.now() - (30 - c.numero) * MEIO_DIA_MS),
      },
    });
  }

  // 24 abertos, 3 em atendimento e 3 resolvidos no total (como na base).
  for (let numero = 4; numero <= 30; numero++) {
    const status =
      numero <= 26 ? "Aberto" : numero <= 28 ? "Em atendimento" : "Resolvido";
    const tipo = TIPOS_SEED[numero % TIPOS_SEED.length];
    const local = LOCAIS_SEED[(numero * 3) % LOCAIS_SEED.length];
    const prioridade = numero % 3 === 0 ? "Alta" : numero % 3 === 1 ? "Média" : "Baixa";
    const evidencia =
      status === "Resolvido"
        ? evidenciaTexto(
            `registro-atendimento-${String(numero).padStart(3, "0")}.txt`,
            `Registro de atendimento — chamado #${String(numero).padStart(3, "0")}\n` +
              `Tipo: ${tipo} · Local: ${local}\nSuporte TI Senac\n\n` +
              "Atendimento concluído com verificação no ambiente. Evidência registrada.",
          )
        : {};
    await db.chamado.create({
      data: {
        numero,
        tipo,
        local,
        status,
        prioridade,
        descricao: `${DETALHES[tipo]} Reportado pelo ${LOCAIS_SEED[numero % LOCAIS_SEED.length] === local ? "usuário" : local}.`,
        solicitante: PROFESSORES[numero % PROFESSORES.length],
        ...evidencia,
        createdAt: new Date(Date.now() - (30 - numero) * MEIO_DIA_MS),
      },
    });
  }
}

export async function GET() {
  try {
    await garantirChamadosIniciais();
    // evidenciaDados (base64) fica fora da listagem — servido em /api/chamados/[id]/evidencia.
    const chamados = await db.chamado.findMany({
      orderBy: { numero: "desc" },
      select: {
        id: true,
        numero: true,
        tipo: true,
        local: true,
        descricao: true,
        prioridade: true,
        status: true,
        solicitante: true,
        evidenciaNome: true,
        evidenciaTipo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ chamados });
  } catch (erro) {
    console.error("GET /api/chamados:", erro);
    return NextResponse.json(
      { erro: "Não foi possível carregar os chamados." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const corpo = await req.json().catch(() => null);
    if (!corpo || typeof corpo !== "object") {
      return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
    }

    const tipo = String(corpo.tipo ?? "Outro").trim() || "Outro";
    const local = String(corpo.local ?? "Sala 05").trim() || "Sala 05";
    const descricao = String(corpo.descricao ?? "").trim();
    const solicitante = String(corpo.solicitante ?? "").trim();
    const prioridade = String(corpo.prioridade ?? "Média").trim() || "Média";

    if (descricao.length < 10) {
      return NextResponse.json(
        { erro: "Descreva o problema com pelo menos 10 caracteres." },
        { status: 400 },
      );
    }
    if (!solicitante) {
      return NextResponse.json(
        { erro: "Informe o nome do solicitante." },
        { status: 400 },
      );
    }

    // Anexo opcional (imagem ou documento) enviado junto da abertura do chamado.
    const dadosAnexo: {
      evidenciaNome?: string;
      evidenciaTipo?: string;
      evidenciaDados?: string;
    } = {};
    if (corpo.evidencia !== undefined && corpo.evidencia !== null) {
      const ev = corpo.evidencia;
      if (
        typeof ev !== "object" ||
        typeof ev.nome !== "string" ||
        !ev.nome.trim() ||
        typeof ev.dados !== "string" ||
        !ev.dados.startsWith("data:")
      ) {
        return NextResponse.json(
          { erro: "Anexo inválido: envie um arquivo de imagem ou documento." },
          { status: 400 },
        );
      }
      if (ev.dados.length > EVIDENCIA_DADOS_MAX) {
        return NextResponse.json(
          { erro: "Arquivo muito grande: o limite é de 5 MB." },
          { status: 400 },
        );
      }
      dadosAnexo.evidenciaNome = ev.nome.trim().slice(0, 200);
      dadosAnexo.evidenciaTipo = String(ev.tipo ?? "application/octet-stream")
        .trim()
        .slice(0, 100);
      dadosAnexo.evidenciaDados = ev.dados;
    }

    const ultimo = await db.chamado.findFirst({
      orderBy: { numero: "desc" },
      select: { numero: true },
    });
    const numero = (ultimo?.numero ?? 0) + 1;

    const chamado = await db.chamado.create({
      data: {
        numero,
        tipo,
        local,
        descricao,
        solicitante,
        prioridade,
        status: "Aberto",
        ...dadosAnexo,
      },
    });

    return NextResponse.json({ chamado }, { status: 201 });
  } catch (erro) {
    console.error("POST /api/chamados:", erro);
    return NextResponse.json(
      { erro: "Não foi possível abrir o chamado." },
      { status: 500 },
    );
  }
}
