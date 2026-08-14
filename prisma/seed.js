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

  // Confere se todos os dados obrigatórios foram configurados
  if (!nome || !email || !senha) {
    throw new Error(
      "Configure ADMIN_INITIAL_NAME, ADMIN_INITIAL_EMAIL e ADMIN_INITIAL_PASSWORD no .env."
    );
  }

  // Impede a criação de uma senha inicial muito curta
  if (senha.length < 8) {
    throw new Error(
      "ADMIN_INITIAL_PASSWORD deve possuir pelo menos 8 caracteres."
    );
  }

  // Remove espaços e transforma o e-mail em letras minúsculas
  const emailNormalizado = email.trim().toLowerCase();

  // Transforma a senha em um hash seguro antes de armazená-la
  const senhaHash = await hash(senha, 12);

  // Cria o administrador ou atualiza seus dados caso ele já exista
  const administrador = await prisma.administrador.upsert({
    where: {
      email: emailNormalizado,
    },

    update: {
      nome: nome.trim(),
      ativo: true,
    },

    create: {
      nome: nome.trim(),
      email: emailNormalizado,
      senhaHash,
      ativo: true,
    },
  });

  console.log(`Administrador preparado: ${administrador.email}`);

  // Cria a empresa de teste ou atualiza seus dados caso ela já exista
  const empresa = await prisma.empresa.upsert({
    where: {
      cnpj: "11222333000181",
    },

    update: {
      razaoSocial: "Empresa Teste SIGA LTDA",
      nomeFantasia: "Empresa Teste",
      email: "teste@empresa.com",
      telefone: "11999999999",
      autorizada: true,
      ativa: true,
    },

    create: {
      cnpj: "11222333000181",
      razaoSocial: "Empresa Teste SIGA LTDA",
      nomeFantasia: "Empresa Teste",
      email: "teste@empresa.com",
      telefone: "11999999999",
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