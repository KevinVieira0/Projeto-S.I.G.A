import { apiClient } from "./axiosClient";
import { onlyDigits } from "@/lib/validations/cnpjUtils";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_CNPJ_MOCK === "true";

/**
 * CONTRATO esperado com o backend (alinhar com o time de back):
 *
 *   GET /empresas/cnpj/:cnpj/validar
 *
 *   200 OK
 *   { "beneficiaria": true, "razaoSocial": "Empresa Exemplo LTDA" }
 *
 *   404 Not Found -> CNPJ não encontrado / não é beneficiária
 *   { "beneficiaria": false, "message": "CNPJ não localizado" }
 *
 * Enquanto o endpoint real não existe, mantenha
 * NEXT_PUBLIC_USE_CNPJ_MOCK=true no .env.local.
 */
export async function validarCnpjBeneficiaria(cnpj) {
  const cleanCnpj = onlyDigits(cnpj);

  if (USE_MOCK) {
    return mockValidarCnpj(cleanCnpj);
  }

  const { data } = await apiClient.get(`/empresas/cnpj/${cleanCnpj}/validar`);
  return data; // { beneficiaria, razaoSocial }
}

/**
 * Mock local só para desenvolvimento do front antes do endpoint existir.
 * Ajuste a lista abaixo com CNPJs de teste combinados com o back.
 */
function mockValidarCnpj(cleanCnpj) {
  const CNPJS_BENEFICIARIOS_MOCK = ["11222333000181", "00000000000191"];

  return new Promise((resolve) => {
    setTimeout(() => {
      const beneficiaria = CNPJS_BENEFICIARIOS_MOCK.includes(cleanCnpj);
      resolve({
        beneficiaria,
        razaoSocial: beneficiaria ? "Empresa Exemplo LTDA (mock)" : null,
      });
    }, 600); // simula latência de rede
  });
}
