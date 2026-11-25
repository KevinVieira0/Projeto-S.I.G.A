import { Prisma } from "@/generated/prisma/client";
import { filtrarIdsNoSql } from "@/lib/filtroIds";

const diasPrazo = 5;
const prazoMs = diasPrazo * 24 * 60 * 60 * 1000;
const limiteLote = 20;
const motivo = "Sem retorno ou contratação em cinco dias.";

const solicitacoesComPrazo = Prisma.sql`
  FROM "Solicitacoes" s
  CROSS JOIN LATERAL (
    SELECT s.primeira_indicacao_em + ${diasPrazo}::int * INTERVAL '1 day' AS fim
  ) prazo
`;

const semRetornoNoPrazo = Prisma.sql`
  NOT EXISTS (
    SELECT 1 FROM participacoes_solicitacao p
    WHERE p.solicitacao_id = s.id
      AND (
        p.contratado_em BETWEEN s.primeira_indicacao_em AND prazo.fim
        OR (p.status = 'CONTRATADO' AND p.contratado_em IS NULL)
      )
  )
  AND NOT EXISTS (
    SELECT 1 FROM participacoes_solicitacao p
    JOIN eventos_participacao e ON e.participacao_id = p.id
    WHERE p.solicitacao_id = s.id AND e.autor = 'EMPRESA'
      AND e.empresa_id = s."idEmpresa"
      AND e.registrado_em BETWEEN s.primeira_indicacao_em AND prazo.fim
  )
`;

function buscarVencidas(prisma, { agora, id, empresaId }) {
  return prisma.$queryRaw(Prisma.sql`
    SELECT s.id, s."idEmpresa", prazo.fim
    ${solicitacoesComPrazo}
    WHERE s.ativa
      AND s.primeira_indicacao_em <= ${new Date(agora.getTime() - prazoMs)}
      ${id ? Prisma.sql`AND s.id = ${id}` : Prisma.empty}
      ${empresaId ? Prisma.sql`AND s."idEmpresa" = ${empresaId}` : Prisma.empty}
      AND ${semRetornoNoPrazo}
    ORDER BY s.primeira_indicacao_em, s.id
    LIMIT ${limiteLote}
  `);
}

export async function contarSolicitacoesProximasDoPrazo(prisma, agora, empresasIds) {
  const umDiaMs = 24 * 60 * 60 * 1000;
  const limiteInferior = new Date(agora.getTime() - prazoMs);
  const limiteSuperior = new Date(limiteInferior.getTime() + umDiaMs);
  const [linha] = await prisma.$queryRaw(Prisma.sql`
    SELECT COUNT(*)::int AS total
    ${solicitacoesComPrazo}
    WHERE s.ativa
      AND s.primeira_indicacao_em > ${limiteInferior}
      AND s.primeira_indicacao_em <= ${limiteSuperior}
      ${filtrarIdsNoSql(Prisma.sql`s."idEmpresa"`, empresasIds)}
      AND ${semRetornoNoPrazo}
  `);
  return linha.total;
}

async function encerrar(tx, { id, idEmpresa, fim }) {
  await tx.solicitacao.update({
    where: { id },
    data: { ativa: false, encerradaEm: fim, motivoEncerramento: "SEM_RETORNO" },
  });
  const participacoes = await tx.participacaoSolicitacao.findMany({
    where: {
      solicitacaoId: id,
      status: { in: ["INDICADO", "EM_PROCESSO", "APROVADO"] },
    },
    select: { id: true, alunoId: true, status: true, matriculaId: true },
  });
  for (const participacao of participacoes) {
    await tx.participacaoSolicitacao.update({
      where: { id: participacao.id },
      data: {
        status: "CANCELADO",
        encerradoEm: fim,
        motivo,
        eventos: {
          create: {
            statusAnterior: participacao.status,
            novoStatus: "CANCELADO",
            autor: "SISTEMA",
            descricao: motivo,
            registradoEm: fim,
          },
        },
      },
    });
    const statusAnterior =
      participacao.status === "APROVADO" ? "EM_PROCESSO" : participacao.status;
    const { count } = await tx.matricula.updateMany({
      where: {
        id: participacao.matriculaId,
        empresaAtualId: idEmpresa,
        status: statusAnterior,
      },
      data: {
        empresaAtualId: null,
        status: "DISPONIVEL",
        contratoConfirmado: false,
        contratoAtualizadoEm: null,
      },
    });
    if (!count) continue;

    // Um vínculo ativo em outra matrícula pode ter sido mantido pela coordenação.
    await tx.aluno.updateMany({
      where: {
        id: participacao.alunoId,
        empresaId: idEmpresa,
        arquivadoEm: null,
        empregado: false,
        statusIndicacao:
          statusAnterior === "INDICADO" ? "Indicado" : "Em processo",
        matriculas: {
          none: {
            empresaAtualId: { not: null },
            status: { in: ["INDICADO", "EM_PROCESSO", "CONTRATADO"] },
          },
        },
      },
      data: { empresaId: null, statusIndicacao: "Disponível" },
    });
    await tx.historicoAcompanhamento.create({
      data: {
        solicitacaoId: id,
        matriculaId: participacao.matriculaId,
        empresaId: idEmpresa,
        tipo: "ALTERACAO_STATUS",
        statusAnterior,
        novoStatus: "DISPONIVEL",
        origem: "ENCERRAMENTO_SEM_RETORNO",
        registradoEm: fim,
      },
    });
  }
}

export async function encerrarSeVencida(tx, solicitacao, agora = new Date()) {
  if (
    !solicitacao.ativa ||
    !solicitacao.primeiraIndicacaoEm ||
    agora.getTime() - solicitacao.primeiraIndicacaoEm.getTime() < prazoMs
  )
    return false;

  const [vencida] = await buscarVencidas(tx, { id: solicitacao.id, agora });
  if (!vencida) return false;
  await encerrar(tx, vencida);
  return true;
}

export async function encerrarSolicitacoesVencidas(
  prisma,
  { agora = new Date(), id, empresaId } = {},
) {
  const filtro = { agora, id, empresaId };
  let total = 0;
  while ((await buscarVencidas(prisma, filtro)).length > 0) {
    total += await prisma.$transaction(
      async (tx) => {
        // Reconfere o prazo no mesmo bloqueio das indicações e dos retornos.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
        const vencidas = await buscarVencidas(tx, filtro);
        for (const vencida of vencidas) await encerrar(tx, vencida);
        return vencidas.length;
      },
      { timeout: 30000, maxWait: 10000 },
    );
  }
  return total;
}
