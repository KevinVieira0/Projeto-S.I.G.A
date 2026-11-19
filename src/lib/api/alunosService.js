import { apiClient } from "./axiosClient";

export async function listarAlunos() {
  const { data: dados } = await apiClient.get("/admin/alunos");
  return dados;
}

export async function sincronizarAlunosDaPlanilha() {
  const { data: dados } = await apiClient.post("/admin/alunos/planilha/sincronizar", {});
  return dados;
}
