ALTER TABLE "Solicitacoes"
  ADD COLUMN "primeira_indicacao_em" TIMESTAMP(3),
  ADD COLUMN "encerrada_em" TIMESTAMP(3),
  ADD COLUMN "motivo_encerramento" VARCHAR(30);

-- As indicações anteriores já têm data no histórico ou no primeiro evento.
WITH primeiras AS (
  SELECT solicitacao_id, MIN(registrado_em) AS instante
  FROM (
    SELECT solicitacao_id, registrado_em
    FROM historico_acompanhamento
    WHERE solicitacao_id IS NOT NULL AND novo_status = 'INDICADO'
    UNION ALL
    SELECT p.solicitacao_id, e.registrado_em
    FROM eventos_participacao e
    JOIN participacoes_solicitacao p ON p.id = e.participacao_id
    WHERE e.autor = 'ADMIN' AND e.status_anterior IS NULL
      AND e.novo_status = 'INDICADO'
  ) indicacoes
  GROUP BY solicitacao_id
)
UPDATE "Solicitacoes" s
SET primeira_indicacao_em = primeiras.instante
FROM primeiras
WHERE s.id = primeiras.solicitacao_id;

CREATE INDEX "solicitacoes_ativa_primeira_indicacao_idx"
  ON "Solicitacoes"("ativa", "primeira_indicacao_em");
