import { apiClient } from "./axiosClient";

export async function createSolicitacao({ idadeMinima, sexo, pratica, cursos, inicio, fim, quantidadeAlunos, observacoes }) {
  const { data } = await apiClient.post("/empresas/solicitacao", {
    idadeMinima, sexo, pratica, cursos, inicio, fim, quantidadeAlunos, observacoes
  });
  return data;
}
