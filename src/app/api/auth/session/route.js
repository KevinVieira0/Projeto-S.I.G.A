import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";

export const dynamic = "force-dynamic";

export async function GET(requisicao) {
  try {
    const { session: sessao, error: erroCapturado } = await authorize(requisicao);
    if (erroCapturado) return erroCapturado;
    return NextResponse.json(
      { session: sessao },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { mensagem: "Não foi possível verificar a sessão." },
      { status: 503 },
    );
  }
}
