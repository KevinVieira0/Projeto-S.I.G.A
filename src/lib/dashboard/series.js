export const seriesDaVisao = {
  alunos: {
    titulo: "Indicações e contratações",
    descricao: "Alunos por semana no fluxo de solicitações",
    explicacao:
      "Cada ponto conta alunos distintos. As indicações usam a data do envio e as contratações usam a data em que foram registradas.",
    unidade: "Semanas",
    campo: "semanas",
    periodos: [4, 8],
    series: [
      { chave: "indicados", rotulo: "Alunos indicados", cor: "#0a3d7c" },
      { chave: "contratados", rotulo: "Alunos contratados", cor: "#087a65" },
    ],
  },
  empresas: {
    titulo: "Vagas e contratações",
    descricao: "Por mês de recebimento da solicitação",
    explicacao:
      "As contratações são associadas ao mês em que o pedido foi recebido, mesmo quando foram registradas em outro mês.",
    unidade: "Meses",
    campo: "meses",
    periodos: [3, 6],
    series: [
      { chave: "vagas", rotulo: "Vagas solicitadas", cor: "#0a3d7c" },
      {
        chave: "contratacoes",
        rotulo: "Contratações nos mesmos pedidos",
        cor: "#087a65",
      },
    ],
  },
};

export function recortesIniciais(visao) {
  return {
    serie: seriesDaVisao[visao].periodos[0],
    panorama: "todos",
    curso: "todos",
  };
}
