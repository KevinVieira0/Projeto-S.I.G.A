"use client";
import { useState } from "react";
import Inputsolicitacao from "../../../../components/solicitacao/inputsolicitacao";
import Selectsolicitacao from "../../../../components/solicitacao/selectsolicitacao";


const CURSOS = [

  { value: "administracao", label: "Administração" },
  { value: "automacao-industrial", label: "Automação Industrial" },
  { value: "desenvolvimento-sistemas", label: "Desenvolvimento de Sistemas" },
  { value: "edificacoes", label: "Edificações" },
  { value: "eletroeletronica", label: "Eletroeletrônica" },
  { value: "logistica", label: "Logística" },
  { value: "mecanica", label: "Mecânica" },
  { value: "mecatronica", label: "Mecatrônica" },
  { value: "metroferroviaria", label: "Metroferroviário" },
  { value: "seguranca-do-trabalho", label: "Segurança do Trabalho" }
];

export default function Solicitacao() {
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
  const erroStyle = "text-red-500 text-xs mt-px"
  function handleChange(e) {
    const { name, value, type } = e.target;

    if (name === "idadeMinima") {
      if (value < 0 || value > 24) {
        return;
      }
    }

    if (name === "idadeMaxima") {
      if (value < 0 || value > 24) {
        return;
      }
    }

    if (name === "quantidade") {
      const numero = Number(value);

      if (numero > 5) {
        return;
      }

      if (numero < 1 && value !== "") {
        return;
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "number" && value !== "" ? Number(value) : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    setErros({});

    if (
      form.idadeMinima === "" ||
      form.idadeMinima < 16 ||
      form.idadeMinima > 24
    ) {
      setErros((prev) => ({
        ...prev,
        idadeMinima: "A idade mínima deve estar entre 16 e 24.",
      }));
      return;
    }

    if (
      form.idadeMaxima === "" ||
      form.idadeMaxima < 16 ||
      form.idadeMaxima > 24
    ) {
      setErros((prev) => ({
        ...prev,
        idadeMaxima: "A idade máxima deve estar entre 16 e 24.",
      }));
      return;
    }

    if (form.idadeMinima > form.idadeMaxima) {
      setErros((prev) => ({
        ...prev,
        idadeMinima: "A idade mínima não pode ser maior que a idade máxima.",
        idadeMaxima: "A idade máxima não pode ser menor que a idade mínima.",
      }));
      return;
    }

    if (!form.sexo) {
      setErros((prev) => ({
        ...prev,
        sexo: "Selecione o sexo.",
      }));
      return;
    }

    if (!form.pratica) {
      setErros((prev) => ({
        ...prev,
        pratica: "Selecione a prática.",
      }));
      return;
    }

    if (
      form.quantidade === "" ||
      form.quantidade < 1 ||
      form.quantidade > 5 ||
      !Number.isInteger(form.quantidade)
    ) {
      setErros((prev) => ({
        ...prev,
        quantidade: "A quantidade deve estar entre 1 e 5.",
      }));
      return;
    }

    if (!form.curso) {
      setErros((prev) => ({
        ...prev,
        curso: "Selecione um curso.",
      }));
      return;
    }

    if (!form.inicio) {
      setErros((prev) => ({
        ...prev,
        inicio: "Informe a data de início.",
      }));
      return;
    }

    if (!form.fim) {
      setErros((prev) => ({
        ...prev,
        fim: "Informe a data de fim.",
      }));
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataInicio = new Date(`${form.inicio}T00:00:00`);
    const dataFim = new Date(`${form.fim}T00:00:00`);

    if (dataInicio < hoje) {
      setErros((prev) => ({
        ...prev,
        inicio: "A data de início não pode ser uma data passada.",
      }));
      return;
    }

    if (dataFim < hoje) {
      setErros((prev) => ({
        ...prev,
        fim: "A data de fim não pode ser uma data passada.",
      }));
      return;
    }

    if (dataInicio > dataFim) {
      setErros((prev) => ({
        ...prev,
        inicio: "A data de início não pode ser depois da data de fim.",
        fim: "A data de fim não pode ser antes da data de início.",
      }));
      return;
    }

    const limiteDataFim = new Date(dataInicio);
    limiteDataFim.setFullYear(limiteDataFim.getFullYear() + 2);

    if (dataFim > limiteDataFim) {
      setErros((prev) => ({
        ...prev,
        fim: "A data de fim não pode exceder 2 anos após a data de início.",
      }));
      return;
    }

    console.log(form);
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#f4f5f7] px-6 py-12">
      <div className="w-full max-w-[700px] rounded-xl bg-white p-10 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <img src="/images/Logo-SENAI.png" alt="Logo" className="mx-auto mb-4 mt-0 block h-auto w-[140px]" />
        <h1 className="mb-8 text-center text-[22px] text-[#0a3d7c]">Solicitação de Aprendizagem</h1>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 mb-6 grid grid-cols-[repeat(2,1fr)] gap-x-5 gap-y-4">
            <div>

              <Inputsolicitacao 
              label="Idade Mínima" 
              name="idadeMinima" 
              value={form.idadeMinima} 
              onChange={handleChange} 
              placeholder="De: 16" 
              tipo="number" />

              {erros.idadeMinima && (
                <span className={erroStyle}>{erros.idadeMinima}</span>)}
            </div>

            <div>
              <Inputsolicitacao 
              label="Idade Máxima" 
              name="idadeMaxima" 
              value={form.idadeMaxima} 
              onChange={handleChange} 
              placeholder="Até: 24" 
              tipo="number" />

              {erros.idadeMaxima && (
                <span className={erroStyle}>{erros.idadeMaxima}</span>
              )}

            </div>
            <Selectsolicitacao
              label="Sexo"
              name="sexo"
              value={form.sexo}
              onChange={handleChange}
              options={[
                { value: "masculino", label: "Masculino" },
                { value: "feminino", label: "Feminino" },
                { value: "todos", label: "Todos" },
              ]}
            />

            {erros.sexo && (
              <span className={erroStyle}> {erros.sexo}</span>
            )}

            <Selectsolicitacao
              label="Prática"
              name="pratica"
              value={form.pratica}
              onChange={handleChange}
              options={[
                { value: "com", label: "Com prática" },
                { value: "sem", label: "Sem prática" },
              ]}
            />

            {erros.pratica && (
              <span className={erroStyle}>{erros.pratica}</span>
            )}

            <Selectsolicitacao 
            label="Cursos" 
            name="curso" 
            value={form.curso} 
            onChange={handleChange} 
            options={CURSOS}
            />

            {erros.curso && (
              <span className={erroStyle}>{erros.curso}</span>
            )}

            <Inputsolicitacao 
            label="Início" 
            name="inicio" 
            value={form.inicio} 
            onChange={handleChange} 
            placeholder="DD/MM/AA" 
            tipo="date" />

            {erros.inicio && (
              <span className={erroStyle}>{erros.inicio}</span>
            )}

            <Inputsolicitacao 
            label="Fim" 
            name="fim" 
            value={form.fim} 
            onChange={handleChange} 
            placeholder="DD/MM/AA" 
            tipo="date" />

            {erros.fim && (
              <span className={erroStyle}>{erros.fim}</span>
            )}


            <Inputsolicitacao 
            label="Quantidade" 
            name="quantidade" 
            value={form.quantidade} 
            onChange={handleChange} 
            placeholder="Até 5" 
            tipo="number" />

            {erros.quantidade && (
              <span className={erroStyle}> {erros.quantidade}</span>
            )}

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

          <button type="submit" className="mt-2 block w-full cursor-pointer rounded-lg border-0 border-none bg-[#0a3d7c] px-5 py-3.5 text-[15px] font-semibold text-white transition-[background-color] duration-150 ease-[ease] hover:bg-[#072b58]">CONFIRMAR</button>
        </form>
      </div>
    </div>
  );
}
