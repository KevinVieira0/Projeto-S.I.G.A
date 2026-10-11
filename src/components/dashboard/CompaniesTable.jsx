"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  ListFilter,
  Pencil,
  X,
} from "lucide-react";
import CompanyDetails, { formatarCnpj } from "./CompanyDetails";
import CompanyEditor from "./CompanyEditor";
import { apiClient } from "@/lib/api/axiosClient";
import { useAtualizacaoDashboard } from "@/hooks/useAtualizacaoDashboard";
import DashboardCard, {
  DashboardCardHeader,
  DashboardCardFooter,
  dashboardStyles,
} from "./DashboardCard";

export default function CompaniesTable() {
  const idTitulo = useId();
  const tabelaRef = useRef(null);
  const buscaRef = useRef(null);
  const focoEmpresaRef = useRef(null);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [painel, setPainel] = useState(null);
  const [mensagem, setMensagem] = useState("");
  function fecharPainel() {
    focoEmpresaRef.current = painel.id;
    setPainel(null);
  }
  useEffect(() => {
    if (painel || carregando || !focoEmpresaRef.current) return;
    const botao = tabelaRef.current?.querySelector(
      `button[data-empresa-id="${focoEmpresaRef.current}"]`,
    );
    (botao || buscaRef.current)?.focus();
    focoEmpresaRef.current = null;
  }, [painel, carregando, dados]);
  useAtualizacaoDashboard(() => {
    setCarregando(true);
    setVersao((valor) => valor + 1);
  });
  useEffect(() => {
    const controlador = new AbortController();
    const temporizador = window.setTimeout(async () => {
      setCarregando(true);
      setErro("");
      try {
        const { data: resposta } = await apiClient.get("/admin/empresas", {
          params: { busca, status, pagina },
          signal: controlador.signal,
        });
        if (!controlador.signal.aborted) {
          const ultima = Math.max(
            1,
            Math.ceil(resposta.total / resposta.tamanhoPagina),
          );
          if (pagina > ultima) setPagina(ultima);
          else setDados(resposta);
        }
      } catch (erroCapturado) {
        if (!controlador.signal.aborted)
          setErro(
            erroCapturado.response?.data?.mensagem ||
              "Não foi possível carregar as empresas.",
          );
      } finally {
        if (!controlador.signal.aborted) setCarregando(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
  }, [busca, status, pagina, versao]);
  const paginas = Math.max(1, Math.ceil((dados?.total || 0) / 25));
  const total = dados?.total || 0;
  const inicio = total === 0 ? 0 : (pagina - 1) * 25 + 1;
  const fim = Math.min(pagina * 25, total);
  return (
    <DashboardCard aria-labelledby={idTitulo}>
      <DashboardCardHeader
        headingId={idTitulo}
        eyebrow="Cadastros"
        title="Empresas cadastradas"
        description="Clique em uma empresa para ver os detalhes, alunos vinculados e solicitações."
      />
      <div className={dashboardStyles.body}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={buscaRef}
                aria-label="Buscar empresa"
                value={busca}
                maxLength={150}
                onChange={(evento) => {
                  setBusca(evento.target.value);
                  setPagina(1);
                }}
                placeholder="Filtrar por razão social, nome, CNPJ..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setPagina(1);
                  }}
                  aria-label="Limpar filtro"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select
                aria-label="Situação cadastral"
                value={status}
                onChange={(evento) => {
                  setStatus(evento.target.value);
                  setPagina(1);
                }}
                className="h-10 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm font-medium text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">Todas as situações</option>
                <option value="ativas">Ativas</option>
                <option value="inativas">Inativas</option>
              </select>
            </div>
          </div>
        </div>
        {mensagem && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            {mensagem}
          </p>
        )}
        {erro && (
          <div role="alert" className={`mt-4 ${dashboardStyles.error}`}>
            {erro}
            <button
              onClick={() => setVersao((valor) => valor + 1)}
              className={`ml-3 ${dashboardStyles.secondaryAction}`}
            >
              Tentar novamente
            </button>
          </div>
        )}
        <div
          aria-busy={carregando}
          className="mt-4 overflow-hidden rounded-lg border border-gray-200"
        >
          <div className="overflow-x-auto">
            <table
              ref={tabelaRef}
              className="min-w-full divide-y divide-gray-200 text-sm"
            >
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Razão social",
                    "Nome fantasia",
                    "CNPJ",
                    "E-mail",
                    "Telefone",
                    "Contribuinte",
                    "Situação cadastral",
                  ].map((titulo) => (
                    <th
                      key={titulo}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {titulo}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="sticky right-0 z-10 border-l border-gray-200 bg-gray-50 px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500"
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {carregando ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      <span role="status">Carregando empresas...</span>
                    </td>
                  </tr>
                ) : dados?.itens.length ? (
                  dados.itens.map((empresa) => (
                    <tr
                      key={empresa.id}
                      className={`cursor-pointer transition-colors motion-reduce:transition-none ${painel?.id === empresa.id ? "bg-blue-50/80" : "hover:bg-gray-50/80"}`}
                      onClick={(evento) => {
                        if (evento.target.closest("button, a, input, select"))
                          return;
                        evento.currentTarget
                          .querySelector("button[data-detalhes]")
                          ?.focus();
                        setPainel({ id: empresa.id, modo: "detalhes" });
                      }}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        <button
                          type="button"
                          data-detalhes
                          data-empresa-id={empresa.id}
                          aria-haspopup="dialog"
                          aria-label={`Ver detalhes de ${empresa.razaoSocial}`}
                          className="rounded text-left font-medium text-gray-900 hover:text-[#0a3d7c] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          onClick={(evento) => {
                            evento.currentTarget.focus();
                            setPainel({ id: empresa.id, modo: "detalhes" });
                          }}
                        >
                          {empresa.razaoSocial}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {empresa.nomeFantasia || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {formatarCnpj(empresa.cnpj)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {empresa.email || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {empresa.telefone || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {empresa.contribuinte === null
                          ? "Não informado"
                          : empresa.contribuinte
                            ? "Sim"
                            : "Não"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${empresa.ativa ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-gray-100 text-gray-600 ring-gray-500/20"}`}
                        >
                          {empresa.ativa ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="sticky right-0 whitespace-nowrap border-l border-gray-100 bg-white px-4 py-3 text-right">
                        <button
                          type="button"
                          data-empresa-id={empresa.id}
                          aria-haspopup="dialog"
                          aria-label={`Editar empresa ${empresa.razaoSocial}`}
                          title="Editar empresa"
                          className="rounded-lg p-2 text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          onClick={(evento) => {
                            evento.currentTarget.focus();
                            setMensagem("");
                            setPainel({ id: empresa.id, modo: "editar" });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Nenhuma empresa encontrada com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <DashboardCardFooter className="flex-col lg:flex-row lg:justify-between">
        <span className="text-sm text-gray-500">25 linhas por página</span>
        <div className="text-sm text-gray-500" aria-live="polite">
          <span className="font-medium text-gray-800">
            {inicio}-{fim}
          </span>{" "}
          de <span className="font-medium text-gray-800">{total}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Página anterior"
            title="Página anterior"
            disabled={carregando || pagina <= 1}
            onClick={() => setPagina((valor) => valor - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-xs text-gray-500">
            {pagina} de {paginas}
          </span>
          <button
            type="button"
            aria-label="Próxima página"
            title="Próxima página"
            disabled={carregando || pagina >= paginas}
            onClick={() => setPagina((valor) => valor + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </DashboardCardFooter>
      {painel?.modo === "detalhes" && (
        <CompanyDetails
          key={`detalhes-${painel.id}`}
          empresaId={painel.id}
          onClose={fecharPainel}
          onEdit={() => {
            setMensagem("");
            setPainel({ id: painel.id, modo: "editar" });
          }}
        />
      )}
      {painel?.modo === "editar" && (
        <CompanyEditor
          key={`editar-${painel.id}`}
          empresaId={painel.id}
          onClose={fecharPainel}
          onSaved={(texto) => {
            fecharPainel();
            setMensagem(texto);
          }}
        />
      )}
    </DashboardCard>
  );
}
