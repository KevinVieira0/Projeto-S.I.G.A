"use client";

import { useCallback, useEffect, useState } from "react";

const rotulosCampos = {
  nome: "Nome / razão social",
  documento: "CPF / CNPJ",
  nascimento: "Data de nascimento",
  genero: "Gênero",
  celular: "Celular",
  telefone: "Telefone",
  email: "E-mail",
  endereco: "Endereço",
  cep: "CEP",
  nomeFantasia: "Nome fantasia",
  contribuinte: "Contribuinte",
  termo: "Termo",
  situacao: "Situação profissional declarada",
  empresaInformada: "Empresa declarada",
  cnpjInformado: "CNPJ declarado",
};
const camposCadastroAtual = {
  nome: "razaoSocial",
  documento: "cpf",
  nascimento: "dataNascimento",
};
const exibir = (valor) =>
  valor === true
    ? "Sim"
    : valor === false
      ? "Não"
      : valor === null || valor === undefined || valor === ""
        ? "—"
        : String(valor);

async function api(url, corpo) {
  const resposta = await fetch(url, {
    cache: "no-store",
    ...(corpo
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        }
      : {}),
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível concluir.");
  return dados;
}

function obterValorAtual(detalhe, campo) {
  if (campo === "documento") return detalhe.atual?.cpf || detalhe.atual?.cnpj;
  const valor = detalhe.atual?.[campo] ?? detalhe.atual?.[camposCadastroAtual[campo]];
  return campo === "nascimento" && valor ? valor.slice(0, 10) : valor;
}

export default function RecebimentosCadastro({ tipo }) {
  const [lista, setLista] = useState({ itens: [], total: 0 });
  const [pagina, setPagina] = useState(1);
  const [detalhe, setDetalhe] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [academico, setAcademico] = useState(false);
  const [status, setStatus] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const carregar = useCallback(
    async () =>
      setLista(await api(`/api/admin/recebimentos?tipo=${tipo}&pagina=${pagina}`)),
    [tipo, pagina],
  );
  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
  }, [carregar]);
  async function executar(operacao) {
    setOcupado(true);
    setErro("");
    setAviso("");
    try {
      await operacao();
    } catch (erroCapturado) {
      setErro(erroCapturado.message);
    } finally {
      setOcupado(false);
    }
  }
  const abrir = (id) =>
    executar(async () => {
      const dados = await api(`/api/admin/recebimentos/${id}`);
      setDetalhe(dados);
      setAcademico(!dados.atual);
      setStatus("");
      setEmpresaId("");
    });
  const confirmar = (acao) =>
    executar(async () => {
      const recebimento = await api(`/api/admin/recebimentos/${detalhe.id}`, {
        acao,
        hash: detalhe.hash,
        versao: detalhe.versao,
        atualizarAcademico: academico,
        ...(status ? { status } : {}),
        ...(empresaId ? { empresaId } : {}),
      });
      setDetalhe(null);
      setAviso(
        recebimento.estado === "APROVADO"
          ? "Cadastro confirmado no sistema."
          : "Recebimento rejeitado.",
      );
      window.dispatchEvent(new Event("alunos:sincronizados"));
      await carregar();
    });

  function buscarRespostas() {
    return executar(async () => {
      const resultado = await api("/api/admin/recebimentos", {});
      await carregar();
      window.dispatchEvent(new Event("alunos:sincronizados"));
      setAviso(
        `${resultado.novos} novos recebimentos. Alunos: ${resultado.alunos?.criados || 0} criados e ${resultado.alunos?.atualizados || 0} atualizados automaticamente. Empresas aguardam conferência. ${resultado.alterados} envios alterados na origem precisam de novo envio.`,
      );
    });
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cadastros recebidos</h2>
          <p className="text-sm text-slate-500">
            Confira os dados antes de cadastrar ou atualizar. {lista.total} pendentes.
          </p>
        </div>
        <button
          disabled={ocupado}
          onClick={buscarRespostas}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {ocupado ? "Aguarde…" : "Buscar respostas"}
        </button>
      </div>
      {erro && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-800">
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="mt-4 rounded-lg bg-blue-50 p-3 text-blue-900">
          {aviso}
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-slate-500">
            <tr>
              <th className="p-3">Nome</th>
              <th>Documento</th>
              <th>Recebimento</th>
              <th>Conferência</th>
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.itens.map((recebimento) => (
              <tr key={recebimento.id} className="border-b border-slate-100">
                <td className="p-3">{recebimento.nome}</td>
                <td>{recebimento.documento}</td>
                <td>{new Date(recebimento.recebidoEm).toLocaleString("pt-BR")}</td>
                <td>
                  {recebimento.erros.length ? "Dados a corrigir" : "Aguardando revisão"}
                </td>
                <td>
                  <button
                    disabled={ocupado}
                    onClick={() => abrir(recebimento.id)}
                    className="p-3 font-medium text-blue-700"
                  >
                    Conferir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!lista.itens.length && (
          <p className="p-6 text-center text-slate-500">
            Nenhum recebimento pendente nesta página.
          </p>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-4 text-sm">
        <button
          disabled={pagina === 1 || ocupado}
          onClick={() => setPagina((p) => p - 1)}
        >
          Anterior
        </button>
        <span>Página {pagina}</span>
        <button
          disabled={pagina * 25 >= lista.total || ocupado}
          onClick={() => setPagina((p) => p + 1)}
        >
          Próxima
        </button>
      </div>
      {detalhe && (
        <section
          aria-label="Conferência do cadastro"
          className="mt-6 rounded-xl border border-blue-200 bg-slate-50 p-4"
        >
          <div className="flex justify-between gap-3">
            <h3 className="font-semibold">
              {detalhe.atual ? "Atualizar cadastro existente" : "Criar novo cadastro"}
            </h3>
            <button
              disabled={ocupado}
              onClick={() => setDetalhe(null)}
              className="text-blue-700"
            >
              Fechar
            </button>
          </div>
          <p className="my-3 text-sm text-slate-600">
            Confirme a identidade e os dados com o responsável. Campos opcionais em branco
            preservam os valores atuais. Permissões de acesso e senhas não são alteradas.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Campo</th>
                  <th>Atual no sistema</th>
                  <th>Informado</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rotulosCampos)
                  .filter(([chave]) => chave in detalhe.dados)
                  .map(([chave, rotulo]) => {
                    const valor = obterValorAtual(detalhe, chave);
                    return (
                      <tr key={chave} className="border-t border-slate-200">
                        <th className="p-2 font-medium">{rotulo}</th>
                        <td className="break-words p-2">{exibir(valor)}</td>
                        <td className="break-words p-2">
                          {exibir(detalhe.dados[chave])}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {tipo === "ALUNO" && (
            <div className="my-4 space-y-3 text-sm">
              <p>
                <strong>Turma informada:</strong>{" "}
                {detalhe.dados.oferta
                  ? `${detalhe.dados.oferta.nome} · ${detalhe.dados.oferta.codigo} · ${detalhe.dados.oferta.turno} · ${detalhe.dados.oferta.inicio} a ${detalhe.dados.oferta.fim}`
                  : "Inválida"}
              </p>
              <p>
                <strong>Vínculo atual:</strong>{" "}
                {detalhe.atual
                  ? `${detalhe.atual.curso} · ${detalhe.atual.turma} · ${detalhe.atual.statusIndicacao}`
                  : "Nenhum"}
              </p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={academico}
                  disabled={!detalhe.atual || ocupado}
                  onChange={(evento) => setAcademico(evento.target.checked)}
                />
                Confirmar dados acadêmicos e usar esta turma na visão geral
              </label>
              {academico && (
                <>
                  <p>
                    Uma matrícula existente mantém seu status e empresa. Para uma nova
                    matrícula, escolha o status inicial. Os vínculos anteriores ficam no
                    histórico.
                  </p>
                  <label className="block">
                    Status inicial
                    <select
                      value={status}
                      onChange={(evento) => {
                        setStatus(evento.target.value);
                        setEmpresaId("");
                      }}
                      className="ml-3 rounded border p-2"
                    >
                      <option value="">Selecione se for nova matrícula</option>
                      {Object.entries({
                        DISPONIVEL: "Disponível",
                        INDICADO: "Indicado",
                        EM_PROCESSO: "Em processo",
                        CONTRATADO: "Contratado",
                      }).map(([valor, l]) => (
                        <option key={valor} value={valor}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  {status && status !== "DISPONIVEL" && (
                    <label className="block">
                      Empresa confirmada
                      <select
                        value={empresaId}
                        onChange={(evento) => setEmpresaId(evento.target.value)}
                        className="ml-3 max-w-full rounded border p-2"
                      >
                        <option value="">Selecione</option>
                        {detalhe.empresas.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.razaoSocial} · {e.cnpj}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}
            </div>
          )}
          {detalhe.erros.length > 0 && (
            <ul className="my-3 list-inside list-disc text-sm text-red-800">
              {detalhe.erros.map((e, indice) => (
                <li key={indice}>{e}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              disabled={ocupado || detalhe.erros.length > 0}
              onClick={() => confirmar("aprovar")}
              className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-40"
            >
              Confirmar {detalhe.atual ? "atualização" : "cadastro"}
            </button>
            <button
              disabled={ocupado}
              onClick={() => confirmar("rejeitar")}
              className="rounded-lg border border-slate-300 px-4 py-2"
            >
              Rejeitar recebimento
            </button>
            <button
              disabled={ocupado}
              onClick={() => abrir(detalhe.id)}
              className="px-4 py-2 text-blue-700"
            >
              Recarregar conferência
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
