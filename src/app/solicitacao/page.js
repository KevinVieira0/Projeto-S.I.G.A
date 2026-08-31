"use client";

import { useState } from "react";
import styles from "../../app/solicitacao/page.module.css";
import Inputsolicitacao from "../../components/solicitacao/inputsolicitacao";
import Selectsolicitacao from "../../components/solicitacao/selectsolicitacao";

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
  { value: "seguranca-do-trabalho", label: "Segurança do Trabalho" },
];

export default function Solicitacao() {
  const [form, setForm] = useState({
    idadeMinima: "",
    idadeMaxima: "",
    sexo: "",
    pratica: "",
    curso: "",
    inicio: "",
    fim: "",
    quantidade: "",
    observacoes: "",
  });

  const [erros, setErros] = useState({});

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
    <div className={styles.pagina}>
      <div className={styles.container}>
        <img
          src="/images/Logo-SENAI.png"
          alt="Logo"
          className={styles.logo}
        />

        <h1 className={styles.titulo}>Solicitação de Aprendizagem</h1>

        <form onSubmit={handleSubmit}>
          <div className={styles.grupo}>
            <div className={styles.campo}>
              <Inputsolicitacao
                label="Idade Mínima"
                name="idadeMinima"
                value={form.idadeMinima}
                onChange={handleChange}
                placeholder="De: 16"
                tipo="number"
              />

              {erros.idadeMinima && (
                <span className={styles.erro}>{erros.idadeMinima}</span>
              )}
            </div>

            <div className={styles.campo}>
              <Inputsolicitacao
                label="Idade Máxima"
                name="idadeMaxima"
                value={form.idadeMaxima}
                onChange={handleChange}
                placeholder="Até: 24"
                tipo="number"
              />

              {erros.idadeMaxima && (
                <span className={styles.erro}>{erros.idadeMaxima}</span>
              )}
            </div>

            <div className={styles.campo}>
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
                <span className={styles.erro}>{erros.sexo}</span>
              )}
            </div>

            <div className={styles.campo}>
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
                <span className={styles.erro}>{erros.pratica}</span>
              )}
            </div>

            <div className={styles.campo}>
              <Inputsolicitacao
                label="Quantidade"
                name="quantidade"
                value={form.quantidade}
                onChange={handleChange}
                placeholder="Até 5"
                tipo="number"
                min="1"
                max="5"
              />

              {erros.quantidade && (
                <span className={styles.erro}>{erros.quantidade}</span>
              )}
            </div>

            <div className={styles.campo}>
              <Selectsolicitacao
                label="Cursos"
                name="curso"
                value={form.curso}
                onChange={handleChange}
                options={CURSOS}
              />

              {erros.curso && (
                <span className={styles.erro}>{erros.curso}</span>
              )}
            </div>

            <div className={styles.campo}>
              <Inputsolicitacao
                label="Início"
                name="inicio"
                value={form.inicio}
                onChange={handleChange}
                placeholder="DD/MM/AA"
                tipo="date"
              />

              {erros.inicio && (
                <span className={styles.erro}>{erros.inicio}</span>
              )}
            </div>

            <div className={styles.campo}>
              <Inputsolicitacao
                label="Fim"
                name="fim"
                value={form.fim}
                onChange={handleChange}
                placeholder="DD/MM/AA"
                tipo="date"
              />

              {erros.fim && (
                <span className={styles.erro}>{erros.fim}</span>
              )}
            </div>

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

          <button type="submit" className={styles.botao}>
            CONFIRMAR
          </button>
        </form>
      </div>
    </div>
  );
}