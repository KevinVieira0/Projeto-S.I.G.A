-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');

-- CreateTable
CREATE TABLE "Solitacoes" (
    "id" TEXT NOT NULL,
    "idadeMinima" INTEGER NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "pratica" TEXT NOT NULL,
    "cursos" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "quantidadeAlunos" INTEGER NOT NULL,
    "observacoes" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solitacoes_pkey" PRIMARY KEY ("id")
);
