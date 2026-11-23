"use client";

import Link from "next/link";
import Image from "next/image";
import Inputsolicitacao from "@/components/solicitacao/inputsolicitacao";
import Selectsolicitacao from "@/components/solicitacao/selectsolicitacao";
import LogoutButton from "@/components/login/LogoutButton";
import { useCursos } from "@/hooks/useCursos";
import { useEmpresaSolicitacao } from "@/hooks/useEmpresaSolicitacao";
import {
  SEXOS,
  PRATICAS,
  PERIODOS_PRATICA,
} from "@/lib/validations/solicitacaoSchema";
import { ROUTES } from "@/constants/routes";

function CampoComErro({ children, erro, largo = false, campo }) {
  return (
    <div className={`flex min-w-0 flex-col ${largo ? "col-span-full" : ""}`}>
      {children}

      {erro && (
        <p
          id={campo + "-erro"}
          role="alert"
          className="siga-entrada mt-1 text-sm text-red-600"
        >
          {erro}
        </p>
      )}
    </div>
  );
}

export default function Solicitacao() {
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
  return (
    <main className="grid min-h-svh bg-slate-50 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <aside className="siga-pagina relative isolate flex min-h-56 min-w-0 items-center overflow-hidden border-b-4 border-orange-500 bg-[#0a3d7c] lg:border-b-0 lg:border-r-4 lg:px-[clamp(2rem,4vw,6rem)]">
        <Image
          src="https://images.unsplash.com/photo-1738162837369-a2beec3a1d47?auto=format&fit=crop&w=1200&q=80"
          alt="Aprendiz em treinamento no ambiente industrial"
          fill
          unoptimized
          className="-z-20 object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-br from-[#082d58]/95 via-[#0a3d7c]/85 to-slate-900/70"
        />
        <div className="siga-entrada min-w-0">
          <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-200">
            <span
              className="h-0.5 w-8 shrink-0 bg-orange-400"
              aria-hidden="true"
            />
            SENAI - Mariano Ferraz
          </p>
          <p className="max-w-lg text-3xl font-extrabold leading-tight tracking-tight text-white lg:text-[clamp(2rem,3.4vw,4.25rem)]">
            Encontre o talento{" "}
            <span className="text-orange-300">que sua empresa precisa.</span>
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-100 sm:text-base">
            Solicite um aprendiz formado pelo SENAI e encontre jovens preparados
            para transformar conhecimento técnico em resultados para sua
            empresa.
          </p>
        </div>
      </aside>

      <div className="siga-pagina siga-entrada self-center">
        <section
          aria-labelledby="titulo-solicitacao-aprendizagem"
          className="siga-card siga-card-empresa p-4 sm:p-6 xl:p-8"
        >
          <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
            <h1
              id="titulo-solicitacao-aprendizagem"
              className="min-w-0 text-xl font-bold tracking-tight text-[#0a3d7c] sm:text-2xl"
            >
              Solicitação de Aprendizagem
            </h1>
            <LogoutButton />
          </header>

          {erroApi && (
            <div
              role="alert"
              className="mb-4 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700"
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

          {mensagemSucesso && (
            <div
              role="status"
              className="
              mb-4
              rounded-xl
              bg-green-100
              px-5
              py-4
              text-sm
              font-medium
              text-green-800
            "
            >
              Solicitação enviada com sucesso!
              {solicitacaoCriada && (
                <Link
                  className="ml-2 font-semibold underline"
                  href={`${ROUTES.EMPRESA_HOMEPAGE}?solicitacao=${solicitacaoCriada.id}`}
                >
                  Acompanhar solicitação
                </Link>
              )}
            </div>
          )}

          <form onSubmit={enviarFormulario} noValidate aria-busy={carregando}>
            <fieldset disabled={carregando} className="min-w-0">
              <div className="mb-6 grid min-w-0 gap-5 sm:grid-cols-2 min-[1650px]:grid-cols-3">
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

                {formulario.pratica === "com" && (
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
                      tooltip="Informe se a prática será realizada pela manhã ou à tarde."
                    />
                  </CampoComErro>
                )}

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
                    <p className="mt-1 text-sm text-gray-500">
                      Carregando cursos...
                    </p>
                  )}
                </CampoComErro>

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
                    placeholder="Até 5"
                    tipo="number"
                    tooltip="Define o número máximo de aprendizes que a empresa deseja receber nessa solicitação."
                    minAge={1}
                    maxAge={5}
                  />
                </CampoComErro>

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
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={carregando || carregandoCursos || carregandoSessao}
              className="siga-acao mt-2 block w-full cursor-pointer rounded-xl bg-orange-700 px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-md shadow-orange-500/20 hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto"
            >
              {carregando ? "ENVIANDO..." : "CONFIRMAR"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
