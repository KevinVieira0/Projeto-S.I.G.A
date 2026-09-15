"use client";

import { useState } from "react";
import Image from "next/image";
import LoginBackground from "./LoginBackground";
import LoginInstitutional from "./LoginInstitutional";
import LoginTabs from "./LoginTabs";
import AdminLoginForm from "./AdminLoginForm";
import EmpresaLoginForm from "./EmpresaLoginForm";
import styles from "./Login.module.css";

export default function LoginCard() {
  const [activeTab, setActiveTab] = useState("admin");

  return (
    <div className={styles.page} data-profile={activeTab}>
      <LoginBackground />
      <div className={styles.pageSignature} aria-hidden="true">
        EDUCAÇÃO<br />TRABALHO<br />INDÚSTRIA<br />FUTURO
        <span />
      </div>
      <section className={styles.shell} aria-label="Acesso ao S.I.G.A.">
        <LoginInstitutional activeTab={activeTab} />
        {/* O mesmo cartão muda de posição; apenas o formulário é remontado. */}
        <div className={styles.formCard}>
          <header className={styles.formHeader}>
            <h1>Acesse sua conta</h1>
            <p>S.I.G.A. – Gestão de Aprendizes</p>
          </header>
          <LoginTabs activeTab={activeTab} onChange={setActiveTab} />
          <div
            key={activeTab}
            className={styles.formContent}
            aria-label={`Formulário de acesso: ${activeTab === "admin" ? "Administrador" : "Empresa"}`}
          >
            {activeTab === "admin" ? <AdminLoginForm /> : <EmpresaLoginForm />}
          </div>
          <footer className={styles.formFooter}>
            Acesso restrito a usuários autorizados.
          </footer>
        </div>
      </section>
      <footer className={styles.pageFooter}>
        <div className={styles.brandSignature}>
          <Image src="/images/Logo-SENAI.png" alt="SENAI" width={108} height={32} unoptimized />
          <span>Pelo desenvolvimento<br />de pessoas e da indústria</span>
        </div>
        <p>S.I.G.A. <span aria-hidden="true">|</span> Gestão de Aprendizes</p>
      </footer>
    </div>
  );
}
