import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alunos = await prisma.aluno.findMany({
      orderBy: {
        nome: "asc",
      },
      include: {
        empresa: {
          select: {
            nomeFantasia: true,
            razaoSocial: true,
          },
        },
      },
    });

    return NextResponse.json({
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
          aluno.empresa?.nomeFantasia ||
          aluno.empresa?.razaoSocial ||
          null,
        statusIndicacao: aluno.statusIndicacao,
        dataCadastro: aluno.dataCadastro,
        ultimaAtualizacao: aluno.ultimaAtualizacao,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar alunos:", error);

    return NextResponse.json(
      {
        mensagem: "Não foi possível carregar os alunos.",
      },
      {
        status: 500,
      }
    );
  }
}
