import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { indicarAlunos, listarIndicacoes } from "@/lib/solicitacoes/gestao";

export const dynamic = "force-dynamic";
const json = (dados, status = 200) =>
  NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
const falha = (erro) =>
  json(
    {
      mensagem: erro.status
        ? erro.message
        : erro instanceof SyntaxError
          ? "JSON inválido."
          : "Não foi possível carregar ou salvar as indicações.",
    },
    erro.status || (erro instanceof SyntaxError ? 400 : 500),
  );

export async function GET(requisicao, { params }) {
  const { error } = await authorize(requisicao, "admin");
  if (error) return error;
  try {
    const busca = new URL(requisicao.url).searchParams;
    return json(
      await listarIndicacoes(prisma, params.id, {
        busca: busca.get("busca") || "",
        pagina: busca.get("pagina") || 1,
      }),
    );
  } catch (erro) {
    return falha(erro);
  }
}

export async function POST(requisicao, { params }) {
  const { error, session } = await authorize(requisicao, "admin");
  if (error) return error;
  try {
    return json(
      await indicarAlunos(
        prisma,
        session.dados.id,
        params.id,
        await requisicao.json(),
      ),
      201,
    );
  } catch (erro) {
    return falha(erro);
  }
}
