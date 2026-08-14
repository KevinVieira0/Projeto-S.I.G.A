import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  cnpj: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^\d{14}$/.test(value), {
      message: "CNPJ inválido.",
    }),

  senha: z.string().min(6, {
    message: "A senha deve possuir pelo menos 6 caracteres.",
  }),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const resultado = loginSchema.safeParse(body);

    if (!resultado.success) {
      return NextResponse.json(
        {
          mensagem: "Dados de login inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    const { cnpj, senha } = resultado.data;

    const empresa = await prisma.empresa.findUnique({
      where: {
        cnpj,
      },

      select: {
        id: true,
        cnpj: true,
        razaoSocial: true,
        nomeFantasia: true,
        senhaHash: true,
        autorizada: true,
        ativa: true,
      },
    });

    if (
      !empresa ||
      !empresa.ativa ||
      !empresa.autorizada ||
      !empresa.senhaHash
    ) {
      return NextResponse.json(
        {
          mensagem: "CNPJ ou senha inválidos.",
        },
        {
          status: 401,
        }
      );
    }

    const senhaCorreta = await compare(senha, empresa.senhaHash);

    if (!senhaCorreta) {
      return NextResponse.json(
        {
          mensagem: "CNPJ ou senha inválidos.",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      mensagem: "Login realizado com sucesso.",

      usuario: {
        id: empresa.id,
        cnpj: empresa.cnpj,
        razaoSocial: empresa.razaoSocial,
        nomeFantasia: empresa.nomeFantasia,
        role: "empresa",
      },
    });
  } catch (error) {
    console.error("Erro no login da empresa:", error);

    return NextResponse.json(
      {
        mensagem: "Erro interno ao realizar login.",
      },
      {
        status: 500,
      }
    );
  }
}