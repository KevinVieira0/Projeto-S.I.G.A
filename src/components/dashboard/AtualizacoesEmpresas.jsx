"use client";

import { Bell } from "lucide-react";
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
    <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <summary className="flex min-h-14 cursor-pointer items-center gap-3 px-5 py-4 text-sm font-semibold text-gray-800">
        <Bell className="h-4 w-4 text-[#0a3d7c]" />
        Atualizações das empresas
        <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-800">
          {eventos.length}
        </span>
      </summary>
      <div className="border-t border-gray-100 px-5 py-3">
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
          <ul className="divide-y divide-gray-100">
            {eventos.map((e) => (
              <li key={e.id} className="py-3">
                <button
                  type="button"
                  className="text-left text-sm text-gray-800 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
