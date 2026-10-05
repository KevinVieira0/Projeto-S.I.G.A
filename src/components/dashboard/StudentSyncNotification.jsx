"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Clock3, RefreshCw } from "lucide-react";
import {
  INTERVALO_SINCRONIZACAO_MS,
  useSincronizacaoAlunos,
} from "@/hooks/useSincronizacaoAlunos";

export default function StudentSyncNotification() {
  const [aberta, setAberta] = useState(false);
  const {
    isLoading: carregando,
    resposta,
    erro,
    ultimaSincronizacao,
  } = useSincronizacaoAlunos({
    automatico: true,
    intervaloMs: INTERVALO_SINCRONIZACAO_MS,
  });
  const resultado = resposta?.resultado;
  const possuiErros =
    resultado?.erros?.length > 0 ||
    Boolean(resposta?.recebimentos?.erro) ||
    resposta?.recebimentos?.alterados > 0 ||
    resposta?.recebimentos?.alunos?.invalidos > 0 ||
    resposta?.recebimentos?.alunos?.falhas > 0;
  const minutos = Math.round(INTERVALO_SINCRONIZACAO_MS / 60_000);
  let titulo = "Sincronização automática ativa";
  let descricao = `Atualização a cada ${minutos} minutos`;
  let corBolinha = "bg-blue-500";
  let Icone = Clock3;
  if (carregando) {
    titulo = "Sincronizando alunos";
    descricao = "Buscando dados do Google Sheets";
    corBolinha = "bg-blue-500";
    Icone = RefreshCw;
  } else if (erro) {
    titulo = "Falha na sincronização";
    descricao = "Clique para visualizar o erro";
    corBolinha = "bg-red-500";
    Icone = AlertCircle;
  } else if (resposta && possuiErros) {
    titulo = "Sincronização com pendências";
    descricao = "Algumas linhas possuem erros";
    corBolinha = "bg-amber-500";
    Icone = AlertCircle;
  } else if (resposta) {
    titulo = resposta?.desativada ? "Integração desativada" : "Cadastros atualizados";
    descricao = ultimaSincronizacao
      ? `Atualizado às ${formatarHorario(ultimaSincronizacao)}`
      : "Sincronização concluída";
    corBolinha = "bg-emerald-500";
    Icone = CheckCircle2;
  }
  return (
    <div
      className="
        absolute left-4 right-4 top-4 z-[70]
        sm:left-auto sm:right-6 sm:w-[370px]
      "
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-900/10">
        <button
          type="button"
          onClick={() => setAberta((valor) => !valor)}
          aria-expanded={aberta}
          className="
            flex w-full items-center gap-3 px-4 py-3
            text-left transition hover:bg-gray-50
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-inset
            focus-visible:ring-blue-600
          "
        >
          <span className="relative flex h-3 w-3 shrink-0">
            {carregando && (
              <span
                className="
                  absolute inline-flex h-full w-full
                  animate-ping rounded-full
                  bg-blue-400 opacity-75
                "
              />
            )}

            <span className={`relative inline-flex h-3 w-3 rounded-full ${corBolinha}`} />
          </span>

          <Icone
            className={`h-5 w-5 shrink-0 text-gray-500 ${carregando ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{titulo}</p>

            <p className="truncate text-xs text-gray-500">{descricao}</p>
          </div>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${aberta ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {aberta && (
          <div className="border-t border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">Intervalo automático</p>

              <p className="text-xs font-semibold text-blue-900">{minutos} minutos</p>
            </div>

            {ultimaSincronizacao && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">Última sincronização</p>

                <p className="text-xs font-medium text-gray-700">
                  {formatarDataHora(ultimaSincronizacao)}
                </p>
              </div>
            )}

            {erro && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-relaxed text-red-700">
                {erro}
              </div>
            )}

            {resposta?.recebimentos && (
              <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
                {resposta.recebimentos.erro ||
                  `${resposta.recebimentos.alunos?.criados || 0} alunos criados e ${resposta.recebimentos.alunos?.atualizados || 0} atualizados automaticamente. ${resposta.recebimentos.alunos?.invalidos || 0} envios de alunos inválidos e ${resposta.recebimentos.alunos?.falhas || 0} falhas de processamento. Empresas aguardam conferência. ${resposta.recebimentos.alterados} envios alterados na origem precisam de um novo envio.`}
              </p>
            )}

            {resultado && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Resultado label="Recebidos" valor={resultado.linhasRecebidas} />

                  <Resultado label="Adicionados" valor={resultado.criados} />

                  <Resultado label="Atualizados" valor={resultado.atualizados} />

                  <Resultado label="Ignorados" valor={resultado.ignorados} />
                </div>

                {possuiErros && (
                  <div className="mt-3 rounded-lg bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-800">
                      Pendências encontradas
                    </p>

                    <ul className="mt-2 space-y-1 text-xs text-amber-700">
                      {resultado.erros?.map((item) => (
                        <li key={`${item.linha}-${item.mensagem}`}>
                          Linha {item.linha}: {item.mensagem}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {!resposta && !erro && (
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                A primeira sincronização será executada automaticamente.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Resultado({ label: rotulo, valor }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-[11px] text-gray-500">{rotulo}</p>

      <p className="mt-1 text-lg font-semibold text-gray-900">{valor ?? 0}</p>
    </div>
  );
}

function formatarHorario(dados) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    dados,
  );
}

function formatarDataHora(dados) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(dados);
}
