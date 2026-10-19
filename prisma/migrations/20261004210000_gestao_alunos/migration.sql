BEGIN;
ALTER TABLE "alunos" ADD COLUMN "arquivado_em" TIMESTAMP(3);
ALTER TABLE "alunos" ALTER COLUMN "status_indicacao" SET DEFAULT 'Disponível';
UPDATE "alunos" SET "status_indicacao"='Disponível', "empregado"=false, "empresa_id"=NULL
WHERE "status_indicacao" IN ('Sem classificação', 'Não indicado');
ALTER TABLE "matriculas" DROP CONSTRAINT "matriculas_status_classificacao";
UPDATE "matriculas" SET "status"='DISPONIVEL', "classificacao_pendente"=false, "empresa_atual_id"=NULL WHERE "status" IS NULL;
ALTER TABLE "matriculas" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "matriculas" ALTER COLUMN "status" SET DEFAULT 'DISPONIVEL';
ALTER TABLE "matriculas" ALTER COLUMN "classificacao_pendente" SET DEFAULT false;
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_status_classificacao" CHECK (NOT "classificacao_pendente");
CREATE TABLE "auditoria_alunos" (
 "id" TEXT PRIMARY KEY, "aluno_id" TEXT NOT NULL REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "responsavel_id" TEXT NOT NULL REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "acao" VARCHAR(20) NOT NULL, "dados" JSONB NOT NULL, "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "auditoria_alunos_aluno_id_criado_em_idx" ON "auditoria_alunos"("aluno_id", "criado_em");
COMMIT;
