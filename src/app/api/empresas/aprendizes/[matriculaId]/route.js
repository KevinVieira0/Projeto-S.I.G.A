import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import {
  conferirUuid,
  ErroParticipacao,
} from "@/lib/solicitacoes/participacoes";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";
import { camposComprovante } from "@/lib/contratos/comprovantes";
import { correspondeAoCadastro } from "@/lib/alunos/vinculoAtual";

export const dynamic = "force-dynamic";
export async function GET(requisicao, { params }) {
  const { error, session } = await authorize(requisicao, "empresa");
  if (error) return error;
  try {
    conferirUuid((await params).matriculaId);
    const matricula = await prisma.matricula.findFirst({
      where: {
        id: (await params).matriculaId,
        empresaAtualId: session.dados.id,
        status: { in: ["INDICADO", "EM_PROCESSO", "CONTRATADO"] },
        aluno: { arquivadoEm: null, empresaId: session.dados.id },
      },
      select: {
        status: true,
        termoAtual: true,
        contratoConfirmado: true,
        aluno: {
          select: { nome: true, email: true, celular: true, telefone: true, turma: true, curso: true, periodo: true, arquivadoEm: true },
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
    if (!matricula || !correspondeAoCadastro(matricula)) throw new ErroParticipacao("Vínculo não encontrado.", 404);
    return jsonEmpresa({
      participacao: {
        id: null,
        podeAlterar: false,
        podeEnviarContrato: false,
        comprovantes: await prisma.comprovanteContrato.findMany({
          where: {
            matriculaId: (await params).matriculaId,
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
          nome: matricula.aluno.nome,
          email: matricula.aluno.email,
          celular: matricula.aluno.celular,
          telefone: matricula.aluno.telefone,
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
