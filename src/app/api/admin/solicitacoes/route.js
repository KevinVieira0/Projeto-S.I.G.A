import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth/authorize";
import {
  contarPorSituacao,
  solicitacoesPorMes,
} from "@/lib/dashboard/solicitacoesResumo";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { error } = await authorize(request, "admin");
    if (error) return error;

    const registros = await prisma.solicitacao.findMany({
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      include: {
        _count: {
          select: {
            eventosAcompanhamento: { where: { novoStatus: "INDICADO" } },
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
            cnpj: true,
            email: true,
            telefone: true,
          },
        },
      },
    });
    const solicitacoes = registros.map(({ _count, ...solicitacao }) => ({
      ...solicitacao,
      totalIndicados: _count.eventosAcompanhamento,
    }));

    return NextResponse.json({
      solicitacoes,
      analytics: {
        statusData: contarPorSituacao(solicitacoes).categorias,
        monthlyData: solicitacoesPorMes(solicitacoes),
      },
    });
  } catch (error) {
    console.error("Falha ao consultar solicitações:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as solicitações. Tente novamente." },
      { status: 500 },
    );
  }
}
