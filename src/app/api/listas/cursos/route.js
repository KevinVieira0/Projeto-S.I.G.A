import { NextResponse } from "next/server";
import { lerCursosDaPlanilha } from "@/lib/googleSheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const nomes = await lerCursosDaPlanilha();

    const cursos = nomes.map((curso) => ({
      value: curso,
      label: curso,
    }));

    return NextResponse.json({ cursos });
  } catch (error) {
    console.error(
      "Erro ao carregar cursos da planilha:",
      error.message
    );

    return NextResponse.json(
      {
        message: "Não foi possível carregar os cursos.",
      },
      {
        status: 500,
      }
    );
  }
}