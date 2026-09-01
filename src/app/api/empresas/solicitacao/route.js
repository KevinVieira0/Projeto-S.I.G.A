
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const solicitacaoSchema = z.object({

  idEmpresa: z.coerce.string().min(1),
   
  idadeMinima: z.coerce.number().int().min(16),

  idadeMaxima: z.coerce.number().int().max(24),

  sexo: z.string().min(1),

  pratica: z.string().min(1).max(1000),

  cursos: z.string().min(1),

  inicio: z.coerce.date({
    message: "Data de início inválida",
  }),

  fim: z.coerce.date({
    message: "Data de fim inválida",
  }),

  quantidadeAlunos: z.coerce.number().int().min(1),

  observacoes: z.string().optional(),
});


export async function POST(request) {
  try {
    const body = await request.json();


    const resultado = solicitacaoSchema.safeParse(body);

    if (!resultado.success) {

      return NextResponse.json(
        {
          message: "Dados de solicitação inválidos.",
          errors: resultado.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }


    const {
      idEmpresa,
      idadeMinima,
      idadeMaxima,
      sexo,
      pratica,
      cursos,
      inicio,
      fim,
      quantidadeAlunos,
      observacoes,
    } = resultado.data;

    if (fim < inicio) {
      return NextResponse.json(
        {
          message: "A data de fim deve ser posterior à data de início.",
        },
        {
          status: 400,
        }
      );
    }
    
    

    const empresaExiste = await prisma.empresa.findUnique({
      where: { id: idEmpresa },
    });

    if (!empresaExiste) {
      return NextResponse.json(
        { message: "A empresa informada não existe." },
        { status: 404 }
      );
    }

    const solicitacao = await prisma.solicitacao.create({
      data: {
        idadeMinima,
        idadeMaxima,
        sexo,
        pratica,
        cursos,
        inicio,
        fim,
        quantidadeAlunos,
        observacoes,
        empresa: {
          connect: {
            id: idEmpresa,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Solicitação criada com sucesso.",
        solicitacao,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Erro ao criar solicitação:", error);

    return NextResponse.json(
      {
        message: "Erro ao criar solicitação.",
      },
      {
        status: 500,
      }
    );
  }
}
