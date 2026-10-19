import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import {
  ErroFonteAcademica,
  lerBaseAcademicaDaPlanilha,
} from "@/lib/importacao/googleSheetsAcademico";
import { gerarPreviaAcademica } from "@/lib/importacao/previaAcademica";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(requisicao) {
  try {
    const { error: erroCapturado } = await authorize(requisicao, "admin");
    if (erroCapturado) return erroCapturado;
    const abas = await lerBaseAcademicaDaPlanilha();
    const previa = await gerarPreviaAcademica(prisma, abas);
    return NextResponse.json(previa, { headers: { "Cache-Control": "no-store" } });
  } catch (erroCapturado) {
    // Não expor erros do Google/Prisma, URLs ou dados pessoais.
    return NextResponse.json(
      {
        mensagem:
          erroCapturado instanceof ErroFonteAcademica
            ? erroCapturado.message
            : "Não foi possível gerar a prévia acadêmica. Confira a conexão e as permissões de leitura.",
      },
      {
        status: erroCapturado instanceof ErroFonteAcademica ? 400 : 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
