-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "cpf" CHAR(11) NOT NULL,
    "celular" VARCHAR(20),
    "email" VARCHAR(255),
    "idade" INTEGER NOT NULL,
    "modalidade" VARCHAR(50) NOT NULL,
    "curso" VARCHAR(150) NOT NULL,
    "turma" VARCHAR(50) NOT NULL,
    "periodo" VARCHAR(20) NOT NULL,
    "termo" INTEGER NOT NULL,
    "empregado" BOOLEAN NOT NULL DEFAULT false,
    "empresa_id" TEXT,
    "status_indicacao" VARCHAR(30) NOT NULL DEFAULT 'Não indicado',
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alunos_cpf_key" ON "alunos"("cpf");

-- CreateIndex
CREATE INDEX "alunos_empresa_id_idx" ON "alunos"("empresa_id");

-- CreateIndex
CREATE INDEX "alunos_curso_turma_idx" ON "alunos"("curso", "turma");

-- CreateIndex
CREATE INDEX "alunos_status_indicacao_idx" ON "alunos"("status_indicacao");

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
