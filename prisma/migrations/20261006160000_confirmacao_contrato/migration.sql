BEGIN;
ALTER TABLE matriculas
  ADD COLUMN contrato_confirmado boolean NOT NULL DEFAULT false,
  ADD COLUMN contrato_atualizado_em timestamp(3);
ALTER TABLE matriculas ADD CONSTRAINT matriculas_contrato_confirmado_check
  CHECK (NOT contrato_confirmado OR (status = 'CONTRATADO' AND empresa_atual_id IS NOT NULL));
COMMIT;
