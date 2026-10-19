import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      select: { razaoSocial: true, autorizada: true, ativa: true },
    });

    // A empresa só é beneficiária se existir, estiver autorizada e ativa
    const beneficiaria = Boolean(empresa && empresa.autorizada && empresa.ativa);
    return NextResponse.json({
      beneficiaria,
      razaoSocial: beneficiaria ? empresa.razaoSocial : null,
      message: beneficiaria
        ? "Empresa autorizada."
        : "Empresa não localizada ou não autorizada.",
    });
  } catch (erroCapturado) {
    console.error("Erro ao consultar empresa:", erroCapturado);
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
