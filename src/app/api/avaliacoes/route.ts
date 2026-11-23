import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UNIDADES } from "@/lib/conectati";

export async function GET() {
  try {
    const avaliacoes = await db.avaliacao.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const total = await db.avaliacao.count();
    const media =
      total > 0
        ? Math.round(
            (avaliacoes.reduce((soma, a) => soma + a.nota, 0) /
              avaliacoes.length) *
              10,
          ) / 10
        : 0;

    return NextResponse.json({ avaliacoes, total, media });
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível carregar as avaliações." },
      { status: 500 },
    );
  }
}

export async function POST(requisicao: NextRequest) {
  try {
    const corpo = (await requisicao.json()) as {
      nota?: number;
      comentario?: string;
      unidade?: string;
      nome?: string;
    };

    const nota = Number(corpo.nota);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return NextResponse.json(
        { erro: "A nota deve ser de 1 a 5 estrelas." },
        { status: 400 },
      );
    }

    const comentario = (corpo.comentario ?? "").trim().slice(0, 500);
    const nome = (corpo.nome ?? "").trim().slice(0, 60);
    const unidade = UNIDADES.includes(
      (corpo.unidade ?? "") as (typeof UNIDADES)[number],
    )
      ? corpo.unidade!
      : "Taguatinga";

    const avaliacao = await db.avaliacao.create({
      data: { nota, comentario, unidade, nome },
    });

    return NextResponse.json({ avaliacao }, { status: 201 });
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível registrar a avaliação." },
      { status: 500 },
    );
  }
}
