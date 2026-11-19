import { authorize } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { salvarAluno } from "@/lib/alunos/gestao";
import { tentarEspelharBase } from "@/lib/importacao/espelharBase";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(requisicao) {
  try {
    const { error: erroAutenticacao } = await authorize(requisicao, "admin");
    if (erroAutenticacao) return erroAutenticacao;
    const alunos = await prisma.aluno.findMany({
      where: { arquivadoEm: null },
      orderBy: { nome: "asc" },
      include: {
        empresa: { select: { nomeFantasia: true, razaoSocial: true } },
      },
    });
    return NextResponse.json(
      {
        alunos: alunos.map((aluno) => ({
          id: aluno.id,
          nome: aluno.nome,
          cpf: aluno.cpf,
          celular: aluno.celular,
          email: aluno.email,
          genero: aluno.genero,
          idade: aluno.idade,
          modalidade: aluno.modalidade,
          curso: aluno.curso,
          turma: aluno.turma,
          periodo: aluno.periodo,
          termo: aluno.termo,
          empregado: aluno.empregado,
          empresa:
            aluno.empresa?.nomeFantasia || aluno.empresa?.razaoSocial || null,
          statusIndicacao: aluno.statusIndicacao,
          dataCadastro: aluno.dataCadastro,
          ultimaAtualizacao: aluno.ultimaAtualizacao,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erroCapturado) {
    console.error("Erro ao listar alunos:", erroCapturado);
    return NextResponse.json(
      { mensagem: "Não foi possível carregar os alunos." },
      { status: 500 },
    );
  }
}

export async function POST(requisicao) {
  const { error: erroCapturado, session: sessao } = await authorize(
    requisicao,
    "admin",
  );
  if (erroCapturado) return erroCapturado;
  try {
    const saida = await salvarAluno(
      prisma,
      sessao.dados.id,
      await requisicao.json(),
    );
    return NextResponse.json(
      { ...saida, espelho: await tentarEspelharBase(prisma) },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        mensagem: e.status
          ? e.message
          : e instanceof SyntaxError
            ? "JSON inválido."
            : "Não foi possível cadastrar o aluno.",
      },
      { status: e.status || (e instanceof SyntaxError ? 400 : 500) },
    );
  }
}
