
import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";

export async function GET(requisicao) {
  try {
    const resultado = await authorize(requisicao, "empresa");

    if (resultado.error) {
      return resultado.error;
    }

    const empresa = resultado.session.dados;

    const matriculas = await prisma.matricula.findMany({
      where: {
        empresaAtualId: empresa.id,
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            curso: true,
          },
        },
      },
    });

    const aprendizes = matriculas.map((matricula) => ({
      id: matricula.aluno.id,
      nome: matricula.aluno.nome,
      curso: matricula.aluno.curso,
      status: matricula.status,
      termo: matricula.termoAtual,
    }));

    return NextResponse.json({ aprendizes });
  } catch (erro) {
    console.error("Erro ao buscar aprendizes:", erro);

    return NextResponse.json(
      { mensagem: "Erro ao buscar os aprendizes." },
      { status: 500 },
    );
  }
}
