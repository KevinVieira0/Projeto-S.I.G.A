import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { lerEnvioContrato } from "@/lib/contratos/comprovantes";
import { alterarParticipacaoEmpresa } from "@/lib/solicitacoes/participacoes";
import { tentarEspelharBase } from "@/lib/importacao/espelharBase";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(requisicao, { params }) {
  const { error, session } = await authorize(requisicao, "empresa", {
    tipoConteudo: "multipart/form-data",
  });
  if (error) return error;
  try {
    const { versao, comprovante } = await lerEnvioContrato(requisicao);
    const resultado = await alterarParticipacaoEmpresa(
      prisma,
      session.dados.id,
      params.id,
      params.participacaoId,
      { acao: "CONTRATAR", versao, confirmado: true },
      comprovante,
    );
    return jsonEmpresa({
      ...resultado,
      espelho: resultado.jaAplicado ? null : await tentarEspelharBase(prisma),
    });
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
