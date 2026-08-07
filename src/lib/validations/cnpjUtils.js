/**
 * Remove tudo que não for dígito.
 */
export function onlyDigits(value = "") {
  return value.replace(/\D/g, "");
}

/**
 * Aplica a máscara 00.000.000/0000-00 enquanto o usuário digita.
 */
export function maskCnpj(value = "") {
  return onlyDigits(value)
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
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcCheckDigit = (base) => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base
      .split("")
      .reduce((acc, digit, i) => acc + Number(digit) * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const base = digits.slice(0, 12);
  const digit1 = calcCheckDigit(base);
  const digit2 = calcCheckDigit(base + digit1);

  return digits === base + String(digit1) + String(digit2);
}
