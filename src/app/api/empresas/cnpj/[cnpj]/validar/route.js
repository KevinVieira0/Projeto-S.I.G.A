import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_requisicao, { params: parametros }) {
  const cnpj = parametros.cnpj.replace(/\D/g, "");
  if (!/^\d{14}$/.test(cnpj)) {
    return NextResponse.json(
      { beneficiaria: false, razaoSocial: null, message: "CNPJ inválido." },
      { status: 400 },
    );
  }
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { cnpj },
      select: {
        razaoSocial: true,
        autorizada: true,
        ativa: true,
        senhaHash: true,
      },
    });

    const beneficiaria = Boolean(empresa?.ativa);
    return NextResponse.json(
      {
        beneficiaria,
        acessoConfigurado: Boolean(
          beneficiaria && empresa.autorizada && empresa.senhaHash,
        ),
        razaoSocial: beneficiaria ? empresa.razaoSocial : null,
        message: beneficiaria
          ? "Empresa beneficiária cadastrada."
          : "Empresa não localizada ou inativa.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erroCapturado) {
    console.error("Não foi possível consultar a empresa para validar o CNPJ.");
    return NextResponse.json(
      {
        beneficiaria: false,
        razaoSocial: null,
        message: "Erro interno ao validar o CNPJ.",
      },
      { status: 500 },
    );
  }
}
