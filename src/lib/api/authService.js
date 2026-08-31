import { apiClient } from "./axiosClient";
import { onlyDigits } from "@/lib/validations/cnpjUtils";

export async function loginAdmin({ email, senha }) {
  const { data } = await apiClient.post("/auth/admin/login", { email, senha });
  return data;
}

export async function loginEmpresa({ cnpj, senha }) {
  const { data } = await apiClient.post("/auth/empresa/login", {
    cnpj: onlyDigits(cnpj),
    senha,
  });

  return data;
}
