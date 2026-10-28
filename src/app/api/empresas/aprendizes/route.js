import { z } from "zod";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";

export const dynamic = "force-dynamic";

const filtrosSchema = z.object({
  situacao: z
    .enum(["todos", "INDICADO", "EM_PROCESSO", "CONTRATADO"])
    .default("CONTRATADO"),
  pagina: z.coerce.number().int().min(1).max(100000).default(1),
  busca: z.string().trim().max(150).default(""),
});
export async function GET(requisicao) {
  const { error, session } = await authorize(requisicao, "empresa");
  if (error) return error;
  const filtros = filtrosSchema.safeParse(
    Object.fromEntries(new URL(requisicao.url).searchParams),
  );
  if (!filtros.success)
    return jsonEmpresa({ mensagem: "Filtros inválidos." }, 400);
  const { situacao, pagina, busca } = filtros.data;
  const empresaId = session.dados.id;
  const where = {
    empresaAtualId: empresaId,
    status:
      situacao === "todos"
        ? { in: ["INDICADO", "EM_PROCESSO", "CONTRATADO"] }
        : situacao,
    aluno: { arquivadoEm: null },
    ...(busca
      ? {
          OR: [
            { aluno: { nome: { contains: busca, mode: "insensitive" } } },
            {
              turma: {
                curso: { nome: { contains: busca, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
  };
  try {
    const { total, matriculas } = await prisma.$transaction(
      async (tx) => ({
        total: await tx.matricula.count({ where }),
        matriculas: await tx.matricula.findMany({
          where,
          orderBy: [{ aluno: { nome: "asc" } }, { id: "asc" }],
          take: 25,
          skip: (pagina - 1) * 25,
          select: {
            id: true,
            status: true,
            termoAtual: true,
            aluno: { select: { id: true, nome: true } },
            turma: {
              select: {
                codigo: true,
                turno: true,
                curso: { select: { nome: true } },
              },
            },
            participacoes: {
              where: {
                solicitacao: { idEmpresa: empresaId },
                status: {
                  in: ["INDICADO", "EM_PROCESSO", "APROVADO", "CONTRATADO"],
                },
              },
              orderBy: { criadoEm: "desc" },
              take: 1,
              select: { id: true, solicitacaoId: true, status: true },
            },
          },
        }),
      }),
      { isolationLevel: "RepeatableRead" },
    );
    return jsonEmpresa({
      total,
      pagina,
      tamanhoPagina: 25,
      aprendizes: matriculas.map((m) => ({
        id: m.aluno.id,
        matriculaId: m.id,
        nome: m.aluno.nome,
        curso: m.turma.curso.nome,
        turma: m.turma.codigo,
        turno: m.turma.turno,
        termo: m.termoAtual,
        status: m.participacoes[0]?.status || m.status,
        participacaoId: m.participacoes[0]?.id || null,
        solicitacaoId: m.participacoes[0]?.solicitacaoId || null,
      })),
    });
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
