import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const nomeAdministrador = process.env.ADMIN_INITIAL_NAME;
  const emailAdministrador = process.env.ADMIN_INITIAL_EMAIL;
  const senhaAdministrador = process.env.ADMIN_INITIAL_PASSWORD;
  const senhaEmpresa = process.env.EMPRESA_TEST_PASSWORD;

  if (
    !nomeAdministrador ||
    !emailAdministrador ||
    !senhaAdministrador
  ) {
    throw new Error(
      "Configure ADMIN_INITIAL_NAME, ADMIN_INITIAL_EMAIL e ADMIN_INITIAL_PASSWORD no .env."
    );
  }

  if (!senhaEmpresa) {
    throw new Error(
      "Configure EMPRESA_TEST_PASSWORD no arquivo .env."
    );
  }

  if (senhaAdministrador.length < 8) {
    throw new Error(
      "ADMIN_INITIAL_PASSWORD deve possuir pelo menos 8 caracteres."
    );
  }

  if (senhaEmpresa.length < 8) {
    throw new Error(
      "EMPRESA_TEST_PASSWORD deve possuir pelo menos 8 caracteres."
    );
  }

  const emailAdministradorNormalizado = emailAdministrador
    .trim()
    .toLowerCase();

  const senhaHashAdministrador = await hash(
    senhaAdministrador,
    12
  );

  const senhaHashEmpresa = await hash(senhaEmpresa, 12);

  // Cria ou atualiza o administrador inicial
  const administrador = await prisma.administrador.upsert({
    where: {
      email: emailAdministradorNormalizado,
    },

    update: {
      nome: nomeAdministrador.trim(),
      senhaHash: senhaHashAdministrador,
      ativo: true,
    },

    create: {
      nome: nomeAdministrador.trim(),
      email: emailAdministradorNormalizado,
      senhaHash: senhaHashAdministrador,
      ativo: true,
    },
  });

  console.log(
    `Administrador preparado: ${administrador.email}`
  );

  // Empresa usada para testar o login
  const empresaTeste = await prisma.empresa.upsert({
    where: {
      cnpj: "11222333000181",
    },

    update: {
      razaoSocial: "Empresa Teste SIGA LTDA",
      nomeFantasia: "Empresa Teste",
      email: "teste@empresa.com",
      telefone: "11999999999",
      senhaHash: senhaHashEmpresa,
      autorizada: true,
      ativa: true,
    },

    create: {
      cnpj: "11222333000181",
      razaoSocial: "Empresa Teste SIGA LTDA",
      nomeFantasia: "Empresa Teste",
      email: "teste@empresa.com",
      telefone: "11999999999",
      senhaHash: senhaHashEmpresa,
      autorizada: true,
      ativa: true,
    },
  });

  console.log(
    `Empresa preparada: ${empresaTeste.nomeFantasia}`
  );

  /*
   * Empresas disponíveis no Google Forms.
   *
   * Os nomes fantasia precisam permanecer iguais aos nomes
   * presentes na planilha, pois serão utilizados para relacionar
   * o aluno à empresa.
   *
   * Estes CNPJs são destinados somente ao ambiente local de teste.
   */
  const empresasDoFormulario = [
    {
      cnpj: "90000000000184",
      razaoSocial: "Tech Solutions - Ambiente de Teste",
      nomeFantasia: "Tech Solutions",
    },
    {
      cnpj: "90000000000265",
      razaoSocial: "Alfa Industrial - Ambiente de Teste",
      nomeFantasia: "Alfa Industrial",
    },
    {
      cnpj: "90000000000346",
      razaoSocial: "Acciona - Ambiente de Teste",
      nomeFantasia: "Acciona",
    },
    {
      cnpj: "90000000000427",
      razaoSocial: "Microsoft - Ambiente de Teste",
      nomeFantasia: "Microsoft",
    },
    {
      cnpj: "90000000000508",
      razaoSocial: "Google - Ambiente de Teste",
      nomeFantasia: "Google",
    },
    {
      cnpj: "90000000000699",
      razaoSocial: "BrSplice - Ambiente de Teste",
      nomeFantasia: "BrSplice",
    },
  ];

  for (const dadosEmpresa of empresasDoFormulario) {
    const empresa = await prisma.empresa.upsert({
      where: {
        cnpj: dadosEmpresa.cnpj,
      },

      update: {
        razaoSocial: dadosEmpresa.razaoSocial,
        nomeFantasia: dadosEmpresa.nomeFantasia,
        senhaHash: senhaHashEmpresa,
        autorizada: true,
        ativa: true,
      },

      create: {
        cnpj: dadosEmpresa.cnpj,
        razaoSocial: dadosEmpresa.razaoSocial,
        nomeFantasia: dadosEmpresa.nomeFantasia,
        senhaHash: senhaHashEmpresa,
        autorizada: true,
        ativa: true,
      },
    });

    console.log(
      `Empresa preparada: ${empresa.nomeFantasia}`
    );
  }

  console.log("Dados iniciais preparados com sucesso.");
}

main()
  .catch((error) => {
    console.error(
      "Erro ao preparar os dados iniciais:",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });