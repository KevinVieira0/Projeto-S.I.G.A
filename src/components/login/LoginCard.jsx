"use client";

import { useState } from "react";

import LoginBackground from "./LoginBackground";
import LoginVisualPanel from "./LoginVisualPanel";
import LoginTabs from "./LoginTabs";
import AdminLoginForm from "./AdminLoginForm";
import EmpresaLoginForm from "./EmpresaLoginForm";

export default function LoginCard() {
  const [activeTab, setActiveTab] = useState("admin");

  return (
    <>
      <LoginBackground activeTab={activeTab} />

      <section
        className="
          relative z-10 grid w-full max-w-6xl
          overflow-hidden rounded-[30px]
          border border-white/80 bg-white
          shadow-[0_24px_80px_-24px_rgba(15,52,96,0.30)]
          lg:grid-cols-[0.9fr_1.1fr]
        "
      >
        <LoginVisualPanel activeTab={activeTab} />

        <div className="flex min-h-[560px] flex-col justify-center bg-white p-6 sm:p-10 lg:min-h-[620px] lg:p-14">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Portal de acesso
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Acesse sua conta
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Selecione o perfil e informe seus dados para
              continuar.
            </p>
          </header>

          <LoginTabs
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div
            className="mt-2"
            aria-live="polite"
            aria-label={`Formulário de acesso: ${
              activeTab === "admin"
                ? "Administrador"
                : "Empresa"
            }`}
          >
            {activeTab === "admin" ? (
              <AdminLoginForm />
            ) : (
              <EmpresaLoginForm />
            )}
          </div>

          <footer className="mt-7 border-t border-slate-200 pt-5">
            <p className="text-center text-xs leading-relaxed text-slate-400">
              Acesso restrito a administradores e empresas
              previamente autorizadas.
            </p>
          </footer>
        </div>
      </section>
    </>
  );
}