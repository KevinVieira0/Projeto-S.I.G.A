"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Inputsolicitacao from "@/components/solicitacao/inputsolicitacao";
import Selectsolicitacao from "@/components/solicitacao/selectsolicitacao";
import { useCursos } from "@/hooks/useCursos";
import { useEmpresaSolicitacao } from "@/hooks/useEmpresaSolicitacao";
import {
  SEXOS,
  PRATICAS,
  PERIODOS_PRATICA,
} from "@/lib/validations/solicitacaoSchema";
import { ROUTES } from "@/constants/routes";

const ESTILOS = `
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
.siga-campos .siga-campo textarea {
  min-height: 6rem;
  resize: vertical;
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
}
`;

function CampoComErro({ children, erro, largo = false, campo }) {
  return (
    <div
      className={`siga-campo flex flex-col ${largo ? "col-span-full" : ""}`}
      data-erro={erro ? "true" : undefined}
    >
      {children}

      {erro && (
        <p
          id={campo + "-erro"}
          role="alert"
          className="mt-1.5 text-sm text-red-600"
        >
          {erro}
        </p>
      )}
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <section className="border-t border-slate-100 py-8 first:border-t-0 first:pt-0 last:pb-2">
      <h3 className="mb-6 text-base font-semibold tracking-tight text-slate-900">
        {titulo}
      </h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
        {children}
      </div>
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
        className="siga-modal relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl shadow-slate-900/20 sm:p-10"
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
    document.body
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
    (campo) => String(formulario[campo] ?? "").trim() !== ""
  ).length;
  const progresso = Math.round((preenchidos / obrigatorios.length) * 100);

  return (
    <>
      <style>{ESTILOS}</style>

      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 lg:p-10">
        {/* progresso */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Preenchimento
            </span>
            <span className="tabular-nums">
              {preenchidos}/{obrigatorios.length} campos
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {erroApi && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
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
          className="siga-campos"
          onSubmit={enviarFormulario}
          noValidate
          aria-busy={carregando}
        >
          <fieldset disabled={carregando} className="min-w-0">
            <Secao titulo="Perfil do aprendiz">
              <CampoComErro campo="idadeMinima" erro={erros.idadeMinima}>
                <Inputsolicitacao
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
                <Inputsolicitacao
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

              <CampoComErro campo="sexo" erro={erros.sexo}>
                <Selectsolicitacao
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

            <Secao titulo="Vaga">
              <CampoComErro campo="cursos" erro={erros.cursos || erroCursos}>
                <Selectsolicitacao
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
                <Inputsolicitacao
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
                <Selectsolicitacao
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
                  <Selectsolicitacao
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

            <Secao titulo="Período da contratação">
              <CampoComErro campo="inicio" erro={erros.inicio}>
                <Inputsolicitacao
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
                <Inputsolicitacao
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

            <Secao titulo="Detalhes">
              <CampoComErro campo="observacoes" largo>
                <Inputsolicitacao
                  label="Observações"
                  name="observacoes"
                  value={formulario.observacoes}
                  onChange={alterarCampo}
                  placeholder="Requisitos adicionais (opcional)"
                  largo
                  tipo="textarea"
                  tooltip="Use este campo para informar requisitos, observações ou informações adicionais sobre a solicitação."
                />
              </CampoComErro>
            </Secao>
          </fieldset>

          <button
            type="submit"
            disabled={carregando || carregandoCursos || carregandoSessao}
            className="group mt-4 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-0 bg-[#f97316] px-5 py-4 text-[15px] font-bold tracking-[0.12em] text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ea580c] hover:shadow-xl hover:shadow-orange-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none"
          >
            <span>{carregando ? "ENVIANDO..." : "CONFIRMAR"}</span>
            {!carregando && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
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