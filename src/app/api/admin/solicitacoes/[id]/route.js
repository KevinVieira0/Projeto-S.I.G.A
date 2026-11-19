import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { alterarEstadoSolicitacao } from "@/lib/solicitacoes/gestao";

export const dynamic = "force-dynamic";

export async function PATCH(requisicao, { params }) {
  const { error, session } = await authorize(requisicao, "admin");
  if (error) return error;
  try {
    const solicitacao = await alterarEstadoSolicitacao(
      prisma,
      session.dados.id,
      params.id,
      await requisicao.json(),
    );
    return NextResponse.json({ solicitacao });
  } catch (erro) {
    return NextResponse.json(
      {
        mensagem: erro.status
          ? erro.message
          : erro instanceof SyntaxError
            ? "JSON inválido."
            : "Não foi possível alterar a solicitação.",
      },
      { status: erro.status || (erro instanceof SyntaxError ? 400 : 500) },
    );
  }
}
