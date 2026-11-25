"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";
import Sidebar from "@/components/dashboard/Sidebar";
import StudentSyncNotification from "@/components/dashboard/StudentSyncNotification";
import estilos from "./Sidebar.module.css";

export default function AdminShell({ children }) {
  const { session: sessao, isLoading: carregando } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!carregando && (!sessao || sessao.tipo !== "admin")) {
      router.replace(ROUTES.LOGIN);
    }
  }, [carregando, sessao, router]);

  // Enquanto consulta a sessão no servidor ou redireciona, não renderiza
  // o conteúdo protegido — evita "flash" da tela de admin sem estar logado.
  if (carregando || !sessao || sessao.tipo !== "admin") {
    return null;
  }
  return (
    <div className={estilos.estrutura}>
      <Sidebar />

      <main className={estilos.conteudo}>
        <div className="flex justify-end px-[var(--siga-recuo-tela)] pt-4">
          <StudentSyncNotification />
        </div>
        {children}
      </main>
    </div>
  );
}
