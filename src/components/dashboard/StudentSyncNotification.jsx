"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  RefreshCw,
} from "lucide-react";
import {
  INTERVALO_SINCRONIZACAO_MS,
  useSincronizacaoAlunos,
} from "@/hooks/useSincronizacaoAlunos";

export default function StudentSyncNotification() {
  const {
    isLoading: carregando,
    resposta,
    erro,
    ultimaSincronizacao,
  } = useSincronizacaoAlunos({
    automatico: true,
    intervaloMs: INTERVALO_SINCRONIZACAO_MS,
  });
  const possuiErros =
    Boolean(resposta?.recebimentos?.erro) ||
    resposta?.recebimentos?.alterados > 0 ||
    resposta?.recebimentos?.alunos?.invalidos > 0 ||
    resposta?.recebimentos?.alunos?.falhas > 0 ||
    resposta?.recebimentos?.empresas?.invalidos > 0 ||
    resposta?.recebimentos?.empresas?.falhas > 0 ||
    resposta?.recebimentos?.espelho?.falha;
  const minutos = Math.round(INTERVALO_SINCRONIZACAO_MS / 60_000);
  let titulo = "Sincronização automática ativa";
  let descricao = `Atualização a cada ${minutos} minutos`;
  let corBolinha = "bg-blue-500";
  let Icone = Clock3;
  if (carregando) {
    titulo = "Sincronizando cadastros";
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
    titulo = resposta?.desativada
      ? "Integração desativada"
      : "Cadastros atualizados";
    descricao = ultimaSincronizacao
      ? `Atualizado às ${formatarHorario(ultimaSincronizacao)}`
      : "Sincronização concluída";
    corBolinha = "bg-emerald-500";
    Icone = CheckCircle2;
  }
  return (
    <div className="w-full" aria-live="polite">
      <details className="siga-card siga-card-interativo siga-expansivel siga-aviso-sync ml-auto overflow-hidden">
        <summary
          className="
            siga-cabecalho-expansivel flex w-full cursor-pointer items-center gap-3 px-4 py-3
            text-left hover:bg-gray-50
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
                  rounded-full motion-safe:animate-ping
                  bg-blue-400 opacity-75
                "
              />
            )}

            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${corBolinha}`}
            />
          </span>

          <Icone
            className={`h-5 w-5 shrink-0 text-gray-500 ${carregando ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {titulo}
            </p>

            <p className="truncate text-xs text-gray-500">{descricao}</p>
          </div>

          <ChevronDown
            className="siga-seta-expansao text-gray-500"
            aria-hidden="true"
          />
        </summary>

        <div className="border-t border-gray-100 px-4 py-4">
          <dl className="flex flex-wrap gap-3">
            <div className="min-w-0 grow basis-44 rounded-lg bg-slate-50 px-3 py-2.5">
              <dt className="text-xs text-gray-600">Intervalo automático</dt>

              <dd className="mt-1 text-sm font-semibold text-blue-900">
                {minutos} minutos
              </dd>
            </div>

            {ultimaSincronizacao && (
              <div className="min-w-0 grow basis-44 rounded-lg bg-slate-50 px-3 py-2.5">
                <dt className="text-xs text-gray-600">Última sincronização</dt>

                <dd className="mt-1 text-sm font-medium text-gray-700">
                  {formatarDataHora(ultimaSincronizacao)}
                </dd>
              </div>
            )}
          </dl>

          {erro && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-relaxed text-red-700">
              {erro}
            </div>
          )}

          {resposta?.recebimentos && (
            <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
              {resposta.recebimentos.erro ||
                `${resposta.recebimentos.alunos?.criados || 0} alunos criados e ${resposta.recebimentos.alunos?.atualizados || 0} atualizados. ${resposta.recebimentos.empresas?.criados || 0} empresas criadas e ${resposta.recebimentos.empresas?.atualizados || 0} atualizadas. ${(resposta.recebimentos.alunos?.invalidos || 0) + (resposta.recebimentos.empresas?.invalidos || 0)} envios inválidos. ${(resposta.recebimentos.alunos?.falhas || 0) + (resposta.recebimentos.empresas?.falhas || 0)} falhas de processamento. ${resposta.recebimentos.alterados} respostas alteradas na origem precisam de um novo envio.`}
            </p>
          )}

          {resposta?.recebimentos?.espelho?.falha && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800"
            >
              {resposta.recebimentos.espelho.mensagem}
            </p>
          )}
          {!resposta && !erro && (
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              A primeira sincronização será executada automaticamente.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

function formatarHorario(dados) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dados);
}

function formatarDataHora(dados) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(dados);
}
