import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MODELOS = [
  "Dell Latitude 3420",
  "Lenovo ThinkPad L14",
  "Acer Aspire 5",
  "Samsung Book3",
];

/** 22 notebooks: 18 disponíveis, 3 reservados e 1 em manutenção. */
async function garantirEquipamentosIniciais() {
  const total = await db.equipamento.count();
  if (total > 0) return;

  const reservados: Record<string, string> = {
    "NB-104": "Prof. Ana Souza",
    "NB-110": "Prof. Carlos Lima",
    "NB-117": "Coordenação",
  };
  const manutencao = new Set(["NB-113"]);

  for (let i = 101; i <= 122; i++) {
    const patrimonio = `NB-${i}`;
    const status = reservados[patrimonio]
      ? "Reservado"
      : manutencao.has(patrimonio)
        ? "Manutenção"
        : "Disponível";
    await db.equipamento.create({
      data: {
        patrimonio,
        modelo: MODELOS[i % MODELOS.length],
        status,
        reservadoPor: reservados[patrimonio] ?? null,
      },
    });
  }
}

export async function GET() {
  try {
    await garantirEquipamentosIniciais();
    const equipamentos = await db.equipamento.findMany({
      orderBy: { patrimonio: "asc" },
    });
    return NextResponse.json({ equipamentos });
  } catch (erro) {
    console.error("GET /api/equipamentos:", erro);
    return NextResponse.json(
      { erro: "Não foi possível carregar os equipamentos." },
      { status: 500 },
    );
  }
}
