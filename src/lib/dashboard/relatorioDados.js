import { z } from "zod";
import {
  filtrarAlunosDaTabela,
  ordenarAlunosDaTabela,
} from "@/lib/alunos/filtrosTabela";
import {
  filtrarEmpresasDaTabela,
  ordemDaTabelaDeEmpresas,
  statusDasEmpresas,
} from "@/lib/empresas/filtrosTabela";
import {
  consultarIndicadoresAlunos,
  consultarIndicadoresEmpresas,
} from "./indicadores";
import { consolidarAlunosPorCurso } from "./alunosPorCurso";
import {
  consolidarStatusAlunos,
  filtroAlunosDisponiveis,
} from "./statusAlunos";
import { inicioDoPanorama, periodosPanorama } from "./periodoPanorama";
import { seriesDaVisao } from "./series";
import { resumirIndicadores } from "./resumoIndicadores";

const recortes = z
  .object({
    serie: z.number().int(),
    panorama: z.union([
      z.literal("todos"),
      z
        .number()
        .int()
        .refine((valor) => periodosPanorama.includes(valor)),
    ]),
    curso: z.enum(["todos", "disponiveis"]),
  })
  .strict();
const busca = z.string().trim().max(255);
export const relatorioSchema = z
  .discriminatedUnion("visao", [
    z
      .object({
        visao: z.literal("alunos"),
        recortes,
        filtro: z
          .object({
            busca,
            status: z.array(z.string().max(30)).max(50),
            ordenacao: z
              .object({
                key: z.enum([
                  "nome",
                  "genero",
                  "email",
                  "curso",
                  "turma",
                  "periodo",
                  "termo",
                  "empresa",
                  "statusIndicacao",
                ]),
                direction: z.enum(["asc", "desc"]),
              })
              .strict(),
          })
          .strict(),
      })
      .strict(),
    z
      .object({
        visao: z.literal("empresas"),
        recortes,
        filtro: z
          .object({
            busca: busca.max(150),
            status: z.enum(statusDasEmpresas),
          })
          .strict(),
      })
      .strict(),
  ])
  .refine(
    ({ visao, recortes }) =>
      seriesDaVisao[visao].periodos.includes(recortes.serie),
    {
      message: "Período inválido para esta visão.",
    },
  );

const rotuloStatus = (valor) =>
  valor === "Contratado" ? "Empregado" : valor || "Sem status";
const rotuloEmpresa = {
  todos: "Todas as situações",
  ativas: "Ativas",
  inativas: "Inativas",
  autorizadas: "Com acesso autorizado",
  aguardando: "Aguardando autorização",
};

async function dadosDosAlunos(prisma, filtro, recortes, agora) {
  const alunos = await prisma.aluno.findMany({
    where: { arquivadoEm: null },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      genero: true,
      email: true,
      cpf: true,
      curso: true,
      turma: true,
      periodo: true,
      termo: true,
      statusIndicacao: true,
      ultimaAtualizacao: true,
      empregado: true,
      empresaId: true,
      empresa: { select: { nomeFantasia: true, razaoSocial: true } },
    },
  });
  const selecionados = ordenarAlunosDaTabela(
    filtrarAlunosDaTabela(alunos, filtro.busca, filtro.status).map((aluno) => ({
      ...aluno,
      empresa:
        aluno.empresa?.nomeFantasia || aluno.empresa?.razaoSocial || null,
    })),
    filtro.ordenacao,
  );
  const indicadores = await consultarIndicadoresAlunos(
    prisma,
    agora,
    selecionados.map(({ id }) => id),
  );
  const inicio = inicioDoPanorama(recortes.panorama, agora);
  const categorias = consolidarStatusAlunos(
    selecionados
      .filter(({ ultimaAtualizacao }) => !inicio || ultimaAtualizacao >= inicio)
      .map(({ statusIndicacao }) => ({ statusIndicacao, _count: { _all: 1 } })),
  ).categorias;
  const alunosDoGrafico =
    recortes.curso === "disponiveis"
      ? selecionados.filter(
          ({ statusIndicacao, empregado, empresaId }) =>
            statusIndicacao === filtroAlunosDisponiveis.statusIndicacao &&
            !empregado &&
            !empresaId,
        )
      : selecionados;
  const { cursos } = consolidarAlunosPorCurso(
    alunosDoGrafico.map(({ curso, periodo }) => ({
      curso,
      periodo,
      _count: { _all: 1 },
    })),
  );
  return {
    indicadores,
    categorias,
    cursos: cursos.map(({ curso, total, turnos }) => ({
      rotulo: curso,
      valor: total,
      detalhe: turnos
        .map(({ turno, total }) => `${turno} ${total}`)
        .join(" | "),
    })),
    filtros: [
      `Busca: ${filtro.busca || "sem termo de busca"}`,
      `Status: ${filtro.status.map(rotuloStatus).join(", ") || "todos"}`,
    ],
    tabela: {
      titulo: "Alunos no recorte",
      colunas: [
        { rotulo: "Nome", largura: 0.32 },
        { rotulo: "Curso", largura: 0.35 },
        { rotulo: "Turno", largura: 0.14 },
        { rotulo: "Status", largura: 0.19 },
      ],
      linhas: selecionados.map(({ nome, curso, periodo, statusIndicacao }) => [
        nome,
        curso,
        periodo,
        rotuloStatus(statusIndicacao),
      ]),
    },
  };
}

async function dadosDasEmpresas(prisma, filtro, recortes, agora) {
  const selecionadas = await prisma.empresa.findMany({
    where: filtrarEmpresasDaTabela(filtro.busca, filtro.status),
    orderBy: ordemDaTabelaDeEmpresas,
    select: {
      id: true,
      razaoSocial: true,
      nomeFantasia: true,
      ativa: true,
      atualizadoEm: true,
    },
  });
  const indicadores = await consultarIndicadoresEmpresas(
    prisma,
    agora,
    selecionadas.map(({ id }) => id),
  );
  const inicio = inicioDoPanorama(recortes.panorama, agora);
  const cadastradas = selecionadas.filter(
    ({ atualizadoEm }) => !inicio || atualizadoEm >= inicio,
  );
  const ativas = cadastradas.filter(({ ativa }) => ativa).length;
  return {
    indicadores,
    categorias: [
      { label: "Ativas", valor: ativas },
      { label: "Inativas", valor: cadastradas.length - ativas },
    ],
    cursos: indicadores.cursos.map(({ curso, solicitacoes, vagas }) => ({
      rotulo: curso,
      valor: solicitacoes,
      detalhe: `${vagas} ${vagas === 1 ? "vaga" : "vagas"}`,
    })),
    filtros: [
      `Busca: ${filtro.busca || "sem termo de busca"}`,
      `Situação cadastral: ${rotuloEmpresa[filtro.status]}`,
    ],
    tabela: {
      titulo: "Empresas no recorte",
      colunas: [
        { rotulo: "Razão social", largura: 0.45 },
        { rotulo: "Nome fantasia", largura: 0.37 },
        { rotulo: "Situação", largura: 0.18 },
      ],
      linhas: selecionadas.map(({ razaoSocial, nomeFantasia, ativa }) => [
        razaoSocial,
        nomeFantasia,
        ativa ? "Ativa" : "Inativa",
      ]),
    },
  };
}

export async function montarDadosDoRelatorio(
  prisma,
  { visao, filtro, recortes },
  agora = new Date(),
) {
  const alunos = visao === "alunos";
  const consulta = alunos ? dadosDosAlunos : dadosDasEmpresas;
  const { indicadores, categorias, cursos, filtros, tabela } = await consulta(
    prisma,
    filtro,
    recortes,
    agora,
  );
  const { campo } = seriesDaVisao[visao];
  return {
    visao,
    geradoEm: agora,
    recortes,
    filtros,
    tabela,
    resumo: resumirIndicadores(visao, indicadores),
    pontos: indicadores[campo].slice(-recortes.serie),
    panorama: categorias.map(({ label, valor }) => ({ rotulo: label, valor })),
    cursos,
  };
}
