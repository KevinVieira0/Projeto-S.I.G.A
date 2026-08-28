"use client";
import { useState } from "react";
import styles from "../../app/solicitacao/page.module.css";
import Inputsolicitacao from "../../components/solicitacao/inputsolicitacao";
import Selectsolicitacao from "../../components/solicitacao/selectsolicitacao";


const CURSOS = [
  { value: "administracao", label: "Administração" },
  { value: "dev", label: "Desenvolvimento de Sistemas" },
  { value: "mecatronica", label: "Mecatrônica" },
];

const UNIDADES = [
  { value: "vl", label: "Vila Leopoldina" },
  { value: "osasco", label: "Osasco" },
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
    unidade: "",
    observacoes: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log(form);
    // TODO: chamada para a API
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <img src="/images/Logo-SENAI.png" alt="Logo" className={styles.logo} />
        <h1 className={styles.titulo}>Solicitação de Aprendizagem</h1>

        <form onSubmit={handleSubmit}>
          <div className={styles.grupo}>
            <Inputsolicitacao label="Idade Mínima" name="idadeMinima" value={form.idadeMinima} onChange={handleChange} placeholder="De: 16" />
            <Inputsolicitacao label="Idade Máxima" name="idadeMaxima" value={form.idadeMaxima} onChange={handleChange} placeholder="Até: 24" />

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

            <Selectsolicitacao label="Cursos" name="curso" value={form.curso} onChange={handleChange} options={CURSOS} largo />

            <Inputsolicitacao label="Início" name="inicio" value={form.inicio} onChange={handleChange} placeholder="DD/MM/AA" />
            <Inputsolicitacao label="Fim" name="fim" value={form.fim} onChange={handleChange} placeholder="DD/MM/AA" />
            <Inputsolicitacao label="Quantidade" name="quantidade" value={form.quantidade} onChange={handleChange} placeholder="Até 5" />

            <Selectsolicitacao label="Unidade" name="unidade" value={form.unidade} onChange={handleChange} options={UNIDADES} />

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

          <button type="submit" className={styles.botao}>CONFIRMAR</button>
        </form>
      </div>
    </div>
  );
}