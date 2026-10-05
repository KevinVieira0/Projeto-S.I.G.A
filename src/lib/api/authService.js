import { apiClient } from "./axiosClient";
import { onlyDigits } from "@/lib/validations/cnpjUtils";

export async function loginAdmin({ email, senha }) {
  const { data: dados } = await apiClient.post("/auth/admin/login", { email, senha });
  return dados;
}

export async function loginEmpresa({ cnpj, senha }) {
  const { data: dados } = await apiClient.post("/auth/empresa/login", {
    cnpj: onlyDigits(cnpj),
    senha,
  });
  return dados;
}

export async function obterSessao() {
  const { data: dados } = await apiClient.get("/auth/session");
  return dados;
}

export async function encerrarSessao() {
  await apiClient.post("/auth/logout", {});
}
