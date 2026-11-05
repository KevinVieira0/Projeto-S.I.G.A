BEGIN;

-- AlterTable
ALTER TABLE "eventos_participacao" ADD COLUMN     "descricao" VARCHAR(100);

-- CreateTable
CREATE TABLE "comprovantes_contrato" (
    "id" TEXT NOT NULL,
    "aluno_id" TEXT NOT NULL,
    "matricula_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "participacao_id" TEXT NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "tipo" VARCHAR(80) NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "hash" CHAR(64) NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprovantes_contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comprovantes_contrato_aluno_id_criado_em_idx" ON "comprovantes_contrato"("aluno_id", "criado_em");

-- CreateIndex
CREATE INDEX "comprovantes_contrato_participacao_id_criado_em_idx" ON "comprovantes_contrato"("participacao_id", "criado_em");

-- AddForeignKey
ALTER TABLE "comprovantes_contrato" ADD CONSTRAINT "comprovantes_contrato_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprovantes_contrato" ADD CONSTRAINT "comprovantes_contrato_matricula_id_fkey" FOREIGN KEY ("matricula_id") REFERENCES "matriculas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprovantes_contrato" ADD CONSTRAINT "comprovantes_contrato_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprovantes_contrato" ADD CONSTRAINT "comprovantes_contrato_participacao_id_fkey" FOREIGN KEY ("participacao_id") REFERENCES "participacoes_solicitacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comprovantes_contrato" ADD CONSTRAINT "comprovante_tamanho_valido"
CHECK (tamanho > 0 AND tamanho <= 5242880 AND octet_length(conteudo) = tamanho);

COMMIT;

