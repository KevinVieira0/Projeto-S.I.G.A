import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { criarEmpresa } from "@/lib/empresas/gestao";
import { tentarEspelharBase } from "@/lib/importacao/espelharBase";
import { filtrarEmpresasDaTabela, ordemDaTabelaDeEmpresas, statusDasEmpresas } from "@/lib/empresas/filtrosTabela";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function POST(requisicao) {
  const { error, session } = await authorize(requisicao, "admin");
  if (error) return error;
  try {
    const empresa = await criarEmpresa(
      prisma,
      session.dados.id,
      await requisicao.json(),
    );
    return NextResponse.json(
      { empresa, espelho: await tentarEspelharBase(prisma) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (erro) {
    const jsonInvalido = erro instanceof SyntaxError;
    return NextResponse.json(
      {
        mensagem: erro.status
          ? erro.message
          : jsonInvalido
            ? "JSON inválido."
            : "Não foi possível cadastrar a empresa.",
      },
      { status: erro.status || (jsonInvalido ? 400 : 500) },
    );
  }
}

export async function GET(requisicao) {
  const { error: erroCapturado } = await authorize(requisicao, "admin");
  if (erroCapturado) return erroCapturado;
  const parametros = new URL(requisicao.url).searchParams;
  const pagina = Number(parametros.get("pagina") || "1");
  const busca = (parametros.get("busca") || "").trim();
  const status = parametros.get("status") || "todos";
  if (
    !Number.isSafeInteger(pagina) ||
    pagina < 1 ||
    pagina > 1_000_000 ||
    busca.length > 150 ||
    !statusDasEmpresas.includes(status)
  ) {
    return NextResponse.json(
      { mensagem: "Filtros inválidos." },
      { status: 400 },
    );
  }
  const where = filtrarEmpresasDaTabela(busca, status);
  try {
    const [total, itens] = await prisma.$transaction(
      [
        prisma.empresa.count({ where }),
        prisma.empresa.findMany({
          where,
          orderBy: ordemDaTabelaDeEmpresas,
          skip: (pagina - 1) * 25,
          take: 25,
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
            cnpj: true,
            email: true,
            telefone: true,
            contribuinte: true,
            ativa: true,
            autorizada: true,
            atualizadoEm: true,
          },
        }),
      ],
      { isolationLevel: "RepeatableRead" },
    );
    return NextResponse.json(
      { itens, total, pagina, tamanhoPagina: 25 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { mensagem: "Não foi possível carregar as empresas." },
      { status: 500 },
    );
  }
}
