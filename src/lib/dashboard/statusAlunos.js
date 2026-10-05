const grupos = {
  disponivel: { id: "disponiveis", label: "Disponíveis" },
  indicado: { id: "indicados", label: "Indicados" },
  emprocesso: { id: "em-processo", label: "Em processo" },
  contratado: { id: "contratados", label: "Empregados" },
};

export function consolidarStatusAlunos(linhas) {
  const totais = Object.fromEntries(Object.keys(grupos).map((chave) => [chave, 0]));
  for (const registro of linhas) {
    const chave = String(registro.statusIndicacao || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    totais[
      chave === "empregado"
        ? "contratado"
        : Object.hasOwn(grupos, chave)
          ? chave
          : "disponivel"
    ] += registro._count._all;
  }
  const categorias = Object.entries(grupos)
    .filter(
      ([chave]) =>
        totais[chave] > 0 ||
        ["disponivel", "indicado", "emprocesso", "contratado"].includes(chave),
    )
    .map(([chave, valor]) => ({ ...valor, valor: totais[chave] }));
  return {
    total: Object.values(totais).reduce((a, b) => a + b, 0),
    categorias,
    resumo: { indicados: totais.indicado, disponiveis: totais.disponivel },
  };
}
