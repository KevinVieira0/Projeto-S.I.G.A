BEGIN;
-- Cadastro válido pode existir antes da classificação profissional, sem vínculo legado.
ALTER TABLE "matriculas" DROP CONSTRAINT "matriculas_status_classificacao";
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_status_classificacao" CHECK (
  ("status" IS NULL AND "classificacao_pendente" AND "empresa_atual_id" IS NULL) OR
  ("status" IS NOT NULL AND NOT "classificacao_pendente")
);
COMMIT;
