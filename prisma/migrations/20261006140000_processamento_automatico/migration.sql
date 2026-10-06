BEGIN;
ALTER TABLE recebimentos_cadastro DROP CONSTRAINT recebimentos_cadastro_estado_check;
-- Preserva a autoria das revisões antigas na auditoria antes de retirar a coluna.
UPDATE recebimentos_cadastro
SET auditoria = COALESCE(auditoria, '{}'::jsonb) || jsonb_build_object('responsavelAnterior', responsavel_id)
WHERE responsavel_id IS NOT NULL;
UPDATE recebimentos_cadastro SET estado = CASE estado
  WHEN 'APROVADO' THEN 'PROCESSADO'
  WHEN 'REJEITADO' THEN 'IGNORADO'
  WHEN 'PENDENTE' THEN CASE WHEN erros <> '[]'::jsonb THEN 'INVALIDO' ELSE 'PENDENTE' END
  ELSE estado END;
ALTER TABLE recebimentos_cadastro RENAME COLUMN revisado_em TO processado_em;
ALTER TABLE recebimentos_cadastro DROP CONSTRAINT recebimentos_responsavel_fkey;
ALTER TABLE recebimentos_cadastro DROP COLUMN responsavel_id;
ALTER TABLE recebimentos_cadastro ADD CONSTRAINT recebimentos_cadastro_estado_check
CHECK (estado IN ('PENDENTE', 'INVALIDO', 'PROCESSADO', 'IGNORADO'));
COMMIT;
