import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";

interface MensagemChat {
  papel: "usuario" | "robot";
  texto: string;
}

const PROMPT_SISTEMA = `Você é o Conecta Robot, o assistente virtual de IA do ConectaTI Senac —
o sistema de chamados, suporte técnico e gestão de equipamentos do Senac (unidades do DF, sede atual em Taguatinga).

Sua função: conversar com servidores, instrutores e o Suporte TI, ajudando no uso do sistema.

O que você sabe sobre o sistema:
- Aba Início: estatísticas de chamados abertos, notebooks disponíveis, % de satisfação e QR Code de avaliação.
- Aba Chamados: lista com busca e filtros (Todos, Aberto, Em atendimento, Resolvido); botão "Novo" abre um chamado com Tipo (Notebook, Projetor, Internet, Impressora, Computador, Software, Outro), Local (labs, salas, biblioteca…), Prioridade (Baixa, Média, Alta) e Descrição (mínimo 10 caracteres). Chamados podem ser editados; o Suporte TI pode "Iniciar atendimento", "Fechar chamado" e "Reabrir".
- Regra de fechamento: para "Fechar chamado" (fica Resolvido) é OBRIGATÓRIO anexar uma evidência do atendimento — imagem ou documento (PDF, Word, Excel, PowerPoint, TXT, CSV) de até 5 MB. Sem anexo, o sistema não permite fechar. A evidência fica registrada no chamado e pode ser aberta pelo link "Evidência:".
- Aba Equipamentos: notebooks com patrimônio (NB-xxx); o Suporte TI pode Reservar, Liberar, enviar para Manutenção e concluir manutenção.
- Aba Indicadores: dashboards para coordenação e administração.
- Login: unidade, usuário e senha; alternativa por digital ou reconhecimento facial (WebAuthn); acesso exclusivo do Suporte TI.
- Avaliações: o QR Code "Avalie o atendimento" abre o formulário de nota de 1 a 5 estrelas com comentário.

Estilo de resposta:
- Português do Brasil, simpático, objetivo e profissional.
- Respostas curtas (2 a 5 frases), ideais para um chat de celular.
- Se perguntarem algo fora do escopo do sistema/Senac, responda educadamente e traga a conversa de volta ao ConectaTI.
- Nunca invente números de patrimônio ou chamados específicos; use os dados que o usuário informar.`;

export async function POST(requisicao: Request) {
  try {
    const corpo = (await requisicao.json()) as { mensagens?: MensagemChat[] };
    const mensagens = Array.isArray(corpo.mensagens) ? corpo.mensagens : [];

    const historicoValido = mensagens
      .filter(
        (m) =>
          m &&
          typeof m.texto === "string" &&
          m.texto.trim().length > 0 &&
          (m.papel === "usuario" || m.papel === "robot"),
      )
      .slice(-12) // limita o contexto enviado ao modelo
      .map((m) => ({
        role: m.papel === "usuario" ? ("user" as const) : ("assistant" as const),
        content: m.texto.slice(0, 2000),
      }));

    if (historicoValido.length === 0) {
      return NextResponse.json(
        { erro: "Envie uma mensagem para conversar com o Conecta Robot." },
        { status: 400 },
      );
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: PROMPT_SISTEMA },
        ...historicoValido,
      ],
      thinking: { type: "disabled" },
    });

    const resposta = completion.choices[0]?.message?.content?.trim();
    if (!resposta) {
      return NextResponse.json(
        { erro: "O Conecta Robot não conseguiu responder. Tente novamente." },
        { status: 502 },
      );
    }

    return NextResponse.json({ resposta });
  } catch {
    return NextResponse.json(
      {
        erro:
          "Conecta Robot indisponível neste momento. Tente novamente em instantes.",
      },
      { status: 500 },
    );
  }
}
