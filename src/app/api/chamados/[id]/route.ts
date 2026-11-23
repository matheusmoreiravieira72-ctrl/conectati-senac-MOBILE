import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STATUS_CHAMADO } from "@/lib/conectati";

/** Limite do data URL base64 (~5 MB de arquivo + overhead da codificação). */
const EVIDENCIA_DADOS_MAX = 7_500_000;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const corpo = await req.json().catch(() => null);
    if (!corpo || typeof corpo !== "object") {
      return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
    }

    const existente = await db.chamado.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json(
        { erro: "Chamado não encontrado." },
        { status: 404 },
      );
    }

    const dados: {
      tipo?: string;
      local?: string;
      descricao?: string;
      prioridade?: string;
      status?: string;
      evidenciaNome?: string | null;
      evidenciaTipo?: string | null;
      evidenciaDados?: string | null;
    } = {};

    if (corpo.tipo !== undefined) dados.tipo = String(corpo.tipo).trim() || "Outro";
    if (corpo.local !== undefined) dados.local = String(corpo.local).trim() || "Sala 05";
    if (corpo.prioridade !== undefined) {
      dados.prioridade = String(corpo.prioridade).trim() || "Média";
    }
    if (corpo.status !== undefined) {
      const status = String(corpo.status).trim();
      if (!STATUS_CHAMADO.includes(status as (typeof STATUS_CHAMADO)[number])) {
        return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
      }
      dados.status = status;
    }
    if (corpo.descricao !== undefined) {
      const descricao = String(corpo.descricao).trim();
      if (descricao.length < 10) {
        return NextResponse.json(
          { erro: "Descreva o problema com pelo menos 10 caracteres." },
          { status: 400 },
        );
      }
      dados.descricao = descricao;
    }

    // Evidência anexada (imagem ou documento) — obrigatória para fechar o chamado.
    if (corpo.evidencia !== undefined) {
      const ev = corpo.evidencia;
      if (
        !ev ||
        typeof ev !== "object" ||
        typeof ev.nome !== "string" ||
        !ev.nome.trim() ||
        typeof ev.dados !== "string" ||
        !ev.dados.startsWith("data:")
      ) {
        return NextResponse.json(
          { erro: "Evidência inválida: envie um arquivo de imagem ou documento." },
          { status: 400 },
        );
      }
      if (ev.dados.length > EVIDENCIA_DADOS_MAX) {
        return NextResponse.json(
          { erro: "Arquivo muito grande: o limite é de 5 MB." },
          { status: 400 },
        );
      }
      dados.evidenciaNome = ev.nome.trim().slice(0, 200);
      dados.evidenciaTipo = String(ev.tipo ?? "application/octet-stream")
        .trim()
        .slice(0, 100);
      dados.evidenciaDados = ev.dados;
    }

    // Regra: só fecha como Resolvido com evidência (nova no pedido ou já anexada).
    if (dados.status === "Resolvido") {
      const temEvidenciaNova = dados.evidenciaDados !== undefined;
      const temEvidenciaSalva = Boolean(existente.evidenciaDados);
      if (!temEvidenciaNova && !temEvidenciaSalva) {
        return NextResponse.json(
          {
            erro:
              "Para fechar o chamado é obrigatório anexar uma evidência (imagem ou documento).",
          },
          { status: 400 },
        );
      }
    }

    const chamado = await db.chamado.update({ where: { id }, data: dados });
    return NextResponse.json({ chamado });
  } catch (erro) {
    console.error("PATCH /api/chamados/[id]:", erro);
    return NextResponse.json(
      { erro: "Não foi possível atualizar o chamado." },
      { status: 500 },
    );
  }
}
