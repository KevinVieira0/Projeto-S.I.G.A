import { setSessionCookie } from "@/lib/auth/session";
import { validateMutationOrigin } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  cnpj: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .refine((valor) => /^\d{14}$/.test(valor), { message: "CNPJ inválido." }),
  senha: z.string().min(6, { message: "A senha deve possuir pelo menos 6 caracteres." }),
});

export async function POST(requisicao) {
  try {
    const erroOrigem = validateMutationOrigin(requisicao);
    if (erroOrigem) return erroOrigem;
    const corpo = await requisicao.json();
    const resultado = loginSchema.safeParse(corpo);
    if (!resultado.success) {
      return NextResponse.json(
        { mensagem: "Dados de login inválidos." },
        { status: 400 },
      );
    }
    const { cnpj, senha } = resultado.data;
    const empresa = await prisma.empresa.findUnique({
      where: { cnpj },
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
    if (!empresa || !empresa.ativa || !empresa.autorizada || !empresa.senhaHash) {
      return NextResponse.json({ mensagem: "CNPJ ou senha inválidos." }, { status: 401 });
    }
    const senhaCorreta = await compare(senha, empresa.senhaHash);
    if (!senhaCorreta) {
      return NextResponse.json({ mensagem: "CNPJ ou senha inválidos." }, { status: 401 });
    }
    const resposta = NextResponse.json({
      mensagem: "Login realizado com sucesso.",
      usuario: {
        id: empresa.id,
        cnpj: empresa.cnpj,
        razaoSocial: empresa.razaoSocial,
        nomeFantasia: empresa.nomeFantasia,
        role: "empresa",
      },
    });
    return setSessionCookie(resposta, "empresa", empresa);
  } catch (erroCapturado) {
    if (erroCapturado instanceof SyntaxError)
      return NextResponse.json({ mensagem: "JSON inválido." }, { status: 400 });
    console.error("Falha no login. Verifique a configuração do servidor.");
    return NextResponse.json(
      { mensagem: "Erro interno ao realizar login." },
      { status: 500 },
    );
  }
}
