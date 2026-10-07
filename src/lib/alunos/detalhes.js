import { z } from "zod";
import { selectAluno, ErroGestaoAluno } from "./gestao";

const camposEmpresa = {
  id: true,
  razaoSocial: true,
  nomeFantasia: true,
  cnpj: true,
  email: true,
  telefone: true,
  ativa: true,
};
const confirmacaoSchema = z
  .object({
    matriculaId: z.string().uuid(),
    confirmado: z.boolean(),
    versao: z.string().datetime(),
  })
  .strict();
const limiteHistorico = 100;
const limiteSolicitacoes = 50;

export async function obterDetalhesAluno(prisma, id) {
  return prisma.$transaction(
    async (transacao) => {
      const aluno = await transacao.aluno.findUnique({
        where: { id },
        select: {
          ...selectAluno,
          dataCadastro: true,
          origemCadastro: true,
          ultimaSincronizacao: true,
          empresa: { select: camposEmpresa },
          matriculas: {
            select: {
              id: true,
              turmaId: true,
              termoAtual: true,
              status: true,
              empresaAtualId: true,
              contratoConfirmado: true,
              contratoAtualizadoEm: true,
              atualizadoEm: true,
              empresaAtual: { select: camposEmpresa },
              turma: {
                select: {
                  id: true,
                  codigo: true,
                  turno: true,
                  dataInicio: true,
                  dataFim: true,
                  quantidadeTermos: true,
                  curso: { select: { id: true, nome: true, tipoCurso: true } },
                },
              },
            },
            orderBy: [{ atualizadoEm: "desc" }, { id: "asc" }],
          },
        },
      });
      if (!aluno || aluno.arquivadoEm)
        throw new ErroGestaoAluno("Aluno não encontrado.", 404);
      const atual = aluno.matriculas.find(
        (m) =>
          m.turma.codigo === aluno.turma &&
          m.turma.curso.nome === aluno.curso &&
          m.turma.turno === aluno.periodo,
      );
      const vinculoAluno = { matricula: { alunoId: id } };
      const vinculoSolicitacao = {
        eventosAcompanhamento: { some: vinculoAluno },
      };
      const [historico, totalHistorico, solicitacoes, totalSolicitacoes] =
        await Promise.all([
          transacao.historicoAcompanhamento.findMany({
            where: vinculoAluno,
            orderBy: [{ registradoEm: "desc" }, { id: "asc" }],
            take: limiteHistorico,
            select: {
              id: true,
              matriculaId: true,
              tipo: true,
              statusAnterior: true,
              novoStatus: true,
              registradoEm: true,
              empresa: { select: camposEmpresa },
              solicitacaoId: true,
              matricula: { select: { turma: { select: { codigo: true } } } },
            },
          }),
          transacao.historicoAcompanhamento.count({ where: vinculoAluno }),
          transacao.solicitacao.findMany({
            where: vinculoSolicitacao,
            orderBy: [{ criadoEm: "desc" }, { id: "asc" }],
            take: limiteSolicitacoes,
            select: {
              id: true,
              ativa: true,
              criadoEm: true,
              inicio: true,
              fim: true,
              quantidadeAlunos: true,
              pratica: true,
              empresa: { select: camposEmpresa },
              eventosAcompanhamento: {
                where: vinculoAluno,
                orderBy: [{ registradoEm: "desc" }, { id: "asc" }],
                take: 1,
                select: { novoStatus: true, registradoEm: true },
              },
            },
          }),
          transacao.solicitacao.count({ where: vinculoSolicitacao }),
        ]);
      return {
        ...aluno,
        turmaId: atual?.turmaId || null,
        matriculaAtualId: atual?.id || null,
        versao: aluno.ultimaAtualizacao.toISOString(),
        historico,
        totalHistorico,
        solicitacoes,
        totalSolicitacoes,
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 30000 },
  );
}

export async function confirmarContratoAluno(
  prisma,
  administradorId,
  alunoId,
  entrada,
) {
  const validacao = confirmacaoSchema.safeParse(entrada);
  if (!validacao.success)
    throw new ErroGestaoAluno("Confirmação de contrato inválida.");
  const dados = validacao.data;
  return prisma.$transaction(
    async (transacao) => {
      await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
      const administrador = await transacao.administrador.findUnique({
        where: { id: administradorId },
        select: { ativo: true },
      });
      if (!administrador?.ativo)
        throw new ErroGestaoAluno("Acesso administrativo inválido.", 403);
      const matricula = await transacao.matricula.findUnique({
        where: { id: dados.matriculaId },
        include: { aluno: { select: { arquivadoEm: true } } },
      });
      if (
        !matricula ||
        matricula.alunoId !== alunoId ||
        matricula.aluno.arquivadoEm
      )
        throw new ErroGestaoAluno("Matrícula não encontrada.", 404);
      if (matricula.status !== "CONTRATADO" || !matricula.empresaAtualId)
        throw new ErroGestaoAluno(
          "Contrato disponível apenas para aluno empregado com empresa vinculada.",
          409,
        );
      if (matricula.atualizadoEm.toISOString() !== dados.versao)
        throw new ErroGestaoAluno(
          "O vínculo mudou. Reabra os detalhes antes de salvar o contrato.",
          409,
        );
      if (matricula.contratoConfirmado === dados.confirmado)
        return {
          matricula: {
            id: matricula.id,
            contratoConfirmado: matricula.contratoConfirmado,
            contratoAtualizadoEm: matricula.contratoAtualizadoEm,
            atualizadoEm: matricula.atualizadoEm,
          },
        };
      const atualizadoEm = new Date();
      const depois = await transacao.matricula.update({
        where: { id: matricula.id },
        data: {
          contratoConfirmado: dados.confirmado,
          contratoAtualizadoEm: atualizadoEm,
        },
        select: {
          id: true,
          contratoConfirmado: true,
          contratoAtualizadoEm: true,
          atualizadoEm: true,
        },
      });
      await transacao.aluno.update({
        where: { id: alunoId },
        data: { ultimaAtualizacao: atualizadoEm },
      });
      await transacao.auditoriaAluno.create({
        data: {
          alunoId,
          responsavelId: administradorId,
          acao: "CONTRATO",
          dados: {
            matriculaId: matricula.id,
            empresaId: matricula.empresaAtualId,
            antes: matricula.contratoConfirmado,
            depois: dados.confirmado,
          },
        },
      });
      return { matricula: depois };
    },
    { timeout: 30000, maxWait: 10000 },
  );
}
