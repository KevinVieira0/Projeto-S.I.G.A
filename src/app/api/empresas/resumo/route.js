import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";
import { encerrarSolicitacoesVencidas } from "@/lib/solicitacoes/encerramento";
import { filtroParticipacaoPendente } from "@/lib/solicitacoes/participacoes";

export const dynamic = "force-dynamic";

const camposAcompanhamento = {
  id: true,
  solicitacaoId: true,
  matriculaId: true,
  matricula: { select: { aluno: { select: { nome: true } } } },
};

function dadosAcompanhamento(participacao) {
  return {
    participacaoId: participacao.id,
    solicitacaoId: participacao.solicitacaoId,
    matriculaId: participacao.matriculaId,
    nome: participacao.matricula.aluno.nome,
  };
}

async function contarPendencias(tx, empresaId, status) {
  const where = filtroParticipacaoPendente(empresaId, status);
  const total = await tx.participacaoSolicitacao.count({ where });
  const unica =
    total === 1
      ? await tx.participacaoSolicitacao.findFirst({
          where,
          select: camposAcompanhamento,
        })
      : null;
  return { total, aprendiz: unica ? dadosAcompanhamento(unica) : null };
}

export async function GET(requisicao) {
  const { error, session } = await authorize(requisicao, "empresa");
  if (error) return error;
  const empresaId = session.dados.id;
  try {
    await encerrarSolicitacoesVencidas(prisma, { empresaId });
    const dados = await prisma.$transaction(
      async (tx) => {
        const contar = (status) =>
          tx.aluno.count({
            where: {
              arquivadoEm: null,
              empresaId,
              matriculas: { some: { empresaAtualId: empresaId, status } },
            },
          });
        const [
          indicados,
          emProcesso,
          contratados,
          solicitacoesAtivas,
          indicacoes,
          comprovantes,
          eventos,
        ] = await Promise.all([
          contar("INDICADO"),
          contar("EM_PROCESSO"),
          contar("CONTRATADO"),
          tx.solicitacao.count({
            where: { idEmpresa: empresaId, ativa: true },
          }),
          contarPendencias(tx, empresaId, "INDICADO"),
          contarPendencias(tx, empresaId, "APROVADO"),
          tx.eventoParticipacao.findMany({
            where: { participacao: { solicitacao: { idEmpresa: empresaId } } },
            orderBy: [{ registradoEm: "desc" }, { id: "desc" }],
            take: 3,
            select: {
              id: true,
              statusAnterior: true,
              novoStatus: true,
              registradoEm: true,
              descricao: true,
              participacao: { select: camposAcompanhamento },
            },
          }),
        ]);
        return {
          resumo: { indicados, emProcesso, contratados, solicitacoesAtivas },
          pendencias: { indicacoes, comprovantes },
          movimentacoes: eventos.map(({ participacao, ...evento }) => ({
            ...evento,
            aprendiz: dadosAcompanhamento(participacao),
          })),
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
    return jsonEmpresa(dados);
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
