import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import {
  conferirUuid,
  ErroParticipacao,
} from "@/lib/solicitacoes/participacoes";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";
import { camposComprovante } from "@/lib/contratos/comprovantes";
import { encerrarSolicitacoesVencidas } from "@/lib/solicitacoes/encerramento";

export const dynamic = "force-dynamic";
export async function GET(requisicao, props) {
  const params = await props.params;
  const { error, session } = await authorize(requisicao, "empresa");
  if (error) return error;
  try {
    conferirUuid(params.matriculaId);
    await encerrarSolicitacoesVencidas(prisma, { empresaId: session.dados.id });
    const matricula = await prisma.matricula.findFirst({
      where: {
        id: params.matriculaId,
        empresaAtualId: session.dados.id,
        status: { in: ["INDICADO", "EM_PROCESSO", "CONTRATADO"] },
        aluno: { arquivadoEm: null, empresaId: session.dados.id },
      },
      select: {
        status: true,
        termoAtual: true,
        contratoConfirmado: true,
        aluno: {
          select: { nome: true, email: true, celular: true, telefone: true },
        },
        turma: {
          select: {
            codigo: true,
            turno: true,
            curso: { select: { nome: true } },
          },
        },
      },
    });
    if (!matricula) throw new ErroParticipacao("Vínculo não encontrado.", 404);
    return jsonEmpresa({
      participacao: {
        id: null,
        podeAlterar: false,
        podeEnviarContrato: false,
        comprovantes: await prisma.comprovanteContrato.findMany({
          where: {
            matriculaId: params.matriculaId,
            empresaId: session.dados.id,
          },
          orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
          take: 30,
          select: camposComprovante,
        }),
        status: matricula.status,
        contratoRecebido:
          matricula.status === "CONTRATADO"
            ? matricula.contratoConfirmado
            : null,
        aluno: {
          ...matricula.aluno,
          curso: matricula.turma.curso.nome,
          turma: matricula.turma.codigo,
          turno: matricula.turma.turno,
          termo: matricula.termoAtual,
        },
        eventos: [],
      },
    });
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
