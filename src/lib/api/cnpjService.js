import { apiClient } from "./axiosClient";
import { onlyDigits } from "@/lib/validations/cnpjUtils";

export async function validarCnpjBeneficiaria(cnpj) {
  const cleanCnpj = onlyDigits(cnpj);
  const { data } = await apiClient.get(`/empresas/cnpj/${cleanCnpj}/validar`);
  return data;
}
