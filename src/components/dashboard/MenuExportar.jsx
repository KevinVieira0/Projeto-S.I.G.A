"use client";

import { useState } from "react";
import { ChevronDown, Download, FileText, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/axiosClient";
import { baixarArquivo } from "@/lib/api/baixarArquivo";
import { recortesIniciais } from "@/lib/dashboard/series";
import { todayInSaoPaulo } from "@/lib/validations/solicitacaoSchema";
import { useRecortesDaVisao } from "./RecortesDaVisao";
import { dashboardStyles } from "./DashboardCard";

const classeOpcao =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 focus-visible:outline-blue-600 disabled:opacity-50 motion-reduce:transition-none";

export default function MenuExportar({
  visao,
  filtro,
  opcoes = [],
  desabilitado,
}) {
  const contexto = useRecortesDaVisao();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function exportarPdf(evento) {
    if (carregando || desabilitado) return;
    const menu = evento.currentTarget.closest("details");
    menu.open = false;
    menu.querySelector("summary").focus();
    setCarregando(true);
    setErro("");
    try {
      const { data: arquivo } = await apiClient.post(
        "/admin/dashboard/relatorio",
        {
          visao,
          filtro,
          recortes: contexto?.recortes ?? recortesIniciais(visao),
        },
        { responseType: "blob" },
      );
      baixarArquivo(
        `siga-relatorio-${visao}-${todayInSaoPaulo()}.pdf`,
        arquivo,
      );
    } catch {
      setErro("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="max-w-full self-start xl:self-auto">
      <details className="siga-menu-expansivel relative">
        <summary
          className={`siga-cabecalho-expansivel cursor-pointer ${dashboardStyles.primaryAction}`}
          aria-busy={carregando}
        >
          {carregando ? (
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {carregando ? "Gerando PDF…" : "Exportar"}
          <ChevronDown className="siga-seta-expansao" aria-hidden="true" />
        </summary>
        <div className="siga-card absolute left-0 z-30 mt-2 w-48 p-1.5 xl:left-auto xl:right-0">
          <button
            type="button"
            className={classeOpcao}
            disabled={carregando || desabilitado}
            onClick={exportarPdf}
          >
            <FileText className="h-4 w-4 text-[#0a3d7c]" aria-hidden="true" />
            Exportar em PDF
          </button>
          {opcoes.map(({ rotulo, acao }) => (
            <button
              key={rotulo}
              type="button"
              className={classeOpcao}
              disabled={desabilitado}
              onClick={(evento) => {
                const menu = evento.currentTarget.closest("details");
                menu.open = false;
                menu.querySelector("summary").focus();
                acao();
              }}
            >
              <Download className="h-4 w-4 text-gray-400" aria-hidden="true" />
              {rotulo}
            </button>
          ))}
        </div>
      </details>
      {erro && (
        <p role="alert" className="mt-2 max-w-48 text-xs text-rose-700">
          {erro}
        </p>
      )}
    </div>
  );
}
