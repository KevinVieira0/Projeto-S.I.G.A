const situacoes = {
  todos: {},
  ativas: { ativa: true },
  autorizadas: { ativa: true, autorizada: true },
  aguardando: { ativa: true, autorizada: false },
  inativas: { ativa: false },
};

export const statusDasEmpresas = Object.keys(situacoes);
export const ordemDaTabelaDeEmpresas = [{ razaoSocial: "asc" }, { id: "asc" }];

export function filtrarEmpresasDaTabela(busca, status) {
  const termo = busca.trim();
  if (!termo) return situacoes[status];
  const buscaPorCnpj = /^[\d.\/\-\s]+$/.test(termo);
  return {
    ...situacoes[status],
    OR: ["razaoSocial", "nomeFantasia", "cnpj", "email"].map((campo) => ({
      [campo]: {
        contains:
          campo === "cnpj" && buscaPorCnpj
            ? termo.replace(/\D/g, "") || termo
            : termo,
        mode: "insensitive",
      },
    })),
  };
}
