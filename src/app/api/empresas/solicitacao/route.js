import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth/authorize";
import { lerCursosParaSolicitacao } from "@/lib/listas/cursos";
import {
  createSolicitacaoSchema,
  parseCivilDate,
} from "@/lib/validations/solicitacaoSchema";

export const runtime = "nodejs";

function invalido(resultado) {
  return NextResponse.json(
    { message: "Dados de solicitação inválidos.", errors: resultado.error.flatten() },
    { status: 400 },
  );
}

export async function POST(requisicao) {
  try {
    const { session: sessao, error: erroCapturado } = await authorize(
      requisicao,
      "empresa",
    );
    if (erroCapturado) return erroCapturado;
    let corpo;
    try {
      corpo = await requisicao.json();
    } catch {
      return NextResponse.json({ message: "JSON inválido." }, { status: 400 });
    }
    // A identidade da empresa vem da sessão; campos extras não podem substituí-la.
    const basic = createSolicitacaoSchema().safeParse(corpo);
    if (!basic.success) return invalido(basic);
    let cursos;
    try {
      cursos = await lerCursosParaSolicitacao();
    } catch {
      return NextResponse.json(
        { message: "Não foi possível validar os cursos. Tente novamente em instantes." },
        { status: 503 },
      );
    }
    const resultado = createSolicitacaoSchema(cursos).safeParse(basic.data);
    if (!resultado.success) return invalido(resultado);
    const { inicio, fim, ...valores } = resultado.data;
    const solicitacao = await prisma.solicitacao.create({
      data: {
        ...valores,
        periodoPratica: valores.pratica === "com" ? valores.periodoPratica : null,
        inicio: parseCivilDate(inicio),
        fim: parseCivilDate(fim),
        empresa: { connect: { id: sessao.dados.id } },
      },
      select: { id: true, criadoEm: true },
    });
    return NextResponse.json(
      { message: "Solicitação criada com sucesso.", solicitacao },
      { status: 201 },
    );
  } catch (erro) {
    console.error("Falha ao persistir solicitação.", erro);
    return NextResponse.json(
      { message: "Não foi possível gravar a solicitação. Tente novamente." },
      { status: 500 },
    );
  }
}
export async function GET(requisicao) {
  try {
    const { session: sessao, error: erroCapturado } = await authorize(
      requisicao,
      "empresa",
    );
    if (erroCapturado) return erroCapturado;

    const solicitacoes = await prisma.solicitacao.findMany({
      where: { idEmpresa: sessao.dados.id },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        cursos: true,
        idadeMinima: true,
        idadeMaxima: true,
        pratica: true,
        periodoPratica: true,
        inicio: true,
        fim: true,
        quantidadeVagas: true,
        ativa: true,
        criadoEm: true,
      },
    });

    return NextResponse.json({ solicitacoes });
  } catch (erro) {
    console.error("Falha ao listar solicitações.", erro);
    return NextResponse.json(
      { message: "Não foi possível carregar as solicitações." },
      { status: 500 },
    );
  }
}
