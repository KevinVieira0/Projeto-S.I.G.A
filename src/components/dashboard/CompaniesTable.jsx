"use client";

import { useEffect, useId, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/axiosClient";
import { useAtualizacaoDashboard } from "@/hooks/useAtualizacaoDashboard";
import DashboardCard, {
  DashboardCardHeader,
  DashboardCardFooter,
  dashboardStyles,
} from "./DashboardCard";

export default function CompaniesTable() {
  const idTitulo = useId();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  useAtualizacaoDashboard(() => setVersao((valor) => valor + 1));
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
          const ultima = Math.max(1, Math.ceil(resposta.total / resposta.tamanhoPagina));
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
  return (
    <DashboardCard aria-labelledby={idTitulo}>
      <DashboardCardHeader
        headingId={idTitulo}
        eyebrow="Beneficiárias"
        title="Empresas cadastradas"
        description="Empresas beneficiárias conferidas pela coordenação e sua situação cadastral."
      />
      <div className="flex flex-wrap gap-3 px-5 py-4">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-gray-500">
          Buscar empresa
          <input
            value={busca}
            maxLength={150}
            onChange={(evento) => {
              setBusca(evento.target.value);
              setPagina(1);
            }}
            placeholder="Razão social, nome fantasia, CNPJ ou e-mail"
            className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Situação cadastral
          <select
            value={status}
            onChange={(evento) => {
              setStatus(evento.target.value);
              setPagina(1);
            }}
            className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todas</option>
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
          </select>
        </label>
      </div>
      <div aria-busy={carregando} className="px-5 pb-5">
        {erro ? (
          <div role="alert" className={dashboardStyles.error}>
            {erro}
            <button
              onClick={() => setVersao((valor) => valor + 1)}
              className={`ml-3 ${dashboardStyles.secondaryAction}`}
            >
              Tentar novamente
            </button>
          </div>
        ) : carregando ? (
          <p role="status" className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <RefreshCw
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Carregando empresas…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  {[
                    "Razão social",
                    "Nome fantasia",
                    "CNPJ",
                    "E-mail",
                    "Telefone",
                    "Contribuinte",
                    "Situação cadastral",
                  ].map((t) => (
                    <th
                      key={t}
                      scope="col"
                      className="whitespace-nowrap px-3 py-3 font-semibold"
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados?.itens.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-gray-100 text-gray-700 hover:bg-gray-50"
                  >
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {e.razaoSocial}
                    </td>
                    <td className="px-3 py-3">{e.nomeFantasia || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {e.cnpj.replace(
                        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                        "$1.$2.$3/$4-$5",
                      )}
                    </td>
                    <td className="px-3 py-3">{e.email || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{e.telefone || "—"}</td>
                    <td className="px-3 py-3">
                      {e.contribuinte === null
                        ? "Não informado"
                        : e.contribuinte
                          ? "Sim"
                          : "Não"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${!e.ativa ? "bg-gray-100 text-gray-600" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {!e.ativa ? "Inativa" : "Ativa"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!dados?.itens.length && (
              <p role="status" className="py-6 text-center text-sm text-gray-500">
                Nenhuma empresa encontrada.
              </p>
            )}
          </div>
        )}
      </div>
      <DashboardCardFooter className="justify-between">
        <span>
          {dados?.total || 0} empresas · página {pagina} de {paginas}
        </span>
        <div className="flex gap-2">
          <button
            disabled={carregando || pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
            className={dashboardStyles.secondaryAction}
          >
            Anterior
          </button>
          <button
            disabled={carregando || pagina >= paginas}
            onClick={() => setPagina((p) => p + 1)}
            className={dashboardStyles.secondaryAction}
          >
            Próxima
          </button>
        </div>
      </DashboardCardFooter>
    </DashboardCard>
  );
}
