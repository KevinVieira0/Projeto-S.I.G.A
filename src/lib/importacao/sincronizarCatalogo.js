import { ABAS_ACADEMICAS, validarBaseAcademica } from "./baseAcademica";
import { ErroRecebimento } from "./recebimentos";
import { obterTurma } from "./processarRecebimento";

export async function sincronizarCatalogo(prisma, abas) {
  const entrada = Object.fromEntries(
    Object.entries(ABAS_ACADEMICAS).map(([nome, cabecalhos]) => [
      nome,
      [cabecalhos],
    ]),
  );
  const validacao = validarBaseAcademica({
    ...entrada,
    Cursos: abas.Cursos,
    Turmas: abas.Turmas,
  });
  if (
    validacao.problemas.some((p) =>
      [
        "ABA_AUSENTE",
        "COLUNA_AUSENTE",
        "CABECALHO_DUPLICADO",
        "LIMITE_EXCEDIDO",
      ].includes(p.codigo),
    )
  )
    throw new ErroRecebimento("Estrutura do catálogo acadêmico incompatível.");
  const cursos = new Map(
    validacao.registros.Cursos.filter((c) => c.valido).map((c) => [
      c["ID Curso"],
      c,
    ]),
  );
  const turmas = validacao.registros.Turmas.filter((t) => t.valido);
  return prisma.$transaction(
    async (transacao) => {
      await transacao.$executeRaw`SELECT pg_advisory_xact_lock(741004)`;
      const catalogo = {
        cursos: await transacao.curso.findMany(),
        turmas: await transacao.turma.findMany(),
      };
      const anteriores = {
        cursos: catalogo.cursos.length,
        turmas: catalogo.turmas.length,
      };
      for (const turma of turmas) {
        const curso = cursos.get(turma["ID Curso"]);
        await obterTurma(
          transacao,
          {
            nome: curso["Nome do curso"],
            tipo: curso["Tipo de curso"],
            codigo: turma["Código da turma"],
            turno: turma.Turno,
            inicio: turma["Data de início"],
            fim: turma["Data de fim"],
            termos: turma["Quantidade total de termos"],
          },
          catalogo,
        );
      }
      return {
        cursos: cursos.size,
        turmas: turmas.length,
        cursosCriados: catalogo.cursos.length - anteriores.cursos,
        turmasCriadas: catalogo.turmas.length - anteriores.turmas,
        invalidos: validacao.totalProblemas,
      };
    },
    { timeout: 30000, maxWait: 10000 },
  );
}
