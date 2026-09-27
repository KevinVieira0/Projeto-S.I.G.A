import { apiClient } from "./axiosClient";

export async function buscarAlunosPorCurso(options = {}) {
  const { data } = await apiClient.get("/admin/dashboard/alunos-por-curso", {
    signal: options.signal,
  });
  return data;
}

export async function buscarResumoDashboard(periodo, options = {}) {
  const { data } = await apiClient.get("/admin/dashboard/resumo", {
    params: {
      periodo,
    },
    signal: options.signal,
  });

  return data;
}
