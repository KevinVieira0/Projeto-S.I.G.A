import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import {
  consultarIndicadoresAlunos,
  consultarIndicadoresEmpresas,
} from "@/lib/dashboard/indicadores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(requisicao) {
  try {
    const { error: erroAutenticacao } = await authorize(requisicao, "admin");
    if (erroAutenticacao) return erroAutenticacao;
    const visao = new URL(requisicao.url).searchParams.get("visao");
    if (!["alunos", "empresas"].includes(visao)) {
      return NextResponse.json(
        { mensagem: "Visão inválida." },
        { status: 400 },
      );
    }
    const indicadores =
      visao === "alunos"
        ? await consultarIndicadoresAlunos(prisma)
        : await consultarIndicadoresEmpresas(prisma);
    return NextResponse.json(indicadores, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (erro) {
    console.error(
      "Erro ao carregar os indicadores do dashboard.",
      erro.code || erro.name,
    );
    return NextResponse.json(
      { mensagem: "Não foi possível carregar os indicadores." },
      { status: 500 },
    );
  }
}
