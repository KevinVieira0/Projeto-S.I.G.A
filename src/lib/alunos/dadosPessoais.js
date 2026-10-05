import { todayInSaoPaulo } from "../validations/solicitacaoSchema";

export function calcularIdade(nascimento, hoje = todayInSaoPaulo()) {
  const anos = Number(hoje.slice(0, 4)) - Number(nascimento.slice(0, 4));
  const aniversarioPendente = hoje.slice(5) < nascimento.slice(5);
  return anos - (aniversarioPendente ? 1 : 0);
}
