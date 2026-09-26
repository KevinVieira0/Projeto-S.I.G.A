import { apiClient } from "./axiosClient";

export async function buscarResumoDashboard(periodo, options = {}) {
  const { data } = await apiClient.get("/admin/dashboard/resumo", {
    params: {
      periodo,
    },
    signal: options.signal,
  });

  return data;
}
