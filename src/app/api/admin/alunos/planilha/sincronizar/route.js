import { authorize } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sincronizarRecebimentos } from "@/lib/importacao/sincronizarRecebimentos";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function POST(requisicao) {
  const { error: erroCapturado } = await authorize(requisicao, "admin");
  if (erroCapturado) return erroCapturado;
  if (process.env.GOOGLE_SHEETS_RECEBIMENTOS_AUTO !== "true") {
    return NextResponse.json(
      {
        mensagem: "Integração automática desativada neste ambiente.",
        desativada: true,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const recebimentos = await sincronizarRecebimentos(prisma);
    return NextResponse.json(
      {
        mensagem: recebimentos.espelho.falha
          ? "Cadastros processados; espelhamento da planilha pendente."
          : recebimentos.espelho.desativado
            ? "Cadastros processados; espelhamento desativado neste ambiente."
            : "Alunos e empresas processados automaticamente; planilha atualizada com os dados do sistema.",
        recebimentos,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        mensagem:
          "Não foi possível buscar os cadastros. Confira o acesso à nova planilha.",
      },
      { status: 502 },
    );
  }
}
