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
  // Dados do administrador vindos do arquivo .env
  const nome = process.env.ADMIN_INITIAL_NAME;
  const email = process.env.ADMIN_INITIAL_EMAIL;
  const senha = process.env.ADMIN_INITIAL_PASSWORD;

  // Senha inicial da empresa de teste
  const senhaEmpresa = process.env.EMPRESA_TEST_PASSWORD;

  // Confere os dados obrigatórios do administrador
  if (!nome || !email || !senha) {
    throw new Error(
      "Configure ADMIN_INITIAL_NAME, ADMIN_INITIAL_EMAIL e ADMIN_INITIAL_PASSWORD no .env."
    );
  }

  // Confere a senha da empresa de teste
  if (!senhaEmpresa) {
    throw new Error(
      "Configure EMPRESA_TEST_PASSWORD no arquivo .env."
    );
  }

  // Impede uma senha administrativa muito curta
  if (senha.length < 8) {
    throw new Error(
      "ADMIN_INITIAL_PASSWORD deve possuir pelo menos 8 caracteres."
    );
  }

  // Impede uma senha de empresa muito curta
  if (senhaEmpresa.length < 8) {
    throw new Error(
      "EMPRESA_TEST_PASSWORD deve possuir pelo menos 8 caracteres."
    );
  }

  // Normaliza o e-mail do administrador
  const emailNormalizado = email.trim().toLowerCase();

  // Cria hashes seguros para as duas senhas
  const senhaHashAdministrador = await hash(senha, 12);
  const senhaHashEmpresa = await hash(senhaEmpresa, 12);

  // Cria ou atualiza o administrador
  const administrador = await prisma.administrador.upsert({
    where: {
      email: emailNormalizado,
    },

    update: {
      nome: nome.trim(),
      senhaHash: senhaHashAdministrador,
      ativo: true,
    },

    create: {
      nome: nome.trim(),
      email: emailNormalizado,
      senhaHash: senhaHashAdministrador,
      ativo: true,
    },
  });

  console.log(`Administrador preparado: ${administrador.email}`);

  // Cria ou atualiza a empresa de teste
  const empresa = await prisma.empresa.upsert({
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

  console.log(`Empresa preparada: ${empresa.razaoSocial}`);
}

main()
  .catch((error) => {
    console.error("Erro ao preparar os dados iniciais:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });