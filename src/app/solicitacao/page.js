"use client";
import { useState } from "react";
import styles from "./page.module.css";

export default function Solicitacao() {
  return (
    <div className={styles.pagina}>
      <div className={styles.container}>
        <img src="/images/Logo-SENAI.png" alt="Logo" className={styles.logo} />
        <h1 className={styles.titulo}>Solicitação de Aprendizagem</h1>

        <form>
          <div className={styles.grupo}>
            <div className={styles.campo}>
              <p className={styles.titulodoInput}>Idade Mínima</p>
              <input type="text" placeholder="De: 16" />
            </div>

            <div className={styles.campo}>
              <p className={styles.titulodoInput}>Idade Máxima</p>
              <input type="text" placeholder="Até: 24" />
            </div>

            <div className={styles.campo}>
              <p className={styles.titulodoInput}>Sexo</p>
              <select>
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="todos">Todos</option>
              </select>
            </div>

            <div className={styles.campo}>
              <p className={styles.titulodoInput}>Prática</p>
              <select>
                <option value="">Selecione</option>
                <option value="com">Com prática</option>
                <option value="sem">Sem prática</option>
              </select>
            </div>

            <div className={`${styles.campo} ${styles.campoLargo}`}>
              <p className={styles.titulodoInput}>Cursos</p>
              <select>
                <option value="">Selecione</option>
                <option value="administracao">Administração</option>
                <option value="dev">Desenvolvimento de Sistemas</option>
                <option value="mecatronica">Mecatrônica</option>
              </select>
            </div>

            <div className={styles.campo}>
              <p className={styles.titulodoInput}>Início</p>
              <input type="text" placeholder="DD/MM/AA" />
            </div>

            <div className={styles.campo}>
              <p className={styles.titulodoInput}>Fim</p>
              <input type="text" placeholder="DD/MM/AA" />
            </div>

            <div className={styles.campo}>
              <p className={styles.titulodoInput}>Quantidade</p>
              <input type="text" placeholder="Até 5" />
            </div>

            <div className={styles.campo}>
              <p className={styles.titulodoInput}>Unidade</p>
              <select>
                <option value="">Selecione</option>
                <option value="vl">Vila Leopoldina</option>
                <option value="osasco">Osasco</option>
              </select>
            </div>

            <div className={`${styles.campo} ${styles.campoLargo}`}>
              <p className={styles.titulodoInput}>Observações</p>
              <input type="text" placeholder="Requisitos adicionais (opcional)" />
            </div>
          </div>

          <button type="submit" className={styles.botao}>CONFIRMAR</button>
        </form>
      </div>
    </div>
  );
}