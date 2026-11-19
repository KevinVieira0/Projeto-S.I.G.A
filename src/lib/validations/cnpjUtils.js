/**
 * Remove tudo que não for dígito.
 */

export function onlyDigits(valor = "") {
  return valor.replace(/\D/g, "");
}

/**
 * Aplica a máscara 00.000.000/0000-00 enquanto o usuário digita.
 */

export function maskCnpj(valor = "") {
  return onlyDigits(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/**
 * Valida o dígito verificador do CNPJ (validação estrutural,
 * NÃO confirma se é uma empresa beneficiária - isso é feito
 * pela API em cnpjService.js).
 */

export function isValidCnpjFormat(cnpj = "") {
  const digitos = onlyDigits(cnpj);
  if (digitos.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digitos)) return false;
  const calcularDigitoVerificador = (base) => {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base
      .split("")
      .reduce(
        (acumulado, digito, indice) => acumulado + Number(digito) * pesos[indice],
        0,
      );
    const rest = soma % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const base = digitos.slice(0, 12);
  const primeiroDigito = calcularDigitoVerificador(base);
  const segundoDigito = calcularDigitoVerificador(base + primeiroDigito);
  return digitos === base + String(primeiroDigito) + String(segundoDigito);
}
