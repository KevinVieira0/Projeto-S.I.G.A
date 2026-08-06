import { apiClient } from "./axiosClient";
import { onlyDigits } from "@/lib/validations/cnpjUtils";

/**
 * CONTRATO sugerido (alinhar com o back):
 *
 *   POST /auth/admin/login
 *   body: { email, senha }
 *   200 -> { token, usuario: { id, nome, email, role: "admin" } }
 *
 *   POST /auth/empresa/login
 *   body: { cnpj }
 *   200 -> { token, empresa: { id, cnpj, razaoSocial } }
 */

export async function loginAdmin({ email, senha }) {
  const { data } = await apiClient.post("/auth/admin/login", { email, senha });
  return data;
}

export async function loginEmpresa({ cnpj }) {
  const { data } = await apiClient.post("/auth/empresa/login", {
    cnpj: onlyDigits(cnpj),
  });
  return data;
}
