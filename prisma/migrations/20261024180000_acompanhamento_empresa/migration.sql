BEGIN;

-- CreateEnum
CREATE TYPE "StatusParticipacao" AS ENUM ('INDICADO', 'EM_PROCESSO', 'APROVADO', 'CONTRATADO', 'NAO_CONTRATADO', 'DESISTIU', 'CANCELADO');

-- CreateEnum
CREATE TYPE "AutorParticipacao" AS ENUM ('ADMIN', 'EMPRESA', 'SISTEMA');

-- CreateTable
CREATE TABLE "participacoes_solicitacao" (
    "id" TEXT NOT NULL,
    "solicitacao_id" TEXT NOT NULL,
    "matricula_id" TEXT NOT NULL,
    "aluno_id" TEXT NOT NULL,
    "status" "StatusParticipacao" NOT NULL DEFAULT 'INDICADO',
    "motivo" VARCHAR(300),
    "iniciado_em" TIMESTAMP(3),
    "aprovado_em" TIMESTAMP(3),
    "contratado_em" TIMESTAMP(3),
    "encerrado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participacoes_solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_participacao" (
    "id" TEXT NOT NULL,
    "participacao_id" TEXT NOT NULL,
    "status_anterior" "StatusParticipacao",
    "novo_status" "StatusParticipacao" NOT NULL,
    "autor" "AutorParticipacao" NOT NULL,
    "administrador_id" TEXT,
    "empresa_id" TEXT,
    "registrado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_participacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "participacoes_solicitacao_solicitacao_id_status_idx" ON "participacoes_solicitacao"("solicitacao_id", "status");

-- CreateIndex
CREATE INDEX "participacoes_solicitacao_matricula_id_idx" ON "participacoes_solicitacao"("matricula_id");

-- CreateIndex
CREATE UNIQUE INDEX "participacoes_solicitacao_solicitacao_id_aluno_id_key" ON "participacoes_solicitacao"("solicitacao_id", "aluno_id");

-- CreateIndex
CREATE INDEX "eventos_participacao_participacao_id_registrado_em_idx" ON "eventos_participacao"("participacao_id", "registrado_em");

-- CreateIndex
CREATE INDEX "eventos_participacao_autor_registrado_em_idx" ON "eventos_participacao"("autor", "registrado_em");

-- AddForeignKey
ALTER TABLE "participacoes_solicitacao" ADD CONSTRAINT "participacoes_solicitacao_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "Solicitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacoes_solicitacao" ADD CONSTRAINT "participacoes_solicitacao_matricula_id_fkey" FOREIGN KEY ("matricula_id") REFERENCES "matriculas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacoes_solicitacao" ADD CONSTRAINT "participacoes_solicitacao_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_participacao" ADD CONSTRAINT "eventos_participacao_participacao_id_fkey" FOREIGN KEY ("participacao_id") REFERENCES "participacoes_solicitacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_participacao" ADD CONSTRAINT "eventos_participacao_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_participacao" ADD CONSTRAINT "eventos_participacao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Somente indicações com solicitação identificada podem gerar um acompanhamento.
WITH primeiras AS (
    SELECT DISTINCT ON (h.solicitacao_id, m.aluno_id)
        h.solicitacao_id, h.matricula_id, m.aluno_id, h.registrado_em, h.id
    FROM historico_acompanhamento h
    JOIN matriculas m ON m.id = h.matricula_id
    WHERE h.solicitacao_id IS NOT NULL AND h.novo_status = 'INDICADO'
    ORDER BY h.solicitacao_id, m.aluno_id, h.registrado_em, h.id
), ordenadas AS (
    SELECT *, row_number() OVER (PARTITION BY aluno_id ORDER BY registrado_em DESC, id DESC) AS ordem
    FROM primeiras
), conciliadas AS (
    SELECT p.*, CASE
        WHEN p.ordem = 1 AND a.arquivado_em IS NULL
            AND a.empresa_id = s."idEmpresa" AND m.empresa_atual_id = s."idEmpresa"
            AND ((m.status = 'INDICADO' AND a.status_indicacao = 'Indicado')
                OR (m.status = 'EM_PROCESSO' AND a.status_indicacao = 'Em processo')
                OR (m.status = 'CONTRATADO' AND a.status_indicacao = 'Contratado'))
        THEN m.status::text ELSE 'CANCELADO' END AS situacao
    FROM ordenadas p
    JOIN alunos a ON a.id = p.aluno_id
    JOIN matriculas m ON m.id = p.matricula_id
    JOIN "Solicitacoes" s ON s.id = p.solicitacao_id
)
INSERT INTO participacoes_solicitacao
    (id, solicitacao_id, matricula_id, aluno_id, status, motivo, criado_em, atualizado_em, encerrado_em)
SELECT md5('participacao:' || solicitacao_id || ':' || aluno_id)::uuid::text,
    solicitacao_id, matricula_id, aluno_id, situacao::"StatusParticipacao",
    CASE WHEN situacao = 'CANCELADO' THEN 'Histórico anterior conciliado com o vínculo atual do aluno.' END,
    registrado_em, CURRENT_TIMESTAMP,
    CASE WHEN situacao = 'CANCELADO' THEN CURRENT_TIMESTAMP END
FROM conciliadas;

INSERT INTO eventos_participacao (id, participacao_id, novo_status, autor)
SELECT md5('conciliacao:' || id)::uuid::text, id, status, 'SISTEMA'
FROM participacoes_solicitacao;

CREATE UNIQUE INDEX participacao_ativa_por_aluno
    ON participacoes_solicitacao (aluno_id)
    WHERE status IN ('INDICADO', 'EM_PROCESSO', 'APROVADO', 'CONTRATADO');

ALTER TABLE eventos_participacao ADD CONSTRAINT autor_participacao_valido CHECK (
    (autor = 'ADMIN' AND administrador_id IS NOT NULL AND empresa_id IS NULL)
    OR (autor = 'EMPRESA' AND empresa_id IS NOT NULL AND administrador_id IS NULL)
    OR (autor = 'SISTEMA' AND administrador_id IS NULL AND empresa_id IS NULL)
);

COMMIT;

