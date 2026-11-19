import { setSessionCookie } from "@/lib/auth/session";
import { validateMutationOrigin } from "@/lib/auth/authorize";
import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().email(),
  senha: z.string().min(6),
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
    const email = resultado.data.email.toLowerCase();
    const senha = resultado.data.senha;
    const administrador = await prisma.administrador.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true, senhaHash: true, ativo: true },
    });
    if (!administrador || !administrador.ativo) {
      return NextResponse.json(
        { mensagem: "E-mail ou senha inválidos." },
        { status: 401 },
      );
    }
    const senhaCorreta = await compare(senha, administrador.senhaHash);
    if (!senhaCorreta) {
      return NextResponse.json(
        { mensagem: "E-mail ou senha inválidos." },
        { status: 401 },
      );
    }
    const resposta = NextResponse.json({
      mensagem: "Login realizado com sucesso.",
      usuario: {
        id: administrador.id,
        nome: administrador.nome,
        email: administrador.email,
        role: "admin",
      },
    });
    return setSessionCookie(resposta, "admin", administrador);
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
