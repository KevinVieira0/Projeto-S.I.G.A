-- Encerra apenas vínculos residuais que divergem do cadastro vigente; preserva documentos e datas históricas.
BEGIN;
SELECT pg_advisory_xact_lock(741004);
WITH antigas AS MATERIALIZED (
  SELECT m.id, m.status, m.empresa_atual_id
  FROM matriculas m
  JOIN alunos a ON a.id = m.aluno_id
  JOIN turmas t ON t.id = m.turma_id
  JOIN cursos c ON c.id = t.curso_id
  WHERE (m.status <> 'DISPONIVEL' OR m.empresa_atual_id IS NOT NULL OR m.contrato_confirmado)
    AND (a.arquivado_em IS NOT NULL OR t.codigo IS DISTINCT FROM a.turma
      OR t.turno IS DISTINCT FROM a.periodo OR c.nome IS DISTINCT FROM a.curso
      OR m.empresa_atual_id IS DISTINCT FROM a.empresa_id)
), historicos AS (
  INSERT INTO historico_acompanhamento (id, matricula_id, empresa_id, tipo, status_anterior, novo_status, origem)
  SELECT gen_random_uuid()::text, id, empresa_atual_id, 'ALTERACAO_STATUS', status, 'DISPONIVEL', 'CONCILIACAO_TRANSFERENCIA'
  FROM antigas RETURNING id
), eventos AS (
  INSERT INTO eventos_participacao (id, participacao_id, status_anterior, novo_status, autor, descricao)
  SELECT gen_random_uuid()::text, p.id, p.status, 'CANCELADO', 'SISTEMA', 'Vínculo anterior conciliado após transferência.'
  FROM participacoes_solicitacao p JOIN antigas a ON a.id = p.matricula_id
  WHERE p.status IN ('INDICADO', 'EM_PROCESSO', 'APROVADO', 'CONTRATADO') RETURNING id
), participacoes AS (
  UPDATE participacoes_solicitacao p SET status = 'CANCELADO',
    motivo = 'Vínculo anterior conciliado após transferência.',
    encerrado_em = COALESCE(p.encerrado_em, CURRENT_TIMESTAMP), atualizado_em = CURRENT_TIMESTAMP
  FROM antigas a WHERE a.id = p.matricula_id
    AND p.status IN ('INDICADO', 'EM_PROCESSO', 'APROVADO', 'CONTRATADO') RETURNING p.id
)
UPDATE matriculas m SET status = 'DISPONIVEL', empresa_atual_id = NULL,
  contrato_confirmado = false, contrato_atualizado_em = NULL, atualizado_em = CURRENT_TIMESTAMP
FROM antigas a WHERE a.id = m.id;
COMMIT;
