import { apiClient } from "./axiosClient";

export async function createSolicitacao(values) {
  // A empresa é identificada pelo cookie HttpOnly, nunca pelo formulário.
  const { data } = await apiClient.post("/empresas/solicitacao", values);
  return data;
}
