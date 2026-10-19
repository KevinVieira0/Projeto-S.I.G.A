import { apiClient } from "./axiosClient";
import { onlyDigits } from "@/lib/validations/cnpjUtils";

export async function validarCnpjBeneficiaria(cnpj) {
  const cnpjLimpo = onlyDigits(cnpj);
  const { data: dados } = await apiClient.get(`/empresas/cnpj/${cnpjLimpo}/validar`);
  return dados;
}
