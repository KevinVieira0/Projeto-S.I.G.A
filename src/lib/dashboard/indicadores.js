import { Prisma } from "@/generated/prisma/client";
import { filtrarIdsNoSql } from "@/lib/filtroIds";
import { contarSolicitacoesProximasDoPrazo } from "@/lib/solicitacoes/encerramento";
import { todayInSaoPaulo } from "@/lib/validations/solicitacaoSchema";
import { formatarDataCivil, solicitacoesPorMes } from "./solicitacoesResumo";
import { filtroAlunosDisponiveis } from "./statusAlunos";

const diaMs = 24 * 60 * 60 * 1000;
const semanasDoGrafico = 8;
const mesesDoGrafico = 6;

function semanasRecentes(agora) {
  const hoje = new Date(todayInSaoPaulo(agora));
  const diasDesdeSegunda = (hoje.getUTCDay() + 6) % 7;
  const segundaAtual = hoje.getTime() - diasDesdeSegunda * diaMs;

  return Array.from({ length: semanasDoGrafico }, (_, indice) => {
    const recuo = semanasDoGrafico - 1 - indice;
    const inicio = new Date(segundaAtual - 7 * recuo * diaMs);
    const fim = new Date(inicio.getTime() + 6 * diaMs);
    const de = formatarDataCivil(inicio).slice(0, 5);
    const ate = formatarDataCivil(fim).slice(0, 5);
    return {
      chave: inicio.toISOString().slice(0, 10),
      rotulo: de,
      rotuloCompleto: `${de} a ${ate}${recuo === 0 ? " · semana atual" : ""}`,
    };
  });
}

// As colunas timestamp do Prisma guardam instantes UTC sem informação de fuso.
function inicioCivilEmUtc(data) {
  return Prisma.sql`((${data}::date::timestamp AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'UTC')`;
}

function instanteEmSaoPaulo(coluna) {
  return Prisma.sql`((${coluna} AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')`;
}

function movimentosPorSemana(prisma, primeiraSemana, agora, alunosIds) {
  const corte = inicioCivilEmUtc(primeiraSemana);
  const instante = instanteEmSaoPaulo(Prisma.sql`instante`);
  const alunosDoRecorte = filtrarIdsNoSql(Prisma.sql`aluno_id`, alunosIds);
  return prisma.$queryRaw(Prisma.sql`
    SELECT TO_CHAR(DATE_TRUNC('week', ${instante}), 'YYYY-MM-DD') AS chave,
      COUNT(DISTINCT aluno_id) FILTER (WHERE movimento = 'indicacao')::int AS indicados,
      COUNT(DISTINCT aluno_id) FILTER (WHERE movimento = 'contratacao')::int AS contratados
    FROM (
      SELECT aluno_id, criado_em AS instante, 'indicacao' AS movimento
      FROM participacoes_solicitacao
      WHERE criado_em BETWEEN ${corte} AND ${agora}
      ${alunosDoRecorte}
      UNION ALL
      SELECT aluno_id, contratado_em AS instante, 'contratacao' AS movimento
      FROM participacoes_solicitacao
      WHERE contratado_em BETWEEN ${corte} AND ${agora}
      ${alunosDoRecorte}
    ) movimentos
    GROUP BY 1
  `);
}

export async function consultarIndicadoresAlunos(prisma, agora = new Date(), alunosIds) {
  const semanas = semanasRecentes(agora);
  const inicioDos30Dias = new Date(agora.getTime() - 30 * diaMs);
  const [aguardandoComprovante, [disponiveis], [contratacoes], movimentos] =
    await Promise.all([
      prisma.participacaoSolicitacao.count({
        where: {
          status: "APROVADO",
          contratadoEm: null,
          solicitacao: { ativa: true },
          aluno: { arquivadoEm: null },
          ...(alunosIds ? { alunoId: { in: alunosIds } } : {}),
        },
      }),
      prisma.$queryRaw(Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM alunos a
        LEFT JOIN LATERAL (
          SELECT MAX(h.registrado_em) AS desde
          FROM historico_acompanhamento h
          JOIN matriculas m ON m.id = h.matricula_id
          WHERE m.aluno_id = a.id AND h.tipo = 'ALTERACAO_STATUS'
            AND h.novo_status = 'DISPONIVEL'
            AND h.status_anterior IS DISTINCT FROM 'DISPONIVEL'
            AND h.registrado_em <= ${agora}
        ) historico ON true
        WHERE a.arquivado_em IS NULL AND NOT a.empregado AND a.empresa_id IS NULL
          AND a.status_indicacao = ${filtroAlunosDisponiveis.statusIndicacao}
          AND COALESCE(historico.desde, a.data_cadastro) < ${inicioDos30Dias}
          ${filtrarIdsNoSql(Prisma.sql`a.id`, alunosIds)}
      `),
      prisma.$queryRaw(Prisma.sql`
        SELECT COUNT(DISTINCT aluno_id)::int AS total
        FROM participacoes_solicitacao
        WHERE contratado_em BETWEEN ${inicioDos30Dias} AND ${agora}
        ${filtrarIdsNoSql(Prisma.sql`aluno_id`, alunosIds)}
      `),
      movimentosPorSemana(prisma, semanas[0].chave, agora, alunosIds),
    ]);

  const movimentoPorSemana = new Map(
    movimentos.map((linha) => [linha.chave, linha]),
  );
  return {
    atualizadoEm: agora,
    aguardandoComprovante,
    disponiveisHaMaisDe30Dias: disponiveis.total,
    contratadosEm30Dias: contratacoes.total,
    semanas: semanas.map((semana) => ({
      ...semana,
      indicados: movimentoPorSemana.get(semana.chave)?.indicados ?? 0,
      contratados: movimentoPorSemana.get(semana.chave)?.contratados ?? 0,
    })),
  };
}

function vagasEContratacoesPorMes(prisma, primeiroMes, agora, empresasIds) {
  const inicio = inicioCivilEmUtc(`${primeiroMes}-01`);
  const recebidoEm = instanteEmSaoPaulo(Prisma.sql`s."criadoEm"`);
  return prisma.$queryRaw(Prisma.sql`
    SELECT TO_CHAR(${recebidoEm}, 'YYYY-MM') AS chave,
      SUM(s."quantidadeAlunos")::int AS vagas,
      SUM(h.total)::int AS contratacoes
    FROM "Solicitacoes" s
    CROSS JOIN LATERAL (
      SELECT COUNT(*) AS total
      FROM participacoes_solicitacao p
      WHERE p.solicitacao_id = s.id AND p.contratado_em <= ${agora}
    ) h
    WHERE s."criadoEm" BETWEEN ${inicio} AND ${agora}
    ${filtrarIdsNoSql(Prisma.sql`s."idEmpresa"`, empresasIds)}
    GROUP BY 1
  `);
}

function cursosMaisSolicitados(prisma, primeiroMes, agora, empresasIds) {
  const inicio = inicioCivilEmUtc(`${primeiroMes}-01`);
  return prisma.$queryRaw(Prisma.sql`
    SELECT COALESCE(NULLIF(TRIM(cursos), ''), 'Curso não informado') AS curso,
      COUNT(*)::int AS solicitacoes,
      SUM("quantidadeAlunos")::int AS vagas
    FROM "Solicitacoes"
    WHERE "criadoEm" BETWEEN ${inicio} AND ${agora}
    ${filtrarIdsNoSql(Prisma.sql`"idEmpresa"`, empresasIds)}
    GROUP BY 1
    ORDER BY solicitacoes DESC, vagas DESC, curso ASC
    LIMIT 5
  `);
}

export async function consultarIndicadoresEmpresas(prisma, agora = new Date(), empresasIds) {
  const meses = solicitacoesPorMes([], { meses: mesesDoGrafico, agora });
  const empresasDoRecorte = empresasIds ? { idEmpresa: { in: empresasIds } } : {};
  const [vencemEm24Horas, semIndicacao, encerradasSemRetorno, volumes, cursos] =
    await Promise.all([
      contarSolicitacoesProximasDoPrazo(prisma, agora, empresasIds),
      prisma.solicitacao.aggregate({
        where: { ...empresasDoRecorte, ativa: true, primeiraIndicacaoEm: null },
        _count: { _all: true },
        _min: { criadoEm: true },
      }),
      prisma.solicitacao.count({
        where: {
          ...empresasDoRecorte,
          ativa: false,
          motivoEncerramento: "SEM_RETORNO",
          encerradaEm: {
            gte: new Date(agora.getTime() - 30 * diaMs),
            lte: agora,
          },
        },
      }),
      vagasEContratacoesPorMes(prisma, meses[0].chave, agora, empresasIds),
      cursosMaisSolicitados(prisma, meses.at(-3).chave, agora, empresasIds),
    ]);
  const volumePorMes = new Map(volumes.map((linha) => [linha.chave, linha]));
  return {
    atualizadoEm: agora,
    vencemEm24Horas,
    semPrimeiraIndicacao: semIndicacao._count._all,
    pedidoMaisAntigo: semIndicacao._min.criadoEm,
    encerradasSemRetorno,
    meses: meses.map(({ chave, rotulo, rotuloCompleto }) => ({
      chave,
      rotulo,
      rotuloCompleto,
      vagas: volumePorMes.get(chave)?.vagas ?? 0,
      contratacoes: volumePorMes.get(chave)?.contratacoes ?? 0,
    })),
    cursos,
  };
}
