import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import {
  obterParticipacaoEmpresa,
  alterarParticipacaoEmpresa,
} from "@/lib/solicitacoes/participacoes";
import { tentarEspelharBase } from "@/lib/importacao/espelharBase";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";

export const dynamic = "force-dynamic";
export async function GET(requisicao, { params }) {
  const { error, session } = await authorize(requisicao, "empresa");
  if (error) return error;
  try {
    return jsonEmpresa({
      participacao: await obterParticipacaoEmpresa(
        prisma,
        session.dados.id,
        params.id,
        params.participacaoId,
      ),
    });
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
export async function PATCH(requisicao, { params }) {
  const { error, session } = await authorize(requisicao, "empresa");
  if (error) return error;
  try {
    const resultado = await alterarParticipacaoEmpresa(
      prisma,
      session.dados.id,
      params.id,
      params.participacaoId,
      await requisicao.json(),
    );
    return jsonEmpresa({
      ...resultado,
      espelho: resultado.jaAplicado ? null : await tentarEspelharBase(prisma),
    });
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
