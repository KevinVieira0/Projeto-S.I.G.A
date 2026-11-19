import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (dados, status = 200) =>
  NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function GET(requisicao, { params: parametros }) {
  const { error: erro } = await authorize(requisicao, "admin");
  if (erro) return erro;
  try {
    const registro = await prisma.recebimentoCadastro.findUnique({
      where: { id: parametros.id },
      select: {
        id: true,
        tipo: true,
        dados: true,
        erros: true,
        estado: true,
        recebidoEm: true,
        processadoEm: true,
      },
    });
    return registro
      ? json(registro)
      : json({ mensagem: "Recebimento não encontrado." }, 404);
  } catch {
    return json(
      { mensagem: "Não foi possível consultar o processamento." },
      500,
    );
  }
}

export async function POST(requisicao) {
  const { error: erro } = await authorize(requisicao, "admin");
  if (erro) return erro;
  return json(
    {
      mensagem:
        "A aprovação manual foi retirada. Os cadastros válidos são processados automaticamente.",
    },
    410,
  );
}
