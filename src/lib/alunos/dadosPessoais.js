import { todayInSaoPaulo } from "../validations/solicitacaoSchema";

export function calcularIdade(nascimento, hoje = todayInSaoPaulo()) {
  const anos = Number(hoje.slice(0, 4)) - Number(nascimento.slice(0, 4));
  const aniversarioPendente = hoje.slice(5) < nascimento.slice(5);
  return anos - (aniversarioPendente ? 1 : 0);
}

// Gera somente dados pessoais; turma, status e salvamento continuam manuais.
export function gerarDadosAlunoTeste() {
  const aleatorio = new Uint32Array(1);
  let cpf;
  do {
    globalThis.crypto.getRandomValues(aleatorio);
    cpf = String(aleatorio[0] % 1_000_000_000).padStart(9, "0");
  } while (/^(\d)\1{8}$/.test(cpf));
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    const soma = [...cpf].reduce(
      (total, digito, indice) => total + Number(digito) * (tamanho + 1 - indice),
      0,
    );
    const resto = soma % 11;
    cpf += resto < 2 ? "0" : String(11 - resto);
  }
  const ano = Number(todayInSaoPaulo().slice(0, 4)) - 19;
  return {
    nome: `Aluno Teste ${cpf.slice(0, 6)}`,
    cpf,
    dataNascimento: `${ano}-03-15`,
    email: `aluno.teste.${cpf}@example.invalid`,
    celular: "11000000000",
    genero: "Prefiro não informar",
    telefone: "",
    endereco: "",
    cep: "",
  };
}
