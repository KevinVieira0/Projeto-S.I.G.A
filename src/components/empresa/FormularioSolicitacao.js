"use client";

import Link from "next/link";
import Inputsolicitacao from "@/components/solicitacao/inputsolicitacao";
import Selectsolicitacao from "@/components/solicitacao/selectsolicitacao";
import { useCursos } from "@/hooks/useCursos";
import { useEmpresaSolicitacao } from "@/hooks/useEmpresaSolicitacao";
import { SEXOS, PRATICAS, PERIODOS_PRATICA } from "@/lib/validations/solicitacaoSchema";
import { ROUTES } from "@/constants/routes";

function CampoComErro({ children, erro, largo = false, campo }) {
    return (
        <div className={`flex flex-col ${largo ? "col-span-full" : ""}`}>
            {children}

            {erro && (
                <p id={campo + "-erro"} role="alert" className="mt-1 text-sm text-red-600">
                    {erro}
                </p>
            )}
        </div>
    );
}

export default function FormularioSolicitacao() {
    const { cursos, carregandoCursos, erroCursos } = useCursos();
    const {
        form: formulario,
        erros,
        apiError: erroApi,
        mensagemSucesso,
        isLoading: carregando,
        carregandoSessao,
        sessaoExpirada,
        handleChange: alterarCampo,
        handleSubmit: enviarFormulario,
    } = useEmpresaSolicitacao({ cursos, carregandoCursos, erroCursos })

    const exigePeriodo = formulario.pratica === "com";

    return (
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl lg:p-10">
            {erroApi && (
                <div role="alert" className="mb-4 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">
                    {erroApi}
                    {sessaoExpirada && (
                        <Link className="ml-2 font-semibold underline" href={ROUTES.LOGIN}>
                            Entrar novamente
                        </Link>
                    )}
                </div>
            )}

            {mensagemSucesso && (
                <div
                    role="status"
                    className="mb-4 rounded-xl bg-green-100 px-5 py-4 text-sm font-medium text-green-800"
                >
                    Solicitação enviada com sucesso!
                </div>
            )}

            <form onSubmit={enviarFormulario} noValidate aria-busy={carregando}>
                <fieldset disabled={carregando} className="min-w-0">
                    <div className="mb-6 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
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
                                tooltip="Define se o aprendiz atuará de forma presencial ou remota, conforme a natureza da vaga."
                            />
                        </CampoComErro>

                        {exigePeriodo && (
                            <CampoComErro campo="periodoPratica" erro={erros.periodoPratica}>
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
                                <p className="mt-1 text-sm text-gray-500">Carregando cursos...</p>
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

                        <CampoComErro campo="quantidadeVagas" erro={erros.quantidadeVagas}>
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
                    className="mt-2 block w-full cursor-pointer rounded-xl border-0 bg-[#f97316] px-5 py-4 text-[15px] font-bold tracking-wide text-white shadow-lg shadow-orange-500/20 transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#ea580c] hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                    {carregando ? "ENVIANDO..." : "CONFIRMAR"}
                </button>
            </form>
        </div>
    );
}