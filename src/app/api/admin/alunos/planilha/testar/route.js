import { NextResponse } from "next/server";
import { lerAlunosDaPlanilha } from "@/lib/googleSheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        mensagem: "Rota disponível somente em desenvolvimento.",
      },
      {
        status: 404,
      }
    );
  }

  try {
    const linhas = await lerAlunosDaPlanilha();

    const cabecalhos =
      linhas.length > 0 ? linhas[0] : [];

    const quantidadeAlunos = Math.max(
      linhas.length - 1,
      0
    );

    return NextResponse.json({
      mensagem: "Planilha acessada com sucesso.",
      aba: process.env.GOOGLE_SHEETS_ALUNOS_RANGE,
      quantidadeAlunos,
      cabecalhos,
    });
  } catch (error) {
    console.error(
      "Erro ao acessar o Google Sheets:",
      error.message
    );

    return NextResponse.json(
      {
        mensagem: "Não foi possível acessar a planilha.",
        erro: error.message,
      },
      {
        status: 500,
      }
    );
  }
}