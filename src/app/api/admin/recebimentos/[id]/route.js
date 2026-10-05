import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import {
  contextoRecebimento,
  revisarRecebimento,
} from "@/lib/importacao/aprovarRecebimento";
import { ErroRecebimento } from "@/lib/importacao/recebimentos";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";
const json = (valor, status = 200) =>
  NextResponse.json(valor, { status, headers: { "Cache-Control": "no-store" } });
const schema = z
  .object({
    acao: z.enum(["aprovar", "rejeitar"]),
    hash: z.string().length(64),
    versao: z.string().length(64),
    atualizarAcademico: z.boolean().optional(),
    status: z.enum(["DISPONIVEL", "INDICADO", "EM_PROCESSO", "CONTRATADO"]).optional(),
    empresaId: z.string().uuid().optional(),
  })
  .strict();

export async function GET(requisicao, { params: parametros }) {
  const { error: erroCapturado } = await authorize(requisicao, "admin");
  if (erroCapturado) return erroCapturado;
  try {
    const resultado = await prisma.$transaction(
      async (transacao) => {
        const registro = await transacao.recebimentoCadastro.findUnique({
          where: { id: parametros.id },
          select: {
            id: true,
            tipo: true,
            dados: true,
            erros: true,
            hash: true,
            estado: true,
            recebidoEm: true,
          },
        });
        if (!registro) throw new ErroRecebimento("Recebimento não encontrado.", 404);
        return { ...registro, ...(await contextoRecebimento(transacao, registro)) };
      },
      { isolationLevel: "RepeatableRead" },
    );
    const empresas = await prisma.empresa.findMany({
      where: { ativa: true },
      orderBy: { razaoSocial: "asc" },
      select: { id: true, razaoSocial: true, cnpj: true },
    });
    return json({ ...resultado, empresas });
  } catch (e) {
    return json(
      {
        mensagem:
          e instanceof ErroRecebimento ? e.message : "Falha ao carregar a conferência.",
      },
      e instanceof ErroRecebimento ? e.status : 500,
    );
  }
}

export async function POST(requisicao, { params: parametros }) {
  const { error: erroCapturado, session: sessao } = await authorize(requisicao, "admin");
  if (erroCapturado) return erroCapturado;
  let corpo;
  try {
    corpo = schema.parse(await requisicao.json());
  } catch {
    return json({ mensagem: "Dados de confirmação inválidos." }, 400);
  }
  try {
    const registro = await prisma.recebimentoCadastro.findUnique({
      where: { id: parametros.id },
      select: { tipo: true },
    });
    if (registro?.tipo === "ALUNO")
      return json(
        { mensagem: "Cadastros de alunos são processados automaticamente por CPF." },
        409,
      );
    return json(await revisarRecebimento(prisma, parametros.id, sessao.dados.id, corpo));
  } catch (e) {
    return json(
      {
        mensagem:
          e instanceof ErroRecebimento
            ? e.message
            : "A gravação não foi concluída. Recarregue a conferência e tente novamente.",
      },
      e instanceof ErroRecebimento ? e.status : 409,
    );
  }
}
