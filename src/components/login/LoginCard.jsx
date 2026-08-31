"use client";

import { useState } from "react";
import PortalHeader from "./PortalHeader";
import LoginTabs from "./LoginTabs";
import AdminLoginForm from "./AdminLoginForm";
import EmpresaLoginForm from "./EmpresaLoginForm";

export default function LoginCard() {
  const [activeTab, setActiveTab] = useState("admin");

  return (
    <div className="w-full max-w-md">
      <PortalHeader />

      <div className="rounded-3xl bg-gray-200 p-8 shadow-sm ">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          Entrar na plataforma
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Selecione o tipo de conta para continuar
        </p>

        <LoginTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "admin" ? <AdminLoginForm /> : <EmpresaLoginForm />}

        <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
          Acesso restrito. Contas de administrador e de empresa são criadas e
          gerenciadas internamente — não há cadastro público.
        </p>
      </div>
    </div>
  );
}
