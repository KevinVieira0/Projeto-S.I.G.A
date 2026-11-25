import { apiClient } from "./axiosClient";

export async function buscarAlunosPorCurso(opcoes = {}) {
  const { data: dados } = await apiClient.get(
    "/admin/dashboard/alunos-por-curso",
    {
      params: { status: opcoes.status },
      signal: opcoes.signal,
    },
  );
  return dados;
}

export async function buscarIndicadoresDashboard(visao, opcoes = {}) {
  const { data: dados } = await apiClient.get("/admin/dashboard/indicadores", {
    params: { visao },
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
