import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/chamados/[id]/evidencia — abre ou baixa o arquivo anexado ao fechar o chamado. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const chamado = await db.chamado.findUnique({
      where: { id },
      select: { evidenciaNome: true, evidenciaTipo: true, evidenciaDados: true },
    });

    if (!chamado?.evidenciaDados) {
      return NextResponse.json(
        { erro: "Este chamado não possui evidência anexada." },
        { status: 404 },
      );
    }

    // Formato esperado: data:[mime][;base64],conteudo
    const igual = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(chamado.evidenciaDados);
    if (!igual) {
      return NextResponse.json(
        { erro: "Evidência armazenada em formato inválido." },
        { status: 500 },
      );
    }

    const mime = chamado.evidenciaTipo || igual[1] || "application/octet-stream";
    const base64 = igual[3];
    const bytes = new Uint8Array(Buffer.from(base64, "base64"));
    const nome = chamado.evidenciaNome ?? "evidencia";
    const seguro = nome.replace(/[^\w.\- ()]/g, "_");
    const abrirNoNavegador = /^(image\/|application\/pdf|text\/plain)/.test(mime);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `${abrirNoNavegador ? "inline" : "attachment"}; filename="${seguro}"; filename*=UTF-8''${encodeURIComponent(nome)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (erro) {
    console.error("GET /api/chamados/[id]/evidencia:", erro);
    return NextResponse.json(
      { erro: "Não foi possível carregar a evidência." },
      { status: 500 },
    );
  }
}
