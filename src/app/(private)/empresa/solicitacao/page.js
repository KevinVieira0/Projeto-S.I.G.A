"use client";

import { useState } from "react";
import Inputsolicitacao from "../../../../components/solicitacao/inputsolicitacao";
import Selectsolicitacao from "../../../../components/solicitacao/selectsolicitacao";
import { useCursos } from "@/hooks/useCursos";

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
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
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

function validarFormulario(
  form,
  cursosDisponiveis = []
) {
  const erros = {};

  if (
    !Number.isInteger(form.idadeMinima) ||
    form.idadeMinima < 16 ||
    form.idadeMinima > 24
  ) {
    erros.idadeMinima =
      "A idade mínima deve ser um número inteiro entre 16 e 24.";
  }

  if (
    !Number.isInteger(form.idadeMaxima) ||
    form.idadeMaxima < 16 ||
    form.idadeMaxima > 24
  ) {
    erros.idadeMaxima =
      "A idade máxima deve ser um número inteiro entre 16 e 24.";
  }

  if (
    !erros.idadeMinima &&
    !erros.idadeMaxima &&
    form.idadeMinima > form.idadeMaxima
  ) {
    erros.idadeMinima =
      "A idade mínima não pode ser maior que a idade máxima.";

    erros.idadeMaxima =
      "A idade máxima não pode ser menor que a idade mínima.";
  }

  if (
    !SEXOS.some(
      (opcao) => opcao.value === form.sexo
    )
  ) {
    erros.sexo =
      "Selecione uma opção de sexo válida.";
  }

  if (
    !PRATICAS.some(
      (opcao) => opcao.value === form.pratica
    )
  ) {
    erros.pratica =
      "Selecione uma opção de prática válida.";
  }

  if (!form.curso) {
    erros.curso = "Selecione um curso.";
  } else if (
    cursosDisponiveis.length > 0 &&
    !cursosDisponiveis.some(
      (opcao) => opcao.value === form.curso
    )
  ) {
    erros.curso =
      "O curso selecionado não está mais disponível.";
  }

  if (
    !Number.isInteger(form.quantidade) ||
    form.quantidade < 1 ||
    form.quantidade > 5
  ) {
    erros.quantidade =
      "A quantidade deve ser um número inteiro entre 1 e 5.";
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataInicio = lerDataLocal(form.inicio);
  const dataFim = lerDataLocal(form.fim);

  if (!form.inicio) {
    erros.inicio =
      "Informe a data de início.";
  } else if (!dataInicio) {
    erros.inicio =
      "Informe uma data de início válida.";
  } else if (dataInicio < hoje) {
    erros.inicio =
      "A data de início não pode ser uma data passada.";
  }

  if (!form.fim) {
    erros.fim =
      "Informe a data de fim.";
  } else if (!dataFim) {
    erros.fim =
      "Informe uma data de fim válida.";
  } else if (dataFim < hoje) {
    erros.fim =
      "A data de fim não pode ser uma data passada.";
  }

  if (
    !erros.inicio &&
    !erros.fim &&
    dataInicio &&
    dataFim
  ) {
    if (dataInicio > dataFim) {
      erros.inicio =
        "A data de início não pode ser depois da data de fim.";

      erros.fim =
        "A data de fim não pode ser antes da data de início.";
    } else {
      const limiteDataFim = new Date(dataInicio);

      limiteDataFim.setFullYear(
        limiteDataFim.getFullYear() + 2
      );

      if (dataFim > limiteDataFim) {
        erros.fim =
          "A data de fim não pode exceder 2 anos após a data de início.";
      }
    }
  }

  return erros;
}

function CampoComErro({
  children,
  erro,
  largo = false,
}) {
  return (
    <div
      className={`flex flex-col ${largo ? "col-span-full" : ""
        }`}
    >
      {children}

      {erro && (
        <p
          role="alert"
          className="mt-1 text-sm text-red-600"
        >
          {erro}
        </p>
      )}
    </div>
  );
}

export default function Solicitacao() {
  const {
    cursos,
    carregandoCursos,
    erroCursos,
  } = useCursos();

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

  function handleChange(e) {
    const { name, value, type } = e.target;

    const novoValor =
      type === "number" && value !== ""
        ? Number(value)
        : value;

    if (type === "number" && value !== "") {
      if (!Number.isFinite(novoValor)) {
        return;
      }

      if (
        (
          name === "idadeMinima" ||
          name === "idadeMaxima"
        ) &&
        (
          novoValor < 0 ||
          novoValor > 24
        )
      ) {
        return;
      }

      if (
        name === "quantidade" &&
        (
          novoValor < 1 ||
          novoValor > 5
        )
      ) {
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

      if (
        name === "idadeMinima" ||
        name === "idadeMaxima"
      ) {
        delete proximosErros.idadeMinima;
        delete proximosErros.idadeMaxima;
      }

      if (
        name === "inicio" ||
        name === "fim"
      ) {
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
        curso:
          "Aguarde o carregamento dos cursos.",
      }));

      return;
    }

    const novosErros = validarFormulario(
      form,
      cursos
    );

    setErros(novosErros);

    if (
      Object.keys(novosErros).length > 0
    ) {
      return;
    }

    console.log(form);
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
        backgroundImage: `
          radial-gradient(circle at 90% 10%, rgba(249,115,22,0.18), transparent 45%),
          radial-gradient(circle at 5% 95%, rgba(249,115,22,0.18), transparent 45%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0 50 Q25 30 50 50 T100 50' fill='none' stroke='%23fb923c' stroke-opacity='0.10' stroke-width='1.5'/%3E%3C/svg%3E")
        `,
        backgroundRepeat: "no-repeat, no-repeat, repeat"
      }}
    >

      {/* CONTEÚDO DA ESQUERDA */}
      <div className="
        relative
        z-10
        flex-1
        max-w-xl
        pl-4
        lg:pl-10
      ">

        <div className="
          mb-6
          flex
          items-center
          gap-3
        ">
          <div className="
            h-1
            w-12
            bg-[#f97316]
          " />

          <span className="
            text-sm
            font-bold
            uppercase
            tracking-[0.22em]
            text-[#f97316]
          ">
            SENAI
          </span>
        </div>

        <h2 className="
          max-w-lg
          text-5xl
          font-black
          uppercase
          leading-[0.95]
          tracking-tight
          text-[#0a3d7c]
        ">
          Encontre o talento
          <span className="block text-[#f97316]">
            que sua empresa precisa.
          </span>
        </h2>

        <p className="
          mt-7
          max-w-lg
          text-lg
          leading-8
          text-slate-600
        ">
          Solicite um aprendiz formado pelo SENAI
          e encontre jovens preparados para
          transformar conhecimento técnico em
          resultados para sua empresa.
        </p>

        <div className="
          mt-10
          grid
          max-w-lg
          grid-cols-1
          gap-5
          sm:grid-cols-3
        ">

          <div className="
            border-l-2
            border-[#f97316]
            pl-4
          ">
            <p className="
              text-2xl
              font-black
              text-[#0a3d7c]
            ">
              01
            </p>

            <p className="
              mt-1
              text-sm
              font-medium
              leading-5
              text-slate-600
            ">
              Defina o perfil
              profissional
            </p>
          </div>

          <div className="
            border-l-2
            border-[#f97316]
            pl-4
          ">
            <p className="
              text-2xl
              font-black
              text-[#0a3d7c]
            ">
              02
            </p>

            <p className="
              mt-1
              text-sm
              font-medium
              leading-5
              text-slate-600
            ">
              Escolha a
              formação
            </p>
          </div>

          <div className="
            border-l-2
            border-[#f97316]
            pl-4
          ">
            <p className="
              text-2xl
              font-black
              text-[#0a3d7c]
            ">
              03
            </p>

            <p className="
              mt-1
              text-sm
              font-medium
              leading-5
              text-slate-600
            ">
              Receba novos
              talentos
            </p>
          </div>

        </div>

        <div className="
          mt-12
          max-w-lg
          border-t
          border-slate-200
          pt-5
        ">
          <p className="
            text-sm
            font-semibold
            uppercase
            tracking-wider
            text-slate-400
          ">
            Formação que conecta
          </p>

          <p className="
            mt-2
            text-sm
            leading-6
            text-slate-500
          ">
            Sua empresa desenvolve.
            O SENAI prepara.
            Juntos, formamos o próximo profissional.
          </p>
        </div>

      </div>


      {/* FORMULÁRIO À DIREITA */}
      <div className="
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
      ">

        <div className="
          mb-8
          flex
          items-center
          gap-5
        ">

          <div className="
            flex
            h-14
            w-14
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-[#0a3d7c]
            shadow-md
          ">
            <img
              src="/images/Logo-SENAI.png"
              alt="Logo SENAI"
              className="h-auto w-10"
            />
          </div>

          <div>
            <p className="
              text-xs
              font-bold
              uppercase
              tracking-[0.18em]
              text-[#f97316]
            ">
              Solicitação
            </p>

            <h1 className="
              mt-1
              text-2xl
              font-black
              uppercase
              tracking-tight
              text-[#0a3d7c]
            ">
              Solicitação de Aprendizagem
            </h1>
          </div>

        </div>

        <div className="
          mb-7
          h-px
          w-full
          bg-slate-200
        " />

        <form
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="
            mb-6
            grid
            grid-cols-1
            gap-x-5
            gap-y-5
            sm:grid-cols-2
          ">

            <CampoComErro
              erro={erros.idadeMinima}
            >
              <Inputsolicitacao
                label="Idade Mínima"
                name="idadeMinima"
                value={form.idadeMinima}
                onChange={handleChange}
                placeholder="De: 16"
                tipo="number"
              />
            </CampoComErro>

            <CampoComErro
              erro={erros.idadeMaxima}
            >
              <Inputsolicitacao
                label="Idade Máxima"
                name="idadeMaxima"
                value={form.idadeMaxima}
                onChange={handleChange}
                placeholder="Até: 24"
                tipo="number"
              />
            </CampoComErro>

            <CampoComErro erro={erros.sexo}>
              <Selectsolicitacao
                label="Sexo"
                name="sexo"
                value={form.sexo}
                onChange={handleChange}
                options={SEXOS}
              />
            </CampoComErro>

            <CampoComErro
              erro={erros.pratica}
            >
              <Selectsolicitacao
                label="Prática"
                name="pratica"
                value={form.pratica}
                onChange={handleChange}
                options={PRATICAS}
              />
            </CampoComErro>

            <CampoComErro
              erro={erros.curso || erroCursos}
            >
              <Selectsolicitacao
                label="Cursos"
                name="curso"
                value={form.curso}
                onChange={handleChange}
                options={cursos}
              />

              {carregandoCursos && (
                <p className="
                  mt-1
                  text-sm
                  text-gray-500
                ">
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
              />
            </CampoComErro>

            <CampoComErro
              erro={erros.quantidade}
            >
              <Inputsolicitacao
                label="Quantidade"
                name="quantidade"
                value={form.quantidade}
                onChange={handleChange}
                placeholder="Até 5"
                tipo="number"
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