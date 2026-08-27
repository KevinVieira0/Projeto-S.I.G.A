import { apiClient } from "./axiosClient";

export async function sincronizarAlunosDaPlanilha() {
  const { data } = await apiClient.post(
    "/admin/alunos/planilha/sincronizar"
  );

  return data;
}