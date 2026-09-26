"use client";

import Link from "next/link";
import Inputsolicitacao from "@/components/solicitacao/inputsolicitacao";
import Selectsolicitacao from "@/components/solicitacao/selectsolicitacao";
import LogoutButton from "@/components/login/LogoutButton";
import { useCursos } from "@/hooks/useCursos";
import { useEmpresaSolicitacao } from "@/hooks/useEmpresaSolicitacao";
import { SEXOS, PRATICAS } from "@/lib/validations/solicitacaoSchema";
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

export default function Solicitacao() {
  const { cursos, carregandoCursos, erroCursos } = useCursos();
  const { form, erros, apiError, mensagemSucesso, isLoading, carregandoSessao, sessaoExpirada, handleChange, handleSubmit } = useEmpresaSolicitacao({ cursos, carregandoCursos, erroCursos });

  return (
    <div
      className="
        min-h-screen
        relative
        flex
        flex-col
        lg:flex-row
        items-center
        justify-between
        gap-12
        px-4
        sm:px-10
        py-8
        overflow-hidden
      "
      style={{
        backgroundColor: "#f8fafc",
      }}
    >
      <div
        className="
          absolute
          inset-y-0
          left-0
          z-0
          w-full
          lg:w-1/2
          lg:[clip-path:polygon(0_0,100%_0,81%_100%,0_100%)]
        "
        style={{
          background: "linear-gradient(180deg, #f97316 0%, #ffffff 50%, #0a3d7c 100%)",
          filter: "drop-shadow(0 0 25px rgba(249, 115, 22, 0.5))",
        }}
      />

      <div
        className="
          absolute
          inset-y-0
          left-0
          z-[1]
          w-full
          lg:w-1/2
        "
      >
        <img
          src="https://images.unsplash.com/photo-1738162837369-a2beec3a1d47?auto=format&fit=crop&w=1200&q=80"
          alt="Aprendiz em treinamento no ambiente industrial"
          className="
            h-full
            w-full
            object-cover
          "
        />

        <div
          className="
            absolute
            left-0
            top-1/4
            h-1/2
            w-3/4
            bg-gradient-to-r
            from-black/60
            via-black/30
            to-transparent
            blur-xl
          "
        />
      </div>

      <div
        className="
          relative
          z-10
          min-w-0
          w-full
          lg:flex-1
          max-w-xl
          pl-4
          lg:pl-10
        "
      >
        <div
          className="
            mb-6
            flex
            items-center
            gap-3
          "
        >
          <div className="h-1 w-12 bg-[#f97316]" />
          <span
            className="
              text-xs
              font-bold
              uppercase
              tracking-widest
              text-white/80
            "
          >
            SENAI - Mariano Ferraz
          </span>
        </div>

        <h2
          className="
            max-w-lg
            text-4xl
            lg:text-5xl
            font-black
            uppercase
            leading-[0.95]
            tracking-tight
            text-white
          "
        >
          Encontre o talento
          <span className="block text-[#f97316]">
            que sua empresa precisa.
          </span>
        </h2>

        <p
          className="
            mt-7
            max-w-md
            text-lg
            leading-8
            text-slate-200
          "
        >
          Solicite um aprendiz formado pelo SENAI
          e encontre jovens preparados para
          transformar conhecimento técnico em
          resultados para sua empresa.
        </p>

        <div
          className="
            mt-8
            max-w-lg
            border-t
            border-white/20
            pt-5
          "
        />
      </div>

      <div
        className="
          relative
          z-10
          w-full
          max-w-3xl
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-5
          sm:p-8
          shadow-2xl
          lg:p-10
        "
      >
        <div
          className="
            mb-8
            flex
            items-center
            gap-5
          "
        >
          <div>
            <h1
              className="
                mt-1
                text-2xl
                text-center
                font-black
                uppercase
                tracking-tight
                text-[#0a3d7c]
              "
            >
              Solicitação de Aprendizagem
            </h1>
          </div>
        </div>

        <div className="mb-7 h-px w-full bg-slate-200" />

        <div className="mb-3 flex justify-end"><LogoutButton /></div>

        {apiError && (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">
            {apiError}
            {sessaoExpirada && <Link className="ml-2 font-semibold underline" href={ROUTES.LOGIN}>Entrar novamente</Link>}
          </div>
        )}

        {mensagemSucesso && (
          <div role="status"
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
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
          <fieldset disabled={isLoading} className="min-w-0">
          <div
            className="
              mb-6
              grid
              grid-cols-1
              gap-x-5
              gap-y-5
              sm:grid-cols-2
            "
          >
            <CampoComErro campo="idadeMinima" erro={erros.idadeMinima}>
              <Inputsolicitacao
                label="Idade Mínima"
                name="idadeMinima"
                erro={erros.idadeMinima}
                value={form.idadeMinima}
                onChange={handleChange}
                placeholder="De: 16"
                tipo="number"
                tooltip="Define a idade mínima que o aprendiz deve ter para participar da solicitação."
              />
            </CampoComErro>

            <CampoComErro campo="idadeMaxima" erro={erros.idadeMaxima}>
              <Inputsolicitacao
                label="Idade Máxima"
                name="idadeMaxima"
                erro={erros.idadeMaxima}
                value={form.idadeMaxima}
                onChange={handleChange}
                placeholder="Até: 24"
                tipo="number"
                tooltip="Define a idade máxima que o aprendiz pode ter para participar da solicitação."
              />
            </CampoComErro>

            <CampoComErro campo="sexo" erro={erros.sexo}>
              <Selectsolicitacao
                label="Sexo"
                name="sexo"
                erro={erros.sexo}
                value={form.sexo}
                onChange={handleChange}
                options={SEXOS}
                tooltip="Define o sexo do aprendiz desejado para esta solicitação."
              />
            </CampoComErro>

            <CampoComErro campo="pratica" erro={erros.pratica}>
              <Selectsolicitacao
                label="Prática"
                name="pratica"
                erro={erros.pratica}
                value={form.pratica}
                onChange={handleChange}
                options={PRATICAS}
                tooltip="Define se o aprendiz atuará de forma presencial ou remota, conforme a natureza da vaga."
              />
            </CampoComErro>

            <CampoComErro campo="cursos" erro={erros.cursos || erroCursos}>
              <Selectsolicitacao
                label="Cursos"
                name="cursos"
                erro={erros.cursos || erroCursos}
                value={form.cursos}
                onChange={handleChange}
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
                value={form.inicio}
                onChange={handleChange}
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
                value={form.fim}
                onChange={handleChange}
                placeholder="DD/MM/AA"
                tipo="date"
                tooltip="Define a data prevista para o término da contratação do aprendiz."
              />
            </CampoComErro>

            <CampoComErro campo="quantidadeAlunos" erro={erros.quantidadeAlunos}>
              <Inputsolicitacao
                label="Quantidade"
                name="quantidadeAlunos"
                erro={erros.quantidadeAlunos}
                value={form.quantidadeAlunos}
                onChange={handleChange}
                placeholder="Até 5"
                tipo="number"
                tooltip="Define o número máximo de aprendizes que a empresa deseja receber nessa solicitação."
              />
            </CampoComErro>

            <Inputsolicitacao
              label="Observações"
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              placeholder="Requisitos adicionais (opcional)"
              largo
              tipo="textarea"
              tooltip="Use este campo para informar requisitos, observações ou informações adicionais sobre a solicitação."
            />
          </div>

          </fieldset>
          <button
            type="submit"
            disabled={isLoading || carregandoCursos || carregandoSessao}
            className="
              mt-2
              block
              w-full
              cursor-pointer
              rounded-xl
              border-0
              bg-[#f97316]
              px-5
              py-4
              text-[15px]
              font-bold
              tracking-wide
              text-white
              shadow-lg
              shadow-orange-500/20
              transition-all
              duration-150
              hover:-translate-y-0.5
              hover:bg-[#ea580c]
              hover:shadow-xl
              active:translate-y-0
              disabled:cursor-not-allowed
              disabled:opacity-60
              disabled:hover:translate-y-0
            "
          >
            {isLoading ? "ENVIANDO..." : "CONFIRMAR"}
          </button>
        </form>
      </div>
    </div>
  );
}