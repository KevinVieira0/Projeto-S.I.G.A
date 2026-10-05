import { apiClient } from "./axiosClient";

export async function createSolicitacao(valores) {
  // A empresa é identificada pelo cookie HttpOnly, nunca pelo formulário.
  const { data: dados } = await apiClient.post("/empresas/solicitacao", valores);
  return dados;
}
