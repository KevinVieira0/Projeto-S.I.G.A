
import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";

export const dynamic = "force-dynamic";

export async function GET(requisicao) {
  try {
    const resultado = await authorize(requisicao, "empresa");

    if (resultado.error) {
      return resultado.error;
    }

    const empresa = resultado.session.dados;

    return NextResponse.json(
      { nome: empresa.nomeFantasia || empresa.razaoSocial },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erro) {
    console.error("Erro ao buscar empresa autenticada.");

    return NextResponse.json(
      { mensagem: "Erro ao buscar dados da empresa." },
      { status: 500 },
    );
  }
}
