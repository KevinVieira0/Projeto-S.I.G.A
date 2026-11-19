import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

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
    !["todos", "ativas", "autorizadas", "aguardando", "inativas"].includes(status)
  ) {
    return NextResponse.json({ mensagem: "Filtros inválidos." }, { status: 400 });
  }
  const filtroStatus = {
    todos: {},
    ativas: { ativa: true },
    autorizadas: { ativa: true, autorizada: true },
    aguardando: { ativa: true, autorizada: false },
    inativas: { ativa: false },
  }[status];
  const where = {
    ...filtroStatus,
    ...(busca
      ? {
          OR: ["razaoSocial", "nomeFantasia", "cnpj", "email"].map((campo) => ({
            [campo]: {
              contains:
                campo === "cnpj" && /^[\d.\/\-\s]+$/.test(busca)
                  ? busca.replace(/\D/g, "") || busca
                  : busca,
              mode: "insensitive",
            },
          })),
        }
      : {}),
  };
  try {
    const [total, itens] = await prisma.$transaction(
      [
        prisma.empresa.count({ where }),
        prisma.empresa.findMany({
          where,
          orderBy: [{ razaoSocial: "asc" }, { id: "asc" }],
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
