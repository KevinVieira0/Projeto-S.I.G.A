import { authorize } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIODOS_PERMITIDOS = new Set([7, 30, 90]);

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function consolidarStatusAlunos(grupos) {
  return grupos.reduce(
    (totais, grupo) => {
      const status = normalizarTexto(grupo.statusIndicacao);
      const quantidade = grupo._count._all;

      if (status === "indicado") {
        totais.indicados += quantidade;
      } else if (status === "em analise") {
        totais.emAnalise += quantidade;
      } else {
        // "Não indicado", valores antigos e status desconhecidos permanecem
        // disponíveis para tratamento pelo administrador.
        totais.naoIndicados += quantidade;
      }

      return totais;
    },
    {
      indicados: 0,
      emAnalise: 0,
      naoIndicados: 0,
    }
  );
}

export async function GET(request) {
  try {
    const { error: authError } = await authorize(request, "admin");
    if (authError) return authError;
    const { searchParams } = new URL(request.url);
    const periodo = Number(searchParams.get("periodo") || 30);

    if (!PERIODOS_PERMITIDOS.has(periodo)) {
      return NextResponse.json(
        {
          mensagem: "Período inválido. Utilize 7, 30 ou 90 dias.",
        },
        {
          status: 400,
        }
      );
    }

    const inicioDoPeriodo = new Date();
    inicioDoPeriodo.setDate(inicioDoPeriodo.getDate() - periodo);

    // Ainda não existe uma tabela de histórico de mudanças de status.
    // Por isso, alunos e empresas usam a última atualização como recorte.
    const filtroAlunos = {
      ultimaAtualizacao: {
        gte: inicioDoPeriodo,
      },
    };

    const filtroEmpresas = {
      atualizadoEm: {
        gte: inicioDoPeriodo,
      },
    };

    const filtroSolicitacoes = {
      criadoEm: {
        gte: inicioDoPeriodo,
      },
    };

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
        _count: {
          _all: true,
        },
      }),
      prisma.empresa.count({
        where: {
          ...filtroEmpresas,
          autorizada: true,
          ativa: true,
        },
      }),
      prisma.empresa.count({
        where: {
          ...filtroEmpresas,
          autorizada: false,
          ativa: true,
        },
      }),
      prisma.empresa.count({
        where: {
          ...filtroEmpresas,
          ativa: false,
        },
      }),
      prisma.solicitacao.count({
        where: filtroSolicitacoes,
      }),
      prisma.solicitacao.aggregate({
        where: filtroSolicitacoes,
        _sum: {
          quantidadeAlunos: true,
        },
      }),
    ]);

    const statusAlunos = consolidarStatusAlunos(alunosPorStatus);
    const totalAlunos =
      statusAlunos.indicados +
      statusAlunos.emAnalise +
      statusAlunos.naoIndicados;
    const totalEmpresas =
      empresasAutorizadas + empresasAguardando + empresasInativas;

    return NextResponse.json({
      periodo,
      criterio: {
        alunos: "ultimaAtualizacao",
        empresas: "atualizadoEm",
        solicitacoes: "criadoEm",
      },
      alunos: {
        total: totalAlunos,
        categorias: [
          {
            id: "indicados",
            label: "Indicados",
            valor: statusAlunos.indicados,
          },
          {
            id: "em-analise",
            label: "Em análise",
            valor: statusAlunos.emAnalise,
          },
          {
            id: "nao-indicados",
            label: "Não indicados",
            valor: statusAlunos.naoIndicados,
          },
        ],
        resumo: {
          indicados: statusAlunos.indicados,
          disponiveis: statusAlunos.naoIndicados,
        },
      },
      empresas: {
        total: totalEmpresas,
        categorias: [
          {
            id: "autorizadas",
            label: "Autorizadas",
            valor: empresasAutorizadas,
          },
          {
            id: "aguardando",
            label: "Aguardando",
            valor: empresasAguardando,
          },
          {
            id: "inativas",
            label: "Inativas",
            valor: empresasInativas,
          },
        ],
        resumo: {
          solicitacoes: quantidadeSolicitacoes,
          vagas: somaVagas._sum.quantidadeAlunos || 0,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao carregar o resumo do dashboard:", error);

    return NextResponse.json(
      {
        mensagem: "Não foi possível carregar os dados da visão geral.",
      },
      {
        status: 500,
      }
    );
  }
}
