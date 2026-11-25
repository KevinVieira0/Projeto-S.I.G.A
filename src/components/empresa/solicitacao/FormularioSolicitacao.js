"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import CampoSolicitacao from "./CampoSolicitacao";
import SeletorSolicitacao from "./SeletorSolicitacao";
import { useCursos } from "./useCursos";
import { useEmpresaSolicitacao } from "./useEmpresaSolicitacao";
import {
  SEXOS,
  PRATICAS,
  PERIODOS_PRATICA,
} from "@/lib/validations/solicitacaoSchema";
import { ROUTES } from "@/constants/routes";

const ESTILOS = `
.siga-formulario-empresa {
  --siga-borda-card: #e5d9cf;
  --siga-tinta-vidro: 251 233 216;
  --siga-face-vidro: #fffdfb;
}
.siga-campos .siga-campo :is(input, select, textarea) {
  background-color: transparent !important;
  border-style: solid !important;
  border-width: 0 0 1px 0 !important;
  border-color: #cbd5e1 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.siga-campos .siga-campo :is(input, select) {
  min-height: 2.75rem;
  padding-block: 0.375rem;
}
.siga-campos .siga-campo textarea {
  height: 3.25rem;
  min-height: 3.25rem;
  padding-block: 0.375rem;
  resize: vertical;
}
@media (min-width: 1024px) {
  .siga-campos .siga-campo :is(input, select) {
    min-height: clamp(2.5rem, calc(3dvh + 1.25rem), 3rem);
  }
  .siga-campos .siga-campo textarea {
    height: clamp(3.25rem, calc(16dvh - 4rem), 6rem);
  }
}
@media (min-width: 1024px) and (min-height: 840px) {
  .siga-secao-formulario {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 0.625rem;
  }
  .siga-secao-formulario > h2 {
    padding-top: 0;
  }
}
.siga-campos .siga-campo :is(input, textarea):not(:placeholder-shown) {
  border-color: #94a3b8 !important;
}
.siga-campos .siga-campo :is(input, select, textarea):hover {
  border-color: #94a3b8 !important;
}
.siga-campos .siga-campo :is(input, select, textarea):focus {
  border-color: #f97316 !important;
  box-shadow: 0 1px 0 0 #f97316 !important;
}
.siga-campos .siga-campo[data-erro="true"] :is(input, select, textarea) {
  border-color: #dc2626 !important;
  box-shadow: 0 1px 0 0 #dc2626 !important;
}
.siga-campos .siga-campo :is(input, select, textarea):disabled {
  opacity: 0.6;
}
.siga-campos .siga-campo label {
  transition: color 0.2s ease;
}
.siga-campos .siga-campo:focus-within label {
  color: #c2410c !important;
}
.siga-campos .siga-campo[data-erro="true"] label {
  color: #b91c1c !important;
}
@keyframes siga-modal-entrada {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.siga-modal { animation: siga-modal-entrada 0.2s ease-out; }
@media (prefers-reduced-motion: reduce) {
  .siga-modal { animation: none; }
  .siga-campos .siga-campo :is(input, select, textarea, label) { transition: none; }
}
`;

function CampoComErro({ children, erro, campo, className = "" }) {
  return (
    <div
      className={`siga-campo flex min-w-0 flex-col ${className}`}
      data-erro={erro ? "true" : undefined}
    >
      {children}

      {erro && (
        <p
          id={campo + "-erro"}
          role="alert"
          className="siga-entrada mt-1.5 text-sm text-red-600"
        >
          {erro}
        </p>
      )}
    </div>
  );
}

function Secao({ titulo, colunas, children }) {
  return (
    <section className="siga-secao-formulario grid min-w-0 gap-y-2 border-t border-[#ece3da] py-3 first:border-t-0 lg:grow lg:grid-cols-[7.5rem_minmax(0,1fr)] lg:content-center lg:items-start lg:gap-x-4 lg:py-1.5">
      <h2 className="text-sm font-semibold leading-5 tracking-tight text-slate-900 lg:pt-1.5">
        {titulo}
      </h2>
      <div className={`grid min-w-0 gap-y-3 ${colunas}`}>{children}</div>
    </section>
  );
}

function ModalSucesso({ aberto, onFechar, onAcompanhar, temAcompanhar }) {
  const dialogoRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const elementoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogoRef.current?.querySelector("[data-foco]")?.focus();

    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        onFechar();
        return;
      }
      if (evento.key !== "Tab" || !dialogoRef.current) return;
      const itens = dialogoRef.current.querySelectorAll("button, a[href]");
      if (!itens.length) return;
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      elementoAnterior?.focus?.();
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onFechar();
      }}
    >
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="siga-modal-titulo"
        aria-describedby="siga-modal-descricao"
        className="siga-modal siga-card siga-card-empresa siga-vidro-elevado relative w-full max-w-md p-6 text-center sm:p-8"
      >
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar janela"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>

        <h2
          id="siga-modal-titulo"
          className="text-xl font-semibold tracking-tight text-slate-900"
        >
          Solicitação enviada!
        </h2>
        <p
          id="siga-modal-descricao"
          className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500"
        >
          Sua solicitação foi registrada com sucesso. Você pode acompanhar o
          andamento a qualquer momento.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {temAcompanhar && (
            <button
              type="button"
              data-foco
              onClick={onAcompanhar}
              className="w-full cursor-pointer rounded-xl bg-[#f97316] px-5 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
            >
              Acompanhar solicitação
            </button>
          )}
          <button
            type="button"
            data-foco={temAcompanhar ? undefined : true}
            onClick={onFechar}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function FormularioSolicitacao({ onAcompanhar }) {
  const { cursos, carregandoCursos, erroCursos } = useCursos();
  const {
    form: formulario,
    erros,
    apiError: erroApi,
    mensagemSucesso,
    solicitacaoCriada,
    isLoading: carregando,
    carregandoSessao,
    sessaoExpirada,
    handleChange: alterarCampo,
    handleSubmit: enviarFormulario,
  } = useEmpresaSolicitacao({ cursos, carregandoCursos, erroCursos });

  const [modalAberto, setModalAberto] = useState(false);
  const fecharModal = useCallback(() => setModalAberto(false), []);

  // Só abre quando o hook confirma o sucesso retornado pelo backend.
  useEffect(() => {
    if (mensagemSucesso) setModalAberto(true);
  }, [mensagemSucesso, solicitacaoCriada?.id]);

  function acompanharSolicitacao() {
    const id = solicitacaoCriada?.id;
    fecharModal();
    if (id) onAcompanhar?.(id);
  }

  const exigePeriodo = formulario.pratica === "com";

  const obrigatorios = [
    "idadeMinima",
    "idadeMaxima",
    "sexo",
    "pratica",
    "cursos",
    "inicio",
    "fim",
    "quantidadeVagas",
    ...(exigePeriodo ? ["periodoPratica"] : []),
  ];
  const preenchidos = obrigatorios.filter(
    (campo) => String(formulario[campo] ?? "").trim() !== "",
  ).length;
  const progresso = Math.round((preenchidos / obrigatorios.length) * 100);

  return (
    <>
      <style>{ESTILOS}</style>

      <div className="siga-card siga-card-empresa siga-formulario-empresa w-full rounded-2xl px-3.5 py-3 sm:px-6 lg:flex lg:flex-1 lg:flex-col lg:px-7 lg:[@media(min-height:740px)]:py-5">
        <div className="flex items-center gap-3 border-b border-[#ece3da] pb-3 text-xs font-semibold text-slate-700">
          <span className="shrink-0">Preenchimento</span>
          <div
            role="progressbar"
            aria-label="Preenchimento da solicitação"
            aria-valuemin={0}
            aria-valuemax={obrigatorios.length}
            aria-valuenow={preenchidos}
            aria-valuetext={`${preenchidos} de ${obrigatorios.length} campos preenchidos`}
            className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-orange-100"
          >
            <div
              className="h-full rounded-full bg-orange-600 motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-slate-600">
            {preenchidos}/{obrigatorios.length} campos
          </span>
        </div>

        {erroApi && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {erroApi}
            {sessaoExpirada && (
              <Link
                className="ml-2 font-semibold underline"
                href={ROUTES.LOGIN}
              >
                Entrar novamente
              </Link>
            )}
          </div>
        )}

        <form
          className="siga-campos lg:grid lg:flex-1 lg:grid-rows-[minmax(min-content,1fr)_auto]"
          onSubmit={enviarFormulario}
          noValidate
          aria-busy={carregando}
        >
          <fieldset
            disabled={carregando}
            className="min-w-0 lg:flex lg:flex-col"
          >
            <Secao
              titulo="Perfil do aprendiz"
              colunas="grid-cols-1 gap-x-4 min-[360px]:grid-cols-2 lg:grid-cols-3 lg:gap-x-[clamp(2rem,4vw,3.5rem)]"
            >
              <CampoComErro campo="idadeMinima" erro={erros.idadeMinima}>
                <CampoSolicitacao
                  label="Idade Mínima"
                  name="idadeMinima"
                  erro={erros.idadeMinima}
                  value={formulario.idadeMinima}
                  onChange={alterarCampo}
                  placeholder="De: 16"
                  tipo="number"
                  tooltip="Define a idade mínima que o aprendiz deve ter para participar da solicitação."
                  minAge={16}
                  maxAge={24}
                />
              </CampoComErro>

              <CampoComErro campo="idadeMaxima" erro={erros.idadeMaxima}>
                <CampoSolicitacao
                  label="Idade Máxima"
                  name="idadeMaxima"
                  erro={erros.idadeMaxima}
                  value={formulario.idadeMaxima}
                  onChange={alterarCampo}
                  placeholder="Até: 24"
                  tipo="number"
                  tooltip="Define a idade máxima que o aprendiz pode ter para participar da solicitação."
                  minAge={16}
                  maxAge={24}
                />
              </CampoComErro>

              <CampoComErro
                campo="sexo"
                erro={erros.sexo}
                className="col-span-full lg:col-span-1"
              >
                <SeletorSolicitacao
                  label="Sexo"
                  name="sexo"
                  erro={erros.sexo}
                  value={formulario.sexo}
                  onChange={alterarCampo}
                  options={SEXOS}
                  tooltip="Define o sexo do aprendiz desejado para esta solicitação."
                />
              </CampoComErro>
            </Secao>

            <Secao
              titulo="Vaga"
              colunas={`grid-cols-1 gap-x-4 sm:grid-cols-2 ${
                exigePeriodo
                  ? "lg:grid-cols-[minmax(0,1.66fr)_minmax(6rem,0.69fr)_minmax(0,1.38fr)_minmax(0,1.04fr)] lg:[@media(min-height:840px)]:gap-x-5"
                  : "lg:grid-cols-[minmax(0,1.2fr)_minmax(6rem,8rem)_minmax(0,1fr)] lg:gap-x-10"
              }`}
            >
              <CampoComErro campo="cursos" erro={erros.cursos || erroCursos}>
                <SeletorSolicitacao
                  label="Cursos"
                  name="cursos"
                  erro={erros.cursos || erroCursos}
                  value={formulario.cursos}
                  onChange={alterarCampo}
                  options={cursos}
                  tooltip="Define o curso do SENAI relacionado à vaga que a empresa deseja solicitar."
                />

                {carregandoCursos && (
                  <p className="mt-1.5 text-sm text-gray-500">
                    Carregando cursos...
                  </p>
                )}
              </CampoComErro>

              <CampoComErro
                campo="quantidadeVagas"
                erro={erros.quantidadeVagas}
              >
                <CampoSolicitacao
                  label="Quantidade"
                  name="quantidadeVagas"
                  erro={erros.quantidadeVagas}
                  value={formulario.quantidadeVagas}
                  onChange={alterarCampo}
                  placeholder="Vagas disponíveis"
                  tipo="number"
                  tooltip="Vagas disponiveis que a empresa quer preencher com aprendizes do Senai."
                  minAge={1}
                  maxAge={5}
                />
              </CampoComErro>

              <CampoComErro campo="pratica" erro={erros.pratica}>
                <SeletorSolicitacao
                  label="Prática"
                  name="pratica"
                  erro={erros.pratica}
                  value={formulario.pratica}
                  onChange={alterarCampo}
                  options={PRATICAS}
                  tooltip="Informe se a empresa oferecerá atividade prática aos alunos ou somente apoio financeiro por meio de bolsa."
                />
              </CampoComErro>

              {exigePeriodo && (
                <CampoComErro
                  campo="periodoPratica"
                  erro={erros.periodoPratica}
                >
                  <SeletorSolicitacao
                    label="Período da prática"
                    name="periodoPratica"
                    erro={erros.periodoPratica}
                    value={formulario.periodoPratica}
                    onChange={alterarCampo}
                    options={PERIODOS_PRATICA}
                    tooltip="Define se a prática do aprendiz será no período da manhã ou da tarde."
                  />
                </CampoComErro>
              )}
            </Secao>

            <Secao
              titulo="Período da contratação"
              colunas="grid-cols-1 gap-x-4 min-[360px]:grid-cols-2 lg:grid-cols-[repeat(2,minmax(0,20rem))] lg:justify-between lg:gap-x-10"
            >
              <CampoComErro campo="inicio" erro={erros.inicio}>
                <CampoSolicitacao
                  label="Início"
                  name="inicio"
                  erro={erros.inicio}
                  value={formulario.inicio}
                  onChange={alterarCampo}
                  placeholder="DD/MM/AA"
                  tipo="date"
                  tooltip="Define a data prevista para o início da contratação do aprendiz."
                />
              </CampoComErro>

              <CampoComErro campo="fim" erro={erros.fim}>
                <CampoSolicitacao
                  label="Fim"
                  name="fim"
                  erro={erros.fim}
                  value={formulario.fim}
                  onChange={alterarCampo}
                  placeholder="DD/MM/AA"
                  tipo="date"
                  tooltip="Define a data prevista para o término da contratação do aprendiz."
                />
              </CampoComErro>
            </Secao>

            <Secao titulo="Detalhes" colunas="grid-cols-1">
              <CampoComErro campo="observacoes">
                <CampoSolicitacao
                  label="Observações"
                  name="observacoes"
                  value={formulario.observacoes}
                  onChange={alterarCampo}
                  placeholder="Requisitos adicionais (opcional)"
                  tipo="textarea"
                  tooltip="Use este campo para informar requisitos, observações ou informações adicionais sobre a solicitação."
                />
              </CampoComErro>
            </Secao>
          </fieldset>

          <button
            type="submit"
            disabled={carregando || carregandoCursos || carregandoSessao}
            className="siga-acao siga-acao-primaria group mt-2 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto sm:min-w-44 lg:[@media(min-height:740px)]:mt-4"
          >
            <span>{carregando ? "Enviando…" : "Confirmar"}</span>
            {!carregando && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </form>
      </div>

      <ModalSucesso
        aberto={modalAberto && Boolean(mensagemSucesso)}
        onFechar={fecharModal}
        onAcompanhar={acompanharSolicitacao}
        temAcompanhar={Boolean(solicitacaoCriada?.id)}
      />
    </>
  );
}
