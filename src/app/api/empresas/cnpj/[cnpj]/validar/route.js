import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Executada quando a rota recebe uma requisição GET
export async function GET(request, { params }) {
  // Obtém o CNPJ que foi enviado pela URL
  const cnpj = params.cnpj.replace(/\D/g, "");

  // Confere se o CNPJ possui exatamente 14 números
  if (!/^\d{14}$/.test(cnpj)) {
    return NextResponse.json(
      {
        beneficiaria: false,
        razaoSocial: null,
        message: "CNPJ inválido.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    // Procura o CNPJ na tabela empresas
    const empresa = await prisma.empresa.findUnique({
      where: {
        cnpj,
      },

      select: {
        razaoSocial: true,
        autorizada: true,
        ativa: true,
      },
    });

    // A empresa só é beneficiária se existir, estiver autorizada e ativa
    const beneficiaria = Boolean(
      empresa && empresa.autorizada && empresa.ativa
    );

    return NextResponse.json({
      beneficiaria,
      razaoSocial: beneficiaria ? empresa.razaoSocial : null,
      message: beneficiaria
        ? "Empresa autorizada."
        : "Empresa não localizada ou não autorizada.",
    });
  } catch (error) {
    console.error("Erro ao consultar empresa:", error);

    return NextResponse.json(
      {
        beneficiaria: false,
        razaoSocial: null,
        message: "Erro interno ao validar o CNPJ.",
      },
      {
        status: 500,
      }
    );
  }
}