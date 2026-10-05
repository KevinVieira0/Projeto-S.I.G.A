CREATE TABLE "recebimentos_cadastro" (
  "id" TEXT NOT NULL,
  "fonte" VARCHAR(100) NOT NULL,
  "tipo" VARCHAR(10) NOT NULL CHECK ("tipo" IN ('ALUNO', 'EMPRESA')),
  "envio_id" VARCHAR(200) NOT NULL,
  "hash" VARCHAR(64) NOT NULL,
  "dados" JSONB NOT NULL,
  "erros" JSONB NOT NULL,
  "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK ("estado" IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
  "recebido_em" TIMESTAMP(3) NOT NULL,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revisado_em" TIMESTAMP(3),
  "responsavel_id" TEXT,
  "entidade_id" TEXT,
  "auditoria" JSONB,
  CONSTRAINT "recebimentos_cadastro_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "recebimentos_responsavel_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "recebimentos_cadastro_fonte_tipo_envio_id_key" ON "recebimentos_cadastro"("fonte", "tipo", "envio_id");
CREATE INDEX "recebimentos_cadastro_tipo_estado_recebido_em_idx" ON "recebimentos_cadastro"("tipo", "estado", "recebido_em");
