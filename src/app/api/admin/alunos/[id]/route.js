import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { salvarAluno, excluirAluno, selectAluno } from "@/lib/alunos/gestao";
import { tentarEspelharBase } from "@/lib/importacao/espelharBase";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";
const json = (dados, status = 200) =>
  NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function GET(requisicao, { params: parametros }) {
  const { error: erroCapturado } = await authorize(requisicao, "admin");
  if (erroCapturado) return erroCapturado;
  try {
    const aluno = await prisma.aluno.findUnique({
      where: { id: parametros.id },
      select: {
        ...selectAluno,
        empresa: { select: { razaoSocial: true, nomeFantasia: true } },
        matriculas: {
          include: { turma: { include: { curso: true } } },
          orderBy: { atualizadoEm: "desc" },
        },
      },
    });
    if (!aluno || aluno.arquivadoEm)
      return json({ mensagem: "Aluno não encontrado." }, 404);
    const atual = aluno.matriculas.find(
      (m) =>
        m.turma.codigo === aluno.turma &&
        m.turma.curso.nome === aluno.curso &&
        m.turma.turno === aluno.periodo,
    );
    return json({
      aluno: {
        ...aluno,
        turmaId: atual?.turmaId || null,
        versao: aluno.ultimaAtualizacao.toISOString(),
      },
    });
  } catch {
    return json({ mensagem: "Não foi possível carregar o aluno." }, 500);
  }
}

async function alterar(requisicao, parametros, excluir) {
  const { error: erroCapturado, session: sessao } = await authorize(
    requisicao,
    "admin",
  );
  if (erroCapturado) return erroCapturado;
  try {
    const corpo = await requisicao.json();
    if (!corpo || typeof corpo.versao !== "string")
      return json({ mensagem: "Reabra o aluno antes de alterar." }, 400);
    const { versao, ...dados } = corpo;
    if (excluir && Object.keys(dados).length)
      return json({ mensagem: "Dados de exclusão inválidos." }, 400);
    const saida = excluir
      ? await excluirAluno(prisma, sessao.dados.id, parametros.id, versao)
      : await salvarAluno(
          prisma,
          sessao.dados.id,
          dados,
          parametros.id,
          versao,
        );
    return json({ ...saida, espelho: await tentarEspelharBase(prisma) });
  } catch (e) {
    return json(
      {
        mensagem: e.status
          ? e.message
          : e instanceof SyntaxError
            ? "JSON inválido."
            : "Não foi possível concluir a alteração.",
      },
      e.status || (e instanceof SyntaxError ? 400 : 500),
    );
  }
}

export const PATCH = (requisicao, { params: parametros }) =>
  alterar(requisicao, parametros, false);

export const DELETE = (requisicao, { params: parametros }) =>
  alterar(requisicao, parametros, true);
