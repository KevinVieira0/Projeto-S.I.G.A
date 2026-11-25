import { z } from "zod";
import { selectAluno } from "@/lib/alunos/gestao";
import { idadeAluno, matriculaCompativel } from "./requisitos";
import { todayInSaoPaulo } from "@/lib/validations/solicitacaoSchema";
import { estadosEmAberto, registrarParticipacao } from "./participacoes";
import {
  encerrarSeVencida,
  encerrarSolicitacoesVencidas,
} from "./encerramento";

export class ErroGestaoSolicitacao extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

const estadoSchema = z
  .object({ ativa: z.boolean(), ativaAnterior: z.boolean() })
  .strict();
const indicacaoSchema = z
  .object({
    matriculaIds: z
      .array(z.string().uuid())
      .min(1, "Selecione ao menos um aluno.")
      .max(50),
  })
  .strict();

const paginaSchema = z.coerce.number().int().min(1).max(100000).default(1);
const tamanhoPagina = 20;

function filtrosDisponibilidade(solicitacaoId, excluidos) {
  return {
    status: "DISPONIVEL",
    classificacaoPendente: false,
    empresaAtualId: null,
    aluno: {
      arquivadoEm: null,
      empregado: false,
      statusIndicacao: "Disponível",
      empresaId: null,
      ...(excluidos ? { id: { notIn: excluidos } } : {}),
      participacoes: {
        none: {
          OR: [{ solicitacaoId }, { status: { in: estadosEmAberto } }],
        },
      },
    },
  };
}

function validar(schema, entrada) {
  const resultado = schema.safeParse(entrada);
  if (!resultado.success)
    throw new ErroGestaoSolicitacao(resultado.error.issues[0].message);
  return resultado.data;
}

async function iniciarOperacao(transacao, administradorId) {
  // Compartilhado com edição, exclusão e importação de alunos.
  await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
  const administrador = await transacao.administrador.findUnique({
    where: { id: administradorId },
    select: { ativo: true },
  });
  if (!administrador?.ativo)
    throw new ErroGestaoSolicitacao("Acesso administrativo inválido.", 403);
}

async function obterSolicitacao(prisma, id) {
  const solicitacao = await prisma.solicitacao.findUnique({
    where: { id },
    include: { empresa: { select: { ativa: true } } },
  });
  if (!solicitacao)
    throw new ErroGestaoSolicitacao("Solicitação não encontrada.", 404);
  return solicitacao;
}

export async function alterarEstadoSolicitacao(
  prisma,
  administradorId,
  id,
  entrada,
) {
  const dados = validar(estadoSchema, entrada);
  if (dados.ativa)
    throw new ErroGestaoSolicitacao(
      "Solicitações finalizadas não podem ser reativadas.",
      409,
    );
  const resultado = await prisma.$transaction(
    async (transacao) => {
      await iniciarOperacao(transacao, administradorId);
      const atual = await obterSolicitacao(transacao, id);
      if (await encerrarSeVencida(transacao, atual)) return null;
      if (atual.ativa !== dados.ativaAnterior)
        throw new ErroGestaoSolicitacao(
          "A situação mudou. Confira os dados atualizados e tente novamente.",
          409,
        );
      if (!atual.ativa) {
        const { ativa, encerradaEm, motivoEncerramento } = atual;
        return { id, ativa, encerradaEm, motivoEncerramento };
      }
      return transacao.solicitacao.update({
        where: { id },
        data: {
          ativa: false,
          encerradaEm: new Date(),
          motivoEncerramento: "COORDENACAO",
        },
        select: {
          id: true,
          ativa: true,
          encerradaEm: true,
          motivoEncerramento: true,
        },
      });
    },
    { timeout: 30000, maxWait: 10000 },
  );
  if (!resultado)
    throw new ErroGestaoSolicitacao(
      "A solicitação já foi encerrada por falta de retorno.",
      409,
    );
  return resultado;
}

export async function listarIndicacoes(prisma, id, parametros = {}) {
  const { busca, pagina, paginaDisponiveis } = validar(
    z.object({
      busca: z.string().trim().max(150).default(""),
      pagina: paginaSchema,
      paginaDisponiveis: paginaSchema,
    }),
    parametros,
  );
  await encerrarSolicitacoesVencidas(prisma, { id });
  const solicitacao = await obterSolicitacao(prisma, id);
  const matricula = {
    select: {
      alunoId: true,
      aluno: { select: { nome: true, statusIndicacao: true } },
      turma: { select: { codigo: true, curso: { select: { nome: true } } } },
    },
  };
  const [participacoes, eventosAnteriores] = await Promise.all([
    prisma.participacaoSolicitacao.findMany({
      where: { solicitacaoId: id },
      select: { id: true, status: true, criadoEm: true, matricula },
    }),
    prisma.historicoAcompanhamento.findMany({
      where: {
        solicitacaoId: id,
        novoStatus: "INDICADO",
        matricula: {
          aluno: { participacoes: { none: { solicitacaoId: id } } },
        },
      },
      select: { id: true, registradoEm: true, matricula },
    }),
  ]);
  const situacoes = {
    INDICADO: "Indicado",
    EM_PROCESSO: "Em processo",
    APROVADO: "Aprovado — aguardando formalização",
    CONTRATADO: "Contratado",
    NAO_CONTRATADO: "Não contratado",
    DESISTIU: "Desistiu",
    CANCELADO: "Encerrado",
  };
  const indicacoes = [...participacoes, ...eventosAnteriores]
    .map(({ id, matricula, status, criadoEm, registradoEm }) => ({
      id,
      alunoId: matricula.alunoId,
      nome: matricula.aluno.nome,
      status: situacoes[status] ?? matricula.aluno.statusIndicacao,
      curso: matricula.turma.curso.nome,
      turma: matricula.turma.codigo,
      indicadoEm: criadoEm ?? registradoEm,
    }))
    .sort((a, b) => b.indicadoEm - a.indicadoEm);
  const estado = {
    ativa: solicitacao.ativa,
    encerradaEm: solicitacao.encerradaEm,
    motivoEncerramento: solicitacao.motivoEncerramento,
    indicacoes,
    pagina,
    paginaDisponiveis,
    tamanhoPagina,
  };
  if (!solicitacao.ativa)
    return {
      ...estado,
      alunos: [],
      disponiveis: [],
      total: 0,
      totalDisponiveis: 0,
    };
  const where = {
    ...filtrosDisponibilidade(
      id,
      indicacoes.map((item) => item.alunoId),
    ),
    ...(busca
      ? {
          OR: [
            { aluno: { nome: { contains: busca, mode: "insensitive" } } },
            {
              turma: {
                curso: { nome: { contains: busca, mode: "insensitive" } },
              },
            },
            { turma: { codigo: { contains: busca, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const matriculas = await prisma.matricula.findMany({
    where,
    orderBy: [{ aluno: { nome: "asc" } }, { id: "asc" }],
    select: {
      id: true,
      alunoId: true,
      aluno: {
        select: { nome: true, idade: true, dataNascimento: true, genero: true },
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
  const hoje = todayInSaoPaulo();
  const alunosPorId = new Map();
  for (const matricula of matriculas) {
    const recomendado = matriculaCompativel(solicitacao, matricula, hoje);
    const anterior = alunosPorId.get(matricula.alunoId);
    if (!anterior || (!anterior.recomendado && recomendado)) {
      alunosPorId.set(matricula.alunoId, {
        matriculaId: matricula.id,
        alunoId: matricula.alunoId,
        nome: matricula.aluno.nome,
        idade: idadeAluno(matricula.aluno, hoje),
        curso: matricula.turma.curso.nome,
        turma: matricula.turma.codigo,
        periodo: matricula.turma.turno,
        recomendado,
      });
    }
  }
  const disponiveis = [...alunosPorId.values()];
  const recomendados = disponiveis.filter((aluno) => aluno.recomendado);
  const paginar = (alunos, numero) =>
    alunos.slice((numero - 1) * tamanhoPagina, numero * tamanhoPagina);
  return {
    ...estado,
    total: recomendados.length,
    totalDisponiveis: disponiveis.length,
    alunos: paginar(recomendados, pagina),
    disponiveis: paginar(disponiveis, paginaDisponiveis),
  };
}

export async function indicarAlunos(prisma, administradorId, id, entrada) {
  const { matriculaIds } = validar(indicacaoSchema, entrada);
  if (new Set(matriculaIds).size !== matriculaIds.length)
    throw new ErroGestaoSolicitacao("A seleção contém matrículas repetidas.");
  const resultado = await prisma.$transaction(
    async (transacao) => {
      await iniciarOperacao(transacao, administradorId);
      const solicitacao = await obterSolicitacao(transacao, id);
      const agora = new Date();
      if (await encerrarSeVencida(transacao, solicitacao, agora)) return null;
      if (!solicitacao.ativa)
        throw new ErroGestaoSolicitacao(
          "Esta solicitação está finalizada e não recebe novas indicações.",
          409,
        );
      if (!solicitacao.empresa?.ativa)
        throw new ErroGestaoSolicitacao(
          "A empresa precisa estar ativa para receber indicações.",
          409,
        );
      const matriculas = await transacao.matricula.findMany({
        where: { id: { in: matriculaIds }, ...filtrosDisponibilidade(id) },
        include: {
          aluno: { select: selectAluno },
        },
      });
      if (matriculas.length !== matriculaIds.length)
        throw new ErroGestaoSolicitacao(
          "Um dos alunos não está mais disponível para esta solicitação. Atualize a lista.",
          409,
        );
      const alunoIds = matriculas.map((matricula) => matricula.alunoId);
      if (new Set(alunoIds).size !== alunoIds.length)
        throw new ErroGestaoSolicitacao(
          "Selecione apenas uma matrícula por aluno.",
        );
      const anteriores = await transacao.historicoAcompanhamento.count({
        where: {
          solicitacaoId: id,
          novoStatus: "INDICADO",
          matricula: { alunoId: { in: alunoIds } },
        },
      });
      if (anteriores)
        throw new ErroGestaoSolicitacao(
          "Um dos alunos já foi indicado para esta solicitação. Atualize a lista.",
          409,
        );
      for (const matricula of matriculas) {
        await registrarParticipacao(transacao, matricula, id, administradorId);
        await transacao.matricula.update({
          where: { id: matricula.id },
          data: { status: "INDICADO", empresaAtualId: solicitacao.idEmpresa },
        });
        const depois = await transacao.aluno.update({
          where: { id: matricula.alunoId },
          data: {
            statusIndicacao: "Indicado",
            empresaId: solicitacao.idEmpresa,
            empregado: false,
          },
          select: selectAluno,
        });
        await transacao.historicoAcompanhamento.create({
          data: {
            matriculaId: matricula.id,
            solicitacaoId: id,
            empresaId: solicitacao.idEmpresa,
            responsavelId: administradorId,
            tipo: "ALTERACAO_STATUS",
            statusAnterior: matricula.status,
            novoStatus: "INDICADO",
            origem: "SOLICITACAO",
            registradoEm: agora,
          },
        });
        await transacao.auditoriaAluno.create({
          data: {
            alunoId: matricula.alunoId,
            responsavelId: administradorId,
            acao: "EDITAR",
            dados: JSON.parse(
              JSON.stringify({
                antes: matricula.aluno,
                depois,
                solicitacaoId: id,
              }),
            ),
          },
        });
      }
      if (!solicitacao.primeiraIndicacaoEm)
        await transacao.solicitacao.update({
          where: { id },
          data: { primeiraIndicacaoEm: agora },
        });
      return { quantidade: matriculas.length };
    },
    { timeout: 30000, maxWait: 10000 },
  );
  if (!resultado)
    throw new ErroGestaoSolicitacao(
      "A solicitação já foi encerrada por falta de retorno.",
      409,
    );
  return resultado;
}
