export async function createSolicitacao({ idadeMinina, sexo, pratica, cursos, inicio, fim, quantidadeAlunos, observacoes }) {
  const { data } = await apiClient.post("/api/empresa/solicitacao", {
    idadeMinina, sexo, pratica, cursos, inicio, fim, quantidadeAlunos, observacoes
  });
  return data;
}
