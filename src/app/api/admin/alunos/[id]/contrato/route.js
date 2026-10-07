import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { confirmarContratoAluno } from "@/lib/alunos/detalhes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (dados, status = 200) =>
  NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function PATCH(requisicao, { params }) {
  const { error: erro, session: sessao } = await authorize(requisicao, "admin");
  if (erro) return erro;
  try {
    return json(
      await confirmarContratoAluno(
        prisma,
        sessao.dados.id,
        params.id,
        await requisicao.json(),
      ),
    );
  } catch (erroCapturado) {
    return json(
      {
        mensagem: erroCapturado.status
          ? erroCapturado.message
          : erroCapturado instanceof SyntaxError
            ? "JSON inválido."
            : "Não foi possível salvar a confirmação do contrato.",
      },
      erroCapturado.status ||
        (erroCapturado instanceof SyntaxError ? 400 : 500),
    );
  }
}
