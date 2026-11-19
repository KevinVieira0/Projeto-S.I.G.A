import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { editarEmpresa } from "@/lib/empresas/gestao";
import { obterDetalhesEmpresa } from "@/lib/empresas/detalhes";
import { tentarEspelharBase } from "@/lib/importacao/espelharBase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (dados, status = 200) =>
  NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
function responderErro(erro) {
  return json(
    {
      mensagem: erro.status
        ? erro.message
        : erro instanceof SyntaxError
          ? "JSON inválido."
          : "Não foi possível concluir a operação com a empresa.",
    },
    erro.status || (erro instanceof SyntaxError ? 400 : 500),
  );
}

export async function GET(requisicao, { params: parametros }) {
  const { error: erro } = await authorize(requisicao, "admin");
  if (erro) return erro;
  try {
    return json({ empresa: await obterDetalhesEmpresa(prisma, parametros.id) });
  } catch (erroCapturado) {
    return responderErro(erroCapturado);
  }
}

export async function PATCH(requisicao, { params: parametros }) {
  const { error: erro, session: sessao } = await authorize(requisicao, "admin");
  if (erro) return erro;
  try {
    const empresa = await editarEmpresa(
      prisma,
      sessao.dados.id,
      parametros.id,
      await requisicao.json(),
    );
    return json({ empresa, espelho: await tentarEspelharBase(prisma) });
  } catch (erroCapturado) {
    return responderErro(erroCapturado);
  }
}
