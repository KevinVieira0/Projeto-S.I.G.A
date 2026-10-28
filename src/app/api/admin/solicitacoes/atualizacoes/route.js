import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";

export const dynamic = "force-dynamic";
export async function GET(requisicao) {
  const { error } = await authorize(requisicao, "admin");
  if (error) return error;
  try {
    const eventos = await prisma.eventoParticipacao.findMany({
      where: { autor: "EMPRESA" },
      orderBy: [{ registradoEm: "desc" }, { id: "desc" }],
      take: 10,
      select: {
        id: true,
        novoStatus: true,
        descricao: true,
        registradoEm: true,
        empresa: { select: { nomeFantasia: true, razaoSocial: true } },
        participacao: {
          select: { solicitacaoId: true, aluno: { select: { nome: true } } },
        },
      },
    });
    return jsonEmpresa({
      atualizacoes: eventos.map((e) => ({
        id: e.id,
        status: e.novoStatus,
        descricao: e.descricao,
        registradoEm: e.registradoEm,
        empresa: e.empresa.nomeFantasia || e.empresa.razaoSocial,
        aluno: e.participacao.aluno.nome,
        solicitacaoId: e.participacao.solicitacaoId,
      })),
    });
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
