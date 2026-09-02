import { apiClient } from "./axiosClient";

export async function createSolicitacao({ idEmpresa,idadeMinima, idadeMaxima, sexo, pratica, cursos, inicio, fim, quantidadeAlunos, observacoes }) {
  const { data } = await apiClient.post("../api/empresas/solicitacao", {
    idEmpresa,idadeMinima,idadeMaxima, sexo, pratica, cursos, inicio, fim, quantidadeAlunos, observacoes
  });
  return data;
}
