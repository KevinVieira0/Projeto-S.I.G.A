import { camposEmpresa, conferirIdEmpresa, ErroGestaoEmpresa } from "./gestao";

const limiteAlunos = 20;
const limiteSolicitacoes = 10;

export async function obterDetalhesEmpresa(prisma, id) {
  conferirIdEmpresa(id);
  return prisma.$transaction(
    async (transacao) => {
      const empresa = await transacao.empresa.findUnique({
        where: { id },
        select: { ...camposEmpresa, autorizada: true, senhaHash: true },
      });
      if (!empresa) throw new ErroGestaoEmpresa("Empresa não encontrada.", 404);
      const { senhaHash, autorizada, ...cadastro } = empresa;
      const filtroAlunos = { empresaId: id, arquivadoEm: null };
      const filtroContratos = {
        empresaAtualId: id,
        status: "CONTRATADO",
        aluno: { arquivadoEm: null },
      };
      const [
        alunos,
        grupos,
        solicitacoes,
        totalSolicitacoes,
        solicitacoesAtivas,
        matriculasEmpregadas,
        contratosConfirmados,
      ] = await Promise.all([
        transacao.aluno.findMany({
          where: filtroAlunos,
          orderBy: [{ nome: "asc" }, { id: "asc" }],
          take: limiteAlunos,
          select: {
            id: true,
            nome: true,
            curso: true,
            turma: true,
            statusIndicacao: true,
          },
        }),
        transacao.aluno.groupBy({
          by: ["statusIndicacao"],
          where: filtroAlunos,
          _count: { _all: true },
        }),
        transacao.solicitacao.findMany({
          where: { idEmpresa: id },
          orderBy: [{ criadoEm: "desc" }, { id: "asc" }],
          take: limiteSolicitacoes,
          select: {
            id: true,
            ativa: true,
            criadoEm: true,
            inicio: true,
            fim: true,
            quantidadeVagas: true,
            cursos: true,
            pratica: true,
          },
        }),
        transacao.solicitacao.count({ where: { idEmpresa: id } }),
        transacao.solicitacao.count({ where: { idEmpresa: id, ativa: true } }),
        transacao.matricula.count({ where: filtroContratos }),
        transacao.matricula.count({
          where: { ...filtroContratos, contratoConfirmado: true },
        }),
      ]);
      return {
        ...cadastro,
        acessoConfigurado: Boolean(autorizada && senhaHash),
        versao: empresa.atualizadoEm.toISOString(),
        alunos,
        solicitacoes,
        resumo: {
          totalAlunos: grupos.reduce(
            (total, grupo) => total + grupo._count._all,
            0,
          ),
          alunosPorStatus: Object.fromEntries(
            grupos.map((grupo) => [grupo.statusIndicacao, grupo._count._all]),
          ),
          totalSolicitacoes,
          solicitacoesAtivas,
          matriculasEmpregadas,
          contratosConfirmados,
        },
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 30000 },
  );
}
