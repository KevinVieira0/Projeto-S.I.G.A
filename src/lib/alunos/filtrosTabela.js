export function filtrarAlunosDaTabela(alunos, busca, statusSelecionados) {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  return alunos.filter((aluno) => {
    const combinaBusca =
      !termo ||
      [aluno.nome, aluno.email, aluno.curso, aluno.turma, aluno.cpf]
        .filter(Boolean)
        .some((valor) =>
          String(valor).toLocaleLowerCase("pt-BR").includes(termo),
        );
    const combinaStatus =
      statusSelecionados.length === 0 ||
      statusSelecionados.includes(aluno.statusIndicacao || "Sem status");
    return combinaBusca && combinaStatus;
  });
}

export function ordenarAlunosDaTabela(alunos, { key, direction }) {
  return [...alunos].sort((a, b) => {
    const comparacao = String(a[key] ?? "").localeCompare(
      String(b[key] ?? ""),
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base",
      },
    );
    return direction === "asc" ? comparacao : -comparacao;
  });
}
