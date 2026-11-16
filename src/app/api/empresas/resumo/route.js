import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";
import { encerrarSolicitacoesVencidas } from "@/lib/solicitacoes/encerramento";

export const dynamic = "force-dynamic";
export async function GET(requisicao) {
  const { error, session } = await authorize(requisicao, "empresa");
  if (error) return error;
  const empresaId = session.dados.id;
  try {
    await encerrarSolicitacoesVencidas(prisma, { empresaId });
    const resumo = await prisma.$transaction(
      async (tx) => {
        const contar = (status) =>
          tx.aluno.count({
            where: {
              arquivadoEm: null,
              empresaId,
              matriculas: { some: { empresaAtualId: empresaId, status } },
            },
          });
        const [indicados, emProcesso, contratados, solicitacoesAtivas] =
          await Promise.all([
            contar("INDICADO"),
            contar("EM_PROCESSO"),
            contar("CONTRATADO"),
            tx.solicitacao.count({
              where: { idEmpresa: empresaId, ativa: true },
            }),
          ]);
        return { indicados, emProcesso, contratados, solicitacoesAtivas };
      },
      { isolationLevel: "RepeatableRead" },
    );
    return jsonEmpresa({ resumo });
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
