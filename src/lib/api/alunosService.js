import { apiClient } from "./axiosClient";

export async function listarAlunos() {
  const { data } = await apiClient.get("/admin/alunos");
  return data;
}

export async function sincronizarAlunosDaPlanilha() {
  const { data } = await apiClient.post(
    "/admin/alunos/planilha/sincronizar"
  );

  return data;
}
