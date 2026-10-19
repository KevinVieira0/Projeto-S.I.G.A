import { consolidarStatusAlunos } from "@/lib/dashboard/statusAlunos";
import { authorize } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";
const PERIODOS_PERMITIDOS = new Set([7, 30, 90]);

export async function GET(requisicao) {
  try {
    const { error: erroAutenticacao } = await authorize(requisicao, "admin");
    if (erroAutenticacao) return erroAutenticacao;
    const { searchParams: parametrosBusca } = new URL(requisicao.url);
    const parametroPeriodo = parametrosBusca.get("periodo") || "30";
    const periodo = parametroPeriodo === "todos" ? "todos" : Number(parametroPeriodo);
    const todoPeriodo = periodo === "todos";
    if (!todoPeriodo && !PERIODOS_PERMITIDOS.has(periodo)) {
      return NextResponse.json(
        { mensagem: "Período inválido. Utilize todos, 7, 30 ou 90 dias." },
        { status: 400 },
      );
    }
    const inicioDoPeriodo = new Date();
    if (!todoPeriodo) inicioDoPeriodo.setDate(inicioDoPeriodo.getDate() - periodo);

    // Retrato dos cadastros atualizados no período.
    // Não representa o número de transições no histórico de matrículas.
    const filtroAlunos = todoPeriodo
      ? { arquivadoEm: null }
      : { arquivadoEm: null, ultimaAtualizacao: { gte: inicioDoPeriodo } };
    const filtroEmpresas = todoPeriodo ? {} : { atualizadoEm: { gte: inicioDoPeriodo } };
    const filtroSolicitacoes = todoPeriodo ? {} : { criadoEm: { gte: inicioDoPeriodo } };
    const [
      alunosPorStatus,
      empresasAutorizadas,
      empresasAguardando,
      empresasInativas,
      quantidadeSolicitacoes,
      somaVagas,
    ] = await Promise.all([
      prisma.aluno.groupBy({
        by: ["statusIndicacao"],
        where: filtroAlunos,
        _count: { _all: true },
      }),
      prisma.empresa.count({
        where: { ...filtroEmpresas, autorizada: true, ativa: true },
      }),
      prisma.empresa.count({
        where: { ...filtroEmpresas, autorizada: false, ativa: true },
      }),
      prisma.empresa.count({ where: { ...filtroEmpresas, ativa: false } }),
      prisma.solicitacao.count({ where: filtroSolicitacoes }),
      prisma.solicitacao.aggregate({
        where: filtroSolicitacoes,
        _sum: { quantidadeAlunos: true },
      }),
    ]);
    const statusAlunos = consolidarStatusAlunos(alunosPorStatus);
    const totalEmpresas = empresasAutorizadas + empresasAguardando + empresasInativas;
    return NextResponse.json(
      {
        periodo,
        criterio: {
          alunos: todoPeriodo ? "todos" : "ultimaAtualizacao",
          empresas: todoPeriodo ? "todos" : "atualizadoEm",
          solicitacoes: todoPeriodo ? "todos" : "criadoEm",
        },
        alunos: statusAlunos,
        empresas: {
          total: totalEmpresas,
          categorias: [
            {
              id: "ativas",
              label: "Ativas",
              valor: empresasAutorizadas + empresasAguardando,
            },
            { id: "inativas", label: "Inativas", valor: empresasInativas },
          ],
          resumo: {
            solicitacoes: quantidadeSolicitacoes,
            vagas: somaVagas._sum.quantidadeAlunos || 0,
          },
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erroCapturado) {
    console.error("Erro ao carregar o resumo do dashboard:", erroCapturado);
    return NextResponse.json(
      { mensagem: "Não foi possível carregar os dados da visão geral." },
      { status: 500 },
    );
  }
}
