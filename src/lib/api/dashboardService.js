import { apiClient } from "./axiosClient";

export async function buscarAlunosPorCurso(opcoes = {}) {
  const { data: dados } = await apiClient.get("/admin/dashboard/alunos-por-curso", {
    signal: opcoes.signal,
  });
  return dados;
}

export async function buscarResumoDashboard(periodo, opcoes = {}) {
  const { data: dados } = await apiClient.get("/admin/dashboard/resumo", {
    params: { periodo },
    signal: opcoes.signal,
  });
  return dados;
}
