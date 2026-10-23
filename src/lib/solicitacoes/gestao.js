import { z } from "zod";
import { selectAluno } from "@/lib/alunos/gestao";
import { idadeAluno, matriculaCompativel } from "./requisitos";
import { todayInSaoPaulo } from "@/lib/validations/solicitacaoSchema";

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
  return prisma.$transaction(
    async (transacao) => {
      await iniciarOperacao(transacao, administradorId);
      const atual = await obterSolicitacao(transacao, id);
      if (atual.ativa !== dados.ativaAnterior)
        throw new ErroGestaoSolicitacao(
          "A situação mudou. Confira os dados atualizados e tente novamente.",
          409,
        );
      return transacao.solicitacao.update({
        where: { id },
        data: { ativa: dados.ativa },
        select: { id: true, ativa: true },
      });
    },
    { timeout: 30000, maxWait: 10000 },
  );
}

export async function listarIndicacoes(prisma, id, parametros = {}) {
  const { busca, pagina } = validar(
    z.object({
      busca: z.string().trim().max(150).default(""),
      pagina: z.coerce.number().int().min(1).max(100000).default(1),
    }),
    parametros,
  );
  const solicitacao = await obterSolicitacao(prisma, id);
  const eventos = await prisma.historicoAcompanhamento.findMany({
    where: { solicitacaoId: id, novoStatus: "INDICADO" },
    orderBy: [{ registradoEm: "desc" }, { id: "desc" }],
    select: {
      id: true,
      registradoEm: true,
      matricula: {
        select: {
          alunoId: true,
          aluno: { select: { nome: true, statusIndicacao: true } },
          turma: {
            select: { codigo: true, curso: { select: { nome: true } } },
          },
        },
      },
    },
  });
  const indicacoes = eventos.map((evento) => ({
    id: evento.id,
    alunoId: evento.matricula.alunoId,
    nome: evento.matricula.aluno.nome,
    status: evento.matricula.aluno.statusIndicacao,
    curso: evento.matricula.turma.curso.nome,
    turma: evento.matricula.turma.codigo,
    indicadoEm: evento.registradoEm,
  }));
  const tamanhoPagina = 20;
  if (!solicitacao.ativa)
    return {
      ativa: false,
      indicacoes,
      alunos: [],
      total: 0,
      pagina,
      tamanhoPagina,
    };
  const where = {
    status: "DISPONIVEL",
    classificacaoPendente: false,
    empresaAtualId: null,
    aluno: {
      arquivadoEm: null,
      empregado: false,
      statusIndicacao: "Disponível",
      empresaId: null,
      id: { notIn: indicacoes.map((item) => item.alunoId) },
    },
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
  // Filtra antes de paginar para manter totais corretos e aceitar diferenças de acentuação nos cursos.
  const compativeis = matriculas.filter((matricula) =>
    matriculaCompativel(solicitacao, matricula, hoje),
  );
  return {
    ativa: true,
    indicacoes,
    total: compativeis.length,
    pagina,
    tamanhoPagina,
    alunos: compativeis
      .slice((pagina - 1) * tamanhoPagina, pagina * tamanhoPagina)
      .map((matricula) => ({
        matriculaId: matricula.id,
        alunoId: matricula.alunoId,
        nome: matricula.aluno.nome,
        idade: idadeAluno(matricula.aluno, hoje),
        curso: matricula.turma.curso.nome,
        turma: matricula.turma.codigo,
        periodo: matricula.turma.turno,
      })),
  };
}

export async function indicarAlunos(prisma, administradorId, id, entrada) {
  const { matriculaIds } = validar(indicacaoSchema, entrada);
  if (new Set(matriculaIds).size !== matriculaIds.length)
    throw new ErroGestaoSolicitacao("A seleção contém matrículas repetidas.");
  return prisma.$transaction(
    async (transacao) => {
      await iniciarOperacao(transacao, administradorId);
      const solicitacao = await obterSolicitacao(transacao, id);
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
        where: { id: { in: matriculaIds } },
        include: {
          aluno: { select: selectAluno },
          turma: { select: { curso: { select: { nome: true } } } },
        },
      });
      if (matriculas.length !== matriculaIds.length)
        throw new ErroGestaoSolicitacao(
          "Uma matrícula não foi encontrada. Atualize a lista.",
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
      const hoje = todayInSaoPaulo();
      for (const matricula of matriculas) {
        const aluno = matricula.aluno;
        if (
          aluno.arquivadoEm ||
          aluno.empregado ||
          aluno.statusIndicacao !== "Disponível" ||
          aluno.empresaId ||
          matricula.status !== "DISPONIVEL" ||
          matricula.empresaAtualId ||
          matricula.classificacaoPendente
        ) {
          throw new ErroGestaoSolicitacao(
            "Um dos alunos não está mais disponível. Atualize a lista e selecione novamente.",
            409,
          );
        }
        if (!matriculaCompativel(solicitacao, matricula, hoje)) {
          throw new ErroGestaoSolicitacao(
            "Um dos alunos não atende aos requisitos da solicitação. Atualize a lista e selecione novamente.",
            409,
          );
        }
      }
      for (const matricula of matriculas) {
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
      return { quantidade: matriculas.length };
    },
    { timeout: 30000, maxWait: 10000 },
  );
}
