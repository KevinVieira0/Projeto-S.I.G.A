import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import {
  montarDadosDoRelatorio,
  relatorioSchema,
} from "@/lib/dashboard/relatorioDados";
import { gerarRelatorioPdf } from "@/lib/dashboard/relatorioPdf";
import { todayInSaoPaulo } from "@/lib/validations/solicitacaoSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(requisicao) {
  try {
    const { error: erroAutenticacao } = await authorize(requisicao, "admin");
    if (erroAutenticacao) return erroAutenticacao;
    const entrada = await requisicao.json().catch(() => null);
    const validacao = relatorioSchema.safeParse(entrada);
    if (!validacao.success) {
      return NextResponse.json(
        { mensagem: "Filtros ou períodos inválidos." },
        { status: 400 },
      );
    }
    const agora = new Date();
    const dados = await prisma.$transaction(
      (tx) => montarDadosDoRelatorio(tx, validacao.data, agora),
      { isolationLevel: "RepeatableRead", timeout: 20000 },
    );
    const nome = `siga-relatorio-${dados.visao}-${todayInSaoPaulo(agora)}.pdf`;
    return new NextResponse(gerarRelatorioPdf(dados), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nome}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (erro) {
    console.error(
      "Falha ao gerar relatório do dashboard.",
      erro.code || erro.name,
    );
    return NextResponse.json(
      { mensagem: "Não foi possível gerar o relatório." },
      { status: 500 },
    );
  }
}
