import { apiClient } from "./axiosClient";
import { onlyDigits } from "@/lib/validations/cnpjUtils";

/**
 * Contrato real das rotas internas (src/app/api/**):
 *
 *   POST /api/auth/admin/login   [IMPLEMENTADO — src/app/api/auth/admin/login/route.js]
 *   body: { email, senha }
 *   200 -> { mensagem, usuario: { id, nome, email, role: "admin" } }
 *   Ainda não emite token/sessão — isso é um próximo passo (ver AuthContext).
 *
 *   POST /api/auth/empresa/login   [AINDA NÃO IMPLEMENTADO]
 *   Não existe rota correspondente em src/app/api ainda. A validação de CNPJ
 *   (cnpjService.js) já funciona; falta decidir/implementar o que "login de
 *   empresa" significa de fato (sessão? apenas CNPJ autorizado?) antes de
 *   criar essa rota. Chamar loginEmpresa() hoje resulta em 404.
 */

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

