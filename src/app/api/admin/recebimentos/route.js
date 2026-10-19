import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { ErroFonteAcademica } from "@/lib/importacao/googleSheetsAcademico";
import { ErroRecebimento } from "@/lib/importacao/recebimentos";
import { sincronizarRecebimentos } from "@/lib/importacao/sincronizarRecebimentos";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";
const json = (valor, status = 200) =>
  NextResponse.json(valor, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function GET(requisicao) {
  const { error: erroCapturado } = await authorize(requisicao, "admin");
  if (erroCapturado) return erroCapturado;
  const { searchParams: parametrosBusca } = new URL(requisicao.url);
  const tipo = parametrosBusca.get("tipo");
  if (!["ALUNO", "EMPRESA"].includes(tipo))
    return json({ mensagem: "Tipo inválido." }, 400);
  const pagina = Math.max(
    1,
    Math.min(10000, Number(parametrosBusca.get("pagina")) || 1),
  );
  if (!Number.isInteger(pagina))
    return json({ mensagem: "Página inválida." }, 400);
  try {
    const where = { tipo, estado: { in: ["INVALIDO", "PENDENTE"] } };
    const [linhas, total] = await Promise.all([
      prisma.recebimentoCadastro.findMany({
        where,
        orderBy: [{ recebidoEm: "desc" }, { id: "asc" }],
        skip: (pagina - 1) * 25,
        take: 25,
        select: {
          id: true,
          dados: true,
          erros: true,
          estado: true,
          recebidoEm: true,
        },
      }),
      prisma.recebimentoCadastro.count({ where }),
    ]);
    return json({
      total,
      pagina,
      itens: linhas.map((recebimento) => ({
        id: recebimento.id,
        nome: recebimento.dados.nome,
        documento: "•••" + recebimento.dados.documento.slice(-4),
        erros: recebimento.erros,
        estado: recebimento.estado,
        recebidoEm: recebimento.recebidoEm,
      })),
    });
  } catch {
    return json(
      {
        mensagem:
          "Não foi possível carregar recebimentos. Confira as migrations.",
      },
      500,
    );
  }
}

export async function POST(requisicao) {
  const { error: erroCapturado } = await authorize(requisicao, "admin");
  if (erroCapturado) return erroCapturado;
  try {
    return json(await sincronizarRecebimentos(prisma));
  } catch (e) {
    return json(
      {
        mensagem:
          e instanceof ErroRecebimento || e instanceof ErroFonteAcademica
            ? e.message
            : "Não foi possível ler os recebimentos. Confira o acesso à nova planilha.",
      },
      e instanceof ErroRecebimento ? e.status : 502,
    );
  }
}
