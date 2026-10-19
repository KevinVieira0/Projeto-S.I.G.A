import { NextResponse } from "next/server";
import { lerCursosParaSolicitacao } from "@/lib/listas/cursos";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const nomes = await lerCursosParaSolicitacao();
    const cursos = nomes.map((curso) => ({ value: curso, label: curso }));
    return NextResponse.json({ cursos });
  } catch (erroCapturado) {
    console.error("Erro ao carregar cursos da planilha:", erroCapturado.message);
    return NextResponse.json(
      { message: "Não foi possível carregar os cursos." },
      { status: 500 },
    );
  }
}
