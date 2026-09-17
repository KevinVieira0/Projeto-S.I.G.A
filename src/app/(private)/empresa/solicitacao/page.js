"use client";

import { useState } from "react";
import Inputsolicitacao from "../../../../components/solicitacao/inputsolicitacao";
import Selectsolicitacao from "../../../../components/solicitacao/selectsolicitacao";
import { useCursos } from "@/hooks/useCursos";
import Tooltip from "../../../../components/solicitacao/tutorialDeUso";

const SEXOS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "todos", label: "Todos" },
];

const PRATICAS = [
  { value: "com", label: "Com prática" },
  { value: "sem", label: "Sem prática" },
];

function lerDataLocal(valor) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return null;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);

  if (ano < 1) {
    return null;
  }

  const data = new Date(0);

  data.setHours(0, 0, 0, 0);
  data.setFullYear(ano, mes - 1, dia);

  if (
    Number.isNaN(data.getTime()) ||
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }

  return data;
}

function validarFormulario(form, cursosDisponiveis = []) {
  const erros = {};

  if (
    !Number.isInteger(form.idadeMinima) ||
    form.idadeMinima < 16 ||
    form.idadeMinima > 24
  ) {
    erros.idadeMinima = "A idade mínima deve ser um número inteiro entre 16 e 24.";
  }

  if (
    !Number.isInteger(form.idadeMaxima) ||
    form.idadeMaxima < 16 ||
    form.idadeMaxima > 24
  ) {
    erros.idadeMaxima = "A idade máxima deve ser um número inteiro entre 16 e 24.";
  }

  if (
    !erros.idadeMinima &&
    !erros.idadeMaxima &&
    form.idadeMinima > form.idadeMaxima
  ) {
    erros.idadeMinima = "A idade mínima não pode ser maior que a idade máxima.";
    erros.idadeMaxima = "A idade máxima não pode ser menor que a idade mínima.";
  }

  if (!SEXOS.some((opcao) => opcao.value === form.sexo)) {
    erros.sexo = "Selecione uma opção de sexo válida.";
  }

  if (!PRATICAS.some((opcao) => opcao.value === form.pratica)) {
    erros.pratica = "Selecione uma opção de prática válida.";
  }

  if (!form.curso) {
    erros.curso = "Selecione um curso.";
  } else if (
    cursosDisponiveis.length > 0 &&
    !cursosDisponiveis.some((opcao) => opcao.value === form.curso)
  ) {
    erros.curso = "O curso selecionado não está mais disponível.";
  }

  if (
    !Number.isInteger(form.quantidade) ||
    form.quantidade < 1 ||
    form.quantidade > 5
  ) {
    erros.quantidade = "A quantidade deve ser um número inteiro entre 1 e 5.";
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataInicio = lerDataLocal(form.inicio);
  const dataFim = lerDataLocal(form.fim);

  if (!form.inicio) {
    erros.inicio = "Informe a data de início.";
  } else if (!dataInicio) {
    erros.inicio = "Informe uma data de início válida.";
  } else if (dataInicio < hoje) {
    erros.inicio = "A data de início não pode ser uma data passada.";
  }

  if (!form.fim) {
    erros.fim = "Informe a data de fim.";
  } else if (!dataFim) {
    erros.fim = "Informe uma data de fim válida.";
  } else if (dataFim < hoje) {
    erros.fim = "A data de fim não pode ser uma data passada.";
  }

  if (!erros.inicio && !erros.fim && dataInicio && dataFim) {
    if (dataInicio > dataFim) {
      erros.inicio = "A data de início não pode ser depois da data de fim.";
      erros.fim = "A data de fim não pode ser antes da data de início.";
    } else {
      const limiteDataFim = new Date(dataInicio);

      limiteDataFim.setFullYear(limiteDataFim.getFullYear() + 2);

      if (dataFim > limiteDataFim) {
        erros.fim = "A data de fim não pode exceder 2 anos após a data de início.";
      }
    }
  }

  return erros;
}

function CampoComErro({ children, erro, largo = false }) {
  return (
    <div className={`flex flex-col ${largo ? "col-span-full" : ""}`}>
      {children}

      {erro && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}

export default function Solicitacao() {
  const { cursos, carregandoCursos, erroCursos } = useCursos();

  const [form, setForm] = useState({
    idEmpresa: "",
    idadeMinima: "",
    idadeMaxima: "",
    sexo: "",
    pratica: "",
    curso: "",
    inicio: "",
    fim: "",
    quantidade: "",
    unidade: "",
    observacoes: "",
  });

  const [erros, setErros] = useState({});
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  function handleChange(e) {
    const { name, value, type } = e.target;

    const novoValor = type === "number" && value !== "" ? Number(value) : value;

    if (type === "number" && value !== "") {
      if (!Number.isFinite(novoValor)) {
        return;
      }

      if (
        (name === "idadeMinima" || name === "idadeMaxima") &&
        (novoValor < 0 || novoValor > 24)
      ) {
        return;
      }

      if (name === "quantidade" && (novoValor < 1 || novoValor > 5)) {
        return;
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: novoValor,
    }));

    setErros((prev) => {
      const proximosErros = { ...prev };

      delete proximosErros[name];

      if (name === "idadeMinima" || name === "idadeMaxima") {
        delete proximosErros.idadeMinima;
        delete proximosErros.idadeMaxima;
      }

      if (name === "inicio" || name === "fim") {
        delete proximosErros.inicio;
        delete proximosErros.fim;
      }

      return proximosErros;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (carregandoCursos) {
      setErros((prev) => ({
        ...prev,
        curso: "Aguarde o carregamento dos cursos.",
      }));

      return;
    }

    const novosErros = validarFormulario(form, cursos);

    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      return;
    }

    console.log(form);

    setMensagemSucesso(true);
    setTimeout(() => setMensagemSucesso(false), 4000);
  }

  return (
    <div
      className="
        min-h-screen
        relative
        flex
        items-center
        justify-between
        gap-12
        px-10
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
        "
        style={{
          clipPath: "polygon(0 0, 100% 0, 81% 100%, 0 100%)",
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
        style={{
          clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 100%)",
        }}
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
          flex-1
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
            text-5xl
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
          p-8
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

        {mensagemSucesso && (
          <div
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

        <form onSubmit={handleSubmit} noValidate>
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
            <CampoComErro erro={erros.idadeMinima}>
              <Inputsolicitacao
                label="Idade Mínima"
                name="idadeMinima"
                value={form.idadeMinima}
                onChange={handleChange}
                placeholder="De: 16"
                tipo="number"
                tooltip="Define a idade mínima que o aprendiz deve ter para participar da solicitação."
              />
            </CampoComErro>

            <CampoComErro erro={erros.idadeMaxima}>
              <Inputsolicitacao
                label="Idade Máxima"
                name="idadeMaxima"
                value={form.idadeMaxima}
                onChange={handleChange}
                placeholder="Até: 24"
                tipo="number"
                tooltip="Define a idade máxima que o aprendiz pode ter para participar da solicitação."
              />
            </CampoComErro>

            <CampoComErro erro={erros.sexo}>
              <Selectsolicitacao
                label="Sexo"
                name="sexo"
                value={form.sexo}
                onChange={handleChange}
                options={SEXOS}
                tooltip="Define o sexo do aprendiz desejado para esta solicitação."
              />
            </CampoComErro>

            <CampoComErro erro={erros.pratica}>
              <Selectsolicitacao
                label="Prática"
                name="pratica"
                value={form.pratica}
                onChange={handleChange}
                options={PRATICAS}
                tooltip="Define se o aprendiz atuará de forma presencial ou remota, conforme a natureza da vaga."
              />
            </CampoComErro>

            <CampoComErro erro={erros.curso || erroCursos}>
              <Selectsolicitacao
                label="Cursos"
                name="curso"
                value={form.curso}
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

            <CampoComErro erro={erros.inicio}>
              <Inputsolicitacao
                label="Início"
                name="inicio"
                value={form.inicio}
                onChange={handleChange}
                placeholder="DD/MM/AA"
                tipo="date"
                tooltip="Define a data prevista para o início da contratação do aprendiz."
              />
            </CampoComErro>

            <CampoComErro erro={erros.fim}>
              <Inputsolicitacao
                label="Fim"
                name="fim"
                value={form.fim}
                onChange={handleChange}
                placeholder="DD/MM/AA"
                tipo="date"
                tooltip="Define a data prevista para o término da contratação do aprendiz."
              />
            </CampoComErro>

            <CampoComErro erro={erros.quantidade}>
              <Inputsolicitacao
                label="Quantidade"
                name="quantidade"
                value={form.quantidade}
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

          <button
            type="submit"
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
            "
          >
            CONFIRMAR
          </button>
        </form>
      </div>
    </div>
  );
}