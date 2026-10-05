import { createHash, randomUUID } from "node:crypto";

const limpar = (valor) =>
  String(valor ?? "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");
const normalizar = (valor) => limpar(valor).toLocaleLowerCase("pt-BR");
const hash = (valor) => createHash("sha256").update(JSON.stringify(valor)).digest("hex");

export function classificarLegado(aluno) {
  const nome = normalizar(aluno.statusIndicacao);
  const empresa = aluno.empresaId || null;
  // Não indicado não comprova disponibilidade; em análise não comprova seleção.
  if (nome === "disponível" && !empresa && !aluno.empregado) return "DISPONIVEL";
  if (nome === "indicado" && empresa && !aluno.empregado) return "INDICADO";
  if (nome === "em processo" && empresa && !aluno.empregado) return "EM_PROCESSO";
  if (nome === "contratado" && empresa && aluno.empregado) return "CONTRATADO";
  return null;
}

export function prepararLegado(aluno) {
  const dados = {
    curso: aluno.curso,
    modalidade: aluno.modalidade,
    turma: aluno.turma,
    periodo: aluno.periodo,
    termo: aluno.termo,
    statusIndicacao: aluno.statusIndicacao,
    empregado: aluno.empregado,
    empresaId: aluno.empresaId,
  };
  const curso = limpar(aluno.curso);
  const tipoCurso = limpar(aluno.modalidade);
  const codigo = limpar(aluno.turma);
  const turnoOriginal = limpar(aluno.periodo);
  const turno =
    {
      matutino: "Manhã",
      manhã: "Manhã",
      vespertino: "Tarde",
      tarde: "Tarde",
      noturno: "Noite",
      noite: "Noite",
      integral: "Integral",
    }[normalizar(turnoOriginal)] || turnoOriginal;
  const valido = Boolean(
    curso &&
      tipoCurso &&
      codigo &&
      turno &&
      Number.isInteger(aluno.termo) &&
      aluno.termo > 0,
  );
  const chaveCurso = hash([normalizar(curso), normalizar(tipoCurso)]);
  // Legado não contém datas de oferta. O prefixo impede fusão automática com turmas futuras.
  const chaveTurma = hash([
    "LEGADO_SEM_DATAS",
    chaveCurso,
    normalizar(codigo),
    normalizar(turno),
  ]);
  return {
    valido,
    curso,
    tipoCurso,
    codigo,
    turno,
    chaveCurso,
    chaveTurma,
    dados,
    hashLegado: hash(dados),
    status: classificarLegado(aluno),
  };
}
const camposLegado = {
  id: true,
  curso: true,
  modalidade: true,
  turma: true,
  periodo: true,
  termo: true,
  statusIndicacao: true,
  empregado: true,
  empresaId: true,
};

// Não chama serviços externos nem modifica alunos, empresas, solicitações ou autenticação.
// Uma única transação garante aplicação integral ou rollback; leituras/gravações são paginadas.

export async function migrarBaseAcademica(
  prisma,
  { aplicar = false, lote = 200, timeout: tempoLimite = 300000 } = {},
) {
  if (!Number.isInteger(lote) || lote < 1 || lote > 1000)
    throw new Error("Lote deve ser inteiro entre 1 e 1000.");
  return prisma.$transaction(
    async (transacao) => {
      if (!aplicar) await transacao.$executeRaw`SET TRANSACTION READ ONLY`;
      if (aplicar) {
        const [bloqueio] =
          await transacao.$queryRaw`SELECT pg_try_advisory_xact_lock(20261001, 2) AS adquirido`;
        if (!bloqueio.adquirido)
          throw new Error("Já existe uma migração acadêmica em andamento.");
      }
      const resumo = {
        modo: aplicar ? "APLICACAO" : "SIMULACAO",
        alunosLidos: 0,
        cursosNovos: 0,
        turmasNovas: 0,
        matriculasNovas: 0,
        classificadas: 0,
        classificacaoPendente: 0,
        cadastrosIncompletos: 0,
        jaMigradas: 0,
        divergenciasLegado: 0,
      };
      const cursos = new Map(
        (await transacao.curso.findMany({ select: { id: true, chave: true } })).map(
          (curso) => [curso.chave, curso.id],
        ),
      );
      const turmas = new Map(
        (await transacao.turma.findMany({ select: { id: true, chave: true } })).map(
          (t) => [t.chave, t.id],
        ),
      );
      let cursor;
      while (true) {
        const alunos = await transacao.aluno.findMany({
          select: camposLegado,
          orderBy: { id: "asc" },
          take: lote,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        if (!alunos.length) break;
        const existentes = new Map(
          (
            await transacao.matricula.findMany({
              where: { chaveLegado: { in: alunos.map((a) => `aluno:${a.id}`) } },
              select: { id: true, chaveLegado: true, hashLegado: true },
            })
          ).map((m) => [m.chaveLegado, m]),
        );
        const novosCursos = [];
        const novasTurmas = [];
        const matriculas = [];
        const eventos = [];
        const pendencias = [];
        for (const aluno of alunos) {
          resumo.alunosLidos++;
          const dados = prepararLegado(aluno);
          const chaveLegado = `aluno:${aluno.id}`;
          const existente = existentes.get(chaveLegado);
          if (existente) {
            resumo.jaMigradas++;
            if (existente.hashLegado !== dados.hashLegado) {
              resumo.divergenciasLegado++;
              pendencias.push({
                id: randomUUID(),
                chave: `divergencia:${aluno.id}:${dados.hashLegado}`,
                codigo: "LEGADO_ALTERADO",
                alunoId: aluno.id,
                matriculaId: existente.id,
                descricao:
                  "Dados acadêmicos/operacionais do legado mudaram após a carga. Conciliar antes da troca das APIs; a matrícula nova não foi sobrescrita.",
              });
            }
            continue;
          }
          if (!dados.valido) {
            resumo.cadastrosIncompletos++;
            pendencias.push({
              id: randomUUID(),
              chave: `cadastro:${aluno.id}`,
              codigo: "CADASTRO_INCOMPLETO",
              alunoId: aluno.id,
              descricao:
                "Curso, modalidade, turma, turno ou termo atual inválido/ausente. Nenhuma matrícula criada.",
            });
            continue;
          }
          let cursoId = cursos.get(dados.chaveCurso);
          if (!cursoId) {
            cursoId = randomUUID();
            cursos.set(dados.chaveCurso, cursoId);
            novosCursos.push({
              id: cursoId,
              chave: dados.chaveCurso,
              nome: dados.curso,
              tipoCurso: dados.tipoCurso,
            });
            resumo.cursosNovos++;
          }
          let turmaId = turmas.get(dados.chaveTurma);
          if (!turmaId) {
            turmaId = randomUUID();
            turmas.set(dados.chaveTurma, turmaId);
            novasTurmas.push({
              id: turmaId,
              chave: dados.chaveTurma,
              cursoId,
              codigo: dados.codigo,
              turno: dados.turno,
              origem: "MIGRACAO_LEGADO",
            });
            pendencias.push({
              id: randomUUID(),
              chave: `turma:${turmaId}`,
              codigo: "OFERTA_SEM_DATAS",
              turmaId,
              descricao:
                "Legado sem datas acadêmicas e sem duração total. Confirmar oferta e quantidade de termos; não usar data de cadastro como início do curso.",
            });
            resumo.turmasNovas++;
          }
          const matriculaId = randomUUID();
          const empresaAtualId = dados.status ? aluno.empresaId : null;
          matriculas.push({
            id: matriculaId,
            alunoId: aluno.id,
            turmaId,
            termoAtual: aluno.termo,
            status: dados.status,
            classificacaoPendente: !dados.status,
            empresaAtualId,
            chaveLegado,
            hashLegado: dados.hashLegado,
            dadosLegado: dados.dados,
          });
          eventos.push({
            id: randomUUID(),
            matriculaId,
            empresaId: empresaAtualId,
            tipo: "CARGA_INICIAL",
            novoStatus: dados.status,
            origem: "MIGRACAO_LEGADO",
            chaveMigracao: chaveLegado,
          });
          resumo.matriculasNovas++;
          if (dados.status) resumo.classificadas++;
          else {
            resumo.classificacaoPendente++;
            pendencias.push({
              id: randomUUID(),
              chave: `status:${matriculaId}`,
              codigo: "STATUS_SEM_CORRESPONDENCIA",
              alunoId: aluno.id,
              matriculaId,
              descricao:
                "Status/vínculo antigo sem correspondência segura. Consultar dadosLegado e classificar explicitamente; ausência de empresa não comprova disponibilidade.",
            });
          }
        }
        if (aplicar) {
          if (novosCursos.length) await transacao.curso.createMany({ data: novosCursos });
          if (novasTurmas.length) await transacao.turma.createMany({ data: novasTurmas });
          if (matriculas.length)
            await transacao.matricula.createMany({ data: matriculas });
          if (eventos.length)
            await transacao.historicoAcompanhamento.createMany({ data: eventos });
          if (pendencias.length)
            await transacao.pendenciaMigracao.createMany({
              data: pendencias,
              skipDuplicates: true,
            });
        }
        cursor = alunos[alunos.length - 1].id;
      }
      resumo.pendenciasAbertasNoBanco = await transacao.pendenciaMigracao.count({
        where: { resolvidaEm: null },
      });
      return resumo;
    },
    { isolationLevel: "RepeatableRead", maxWait: 10000, timeout: tempoLimite },
  );
}
