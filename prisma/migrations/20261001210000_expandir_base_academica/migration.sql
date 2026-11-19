-- Expansão aditiva: não remove nem renomeia campos consumidos pelas APIs atuais.
BEGIN;

-- CreateEnum
CREATE TYPE "StatusAcompanhamento" AS ENUM ('DISPONIVEL', 'INDICADO', 'EM_PROCESSO', 'CONTRATADO');

-- CreateEnum
CREATE TYPE "TipoEventoAcompanhamento" AS ENUM ('CARGA_INICIAL', 'ALTERACAO_STATUS');

-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "contribuinte" BOOLEAN;

-- AlterTable
ALTER TABLE "alunos" ADD COLUMN     "cep" CHAR(8),
ADD COLUMN     "data_nascimento" DATE,
ADD COLUMN     "endereco" VARCHAR(300),
ADD COLUMN     "origem_cadastro" VARCHAR(40),
ADD COLUMN     "telefone" VARCHAR(30),
ADD COLUMN     "ultima_sincronizacao" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "chave" VARCHAR(64) NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "tipo_curso" VARCHAR(50) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL,
    "chave" VARCHAR(64) NOT NULL,
    "curso_id" TEXT NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "turno" VARCHAR(30) NOT NULL,
    "data_inicio" DATE,
    "data_fim" DATE,
    "quantidade_termos" INTEGER,
    "origem" VARCHAR(40) NOT NULL DEFAULT 'SISTEMA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" TEXT NOT NULL,
    "aluno_id" TEXT NOT NULL,
    "turma_id" TEXT NOT NULL,
    "termo_atual" INTEGER NOT NULL,
    "status" "StatusAcompanhamento",
    "classificacao_pendente" BOOLEAN NOT NULL DEFAULT true,
    "empresa_atual_id" TEXT,
    "chave_legado" TEXT,
    "hash_legado" VARCHAR(64),
    "dados_legado" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "ultima_sincronizacao" TIMESTAMP(3),

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_acompanhamento" (
    "id" TEXT NOT NULL,
    "matricula_id" TEXT NOT NULL,
    "empresa_id" TEXT,
    "solicitacao_id" TEXT,
    "responsavel_id" TEXT,
    "tipo" "TipoEventoAcompanhamento" NOT NULL,
    "status_anterior" "StatusAcompanhamento",
    "novo_status" "StatusAcompanhamento",
    "registrado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origem" VARCHAR(40) NOT NULL,
    "chave_migracao" TEXT,

    CONSTRAINT "historico_acompanhamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendencias_migracao" (
    "id" TEXT NOT NULL,
    "chave" VARCHAR(160) NOT NULL,
    "codigo" VARCHAR(60) NOT NULL,
    "aluno_id" TEXT,
    "turma_id" TEXT,
    "matricula_id" TEXT,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvida_em" TIMESTAMP(3),

    CONSTRAINT "pendencias_migracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cursos_chave_key" ON "cursos"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_chave_key" ON "turmas"("chave");

-- CreateIndex
CREATE INDEX "turmas_curso_id_codigo_idx" ON "turmas"("curso_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_chave_legado_key" ON "matriculas"("chave_legado");

-- CreateIndex
CREATE INDEX "matriculas_aluno_id_turma_id_idx" ON "matriculas"("aluno_id", "turma_id");

-- CreateIndex
CREATE INDEX "matriculas_turma_id_status_idx" ON "matriculas"("turma_id", "status");

-- CreateIndex
CREATE INDEX "matriculas_empresa_atual_id_idx" ON "matriculas"("empresa_atual_id");

-- CreateIndex
CREATE UNIQUE INDEX "historico_acompanhamento_chave_migracao_key" ON "historico_acompanhamento"("chave_migracao");

-- CreateIndex
CREATE INDEX "historico_acompanhamento_matricula_id_registrado_em_idx" ON "historico_acompanhamento"("matricula_id", "registrado_em");

-- CreateIndex
CREATE UNIQUE INDEX "pendencias_migracao_chave_key" ON "pendencias_migracao"("chave");

-- CreateIndex
CREATE INDEX "pendencias_migracao_codigo_resolvida_em_idx" ON "pendencias_migracao"("codigo", "resolvida_em");

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_empresa_atual_id_fkey" FOREIGN KEY ("empresa_atual_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_acompanhamento" ADD CONSTRAINT "historico_acompanhamento_matricula_id_fkey" FOREIGN KEY ("matricula_id") REFERENCES "matriculas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_acompanhamento" ADD CONSTRAINT "historico_acompanhamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_acompanhamento" ADD CONSTRAINT "historico_acompanhamento_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "Solicitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_acompanhamento" ADD CONSTRAINT "historico_acompanhamento_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias_migracao" ADD CONSTRAINT "pendencias_migracao_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias_migracao" ADD CONSTRAINT "pendencias_migracao_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias_migracao" ADD CONSTRAINT "pendencias_migracao_matricula_id_fkey" FOREIGN KEY ("matricula_id") REFERENCES "matriculas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Regras que Prisma não expressa no schema; preservar nas próximas migrations.
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_termos_positivos" CHECK ("quantidade_termos" IS NULL OR "quantidade_termos" > 0);
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_datas_validas" CHECK (
  ("data_inicio" IS NULL AND "data_fim" IS NULL) OR
  ("data_inicio" IS NOT NULL AND "data_fim" IS NOT NULL AND "data_fim" >= "data_inicio")
);
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_termo_positivo" CHECK ("termo_atual" > 0);
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_status_classificacao" CHECK (
  ("status" IS NULL AND "classificacao_pendente" AND "chave_legado" IS NOT NULL AND "empresa_atual_id" IS NULL) OR
  ("status" IS NOT NULL AND NOT "classificacao_pendente")
);
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_empresa_status" CHECK (
  "status" IS NULL OR
  ("status" = 'DISPONIVEL' AND "empresa_atual_id" IS NULL) OR
  ("status" IN ('INDICADO', 'EM_PROCESSO', 'CONTRATADO') AND "empresa_atual_id" IS NOT NULL)
);
ALTER TABLE "historico_acompanhamento" ADD CONSTRAINT "historico_novo_status" CHECK (
  "tipo" = 'CARGA_INICIAL' OR "novo_status" IS NOT NULL
);

COMMIT;
