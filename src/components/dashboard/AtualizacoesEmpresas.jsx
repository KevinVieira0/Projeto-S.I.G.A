"use client";

import { Bell, ChevronDown } from "lucide-react";
import { useDadosEmpresa } from "@/components/empresa/acompanhamento/base";
import {
  dataEmpresa,
  rotulosParticipacao,
} from "@/components/empresa/acompanhamento/base";

export default function AtualizacoesEmpresas({ abrirSolicitacao, atualizar }) {
  const { dados, erro, recarregar } = useDadosEmpresa(
    "/admin/solicitacoes/atualizacoes",
  );
  const eventos = dados?.atualizacoes || [];
  return (
    <details className="siga-card siga-card-interativo siga-expansivel">
      <summary className="siga-cabecalho-expansivel flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus-visible:outline-blue-600">
        <Bell className="h-4 w-4 shrink-0 text-[#0a3d7c]" aria-hidden="true" />
        Atualizações das empresas
        <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-800">
          {eventos.length}
        </span>
        <ChevronDown
          className="siga-seta-expansao text-slate-500"
          aria-hidden="true"
        />
      </summary>
      <div className="max-h-[min(26rem,55dvh)] overflow-y-auto overscroll-contain border-t border-gray-100 px-4 py-3 sm:px-5">
        {erro ? (
          <p className="text-sm text-red-700">
            {erro}
            <button
              type="button"
              onClick={recarregar}
              className="ml-2 underline"
            >
              Tentar novamente
            </button>
          </p>
        ) : eventos.length === 0 ? (
          <p className="py-2 text-sm text-gray-500">
            Nenhuma atualização de acompanhamento recebida.
          </p>
        ) : (
          <ul className="siga-grade-compacta [--siga-coluna-card:18rem]">
            {eventos.map((e) => (
              <li key={e.id} className="min-w-0 rounded-lg bg-slate-50 px-3 py-3">
                <button
                  type="button"
                  className="w-full break-words rounded-md text-left text-sm text-gray-800 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 motion-safe:transition-colors"
                  onClick={() => {
                    atualizar();
                    abrirSolicitacao(e.solicitacaoId);
                  }}
                >
                  <span className="font-semibold">{e.empresa}</span> · {e.aluno}
                  <span className="mt-1 block text-xs text-gray-500">
                    {e.descricao || rotulosParticipacao[e.status]} ·{" "}
                    {dataEmpresa(e.registradoEm, true)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
