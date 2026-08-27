"use client";

import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { useSincronizacaoAlunos } from "@/hooks/useSincronizacaoAlunos";

export default function StudentSyncCard() {
  const {
    sincronizar,
    isLoading,
    resposta,
    erro,
  } = useSincronizacaoAlunos();

  const resultado = resposta?.resultado;

  return (
    <section className="mt-8 max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Atualização de alunos
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Importe os dados atuais da planilha do Google
            Sheets para o sistema.
          </p>
        </div>

        <div className="w-full sm:w-52">
          <Button
            type="button"
            onClick={sincronizar}
            isLoading={isLoading}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Atualizar alunos
          </Button>
        </div>
      </div>

      <div className="mt-5" aria-live="polite">
        {erro && (
          <div className="flex gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{erro}</p>
          </div>
        )}

        {resposta && (
          <div
            className={`rounded-lg p-4 ${
              resultado?.erros?.length
                ? "bg-amber-50 text-amber-800"
                : "bg-green-50 text-green-800"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {resultado?.erros?.length ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}

              <p>{resposta.mensagem}</p>
            </div>

            {resultado && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <ResultItem
                  label="Recebidos"
                  value={resultado.linhasRecebidas}
                />

                <ResultItem
                  label="Criados"
                  value={resultado.criados}
                />

                <ResultItem
                  label="Atualizados"
                  value={resultado.atualizados}
                />

                <ResultItem
                  label="Ignorados"
                  value={resultado.ignorados}
                />
              </div>
            )}

            {resultado?.erros?.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {resultado.erros.map((item) => (
                  <li key={`${item.linha}-${item.mensagem}`}>
                    Linha {item.linha}: {item.mensagem}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ResultItem({ label, value }) {
  return (
    <div className="rounded-md bg-white/70 px-3 py-2">
      <p className="text-xs opacity-75">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}