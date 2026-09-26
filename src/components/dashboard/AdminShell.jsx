"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";
import Sidebar from "@/components/dashboard/Sidebar";

export default function AdminShell({ children }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!session || session.tipo !== "admin")) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isLoading, session, router]);

  // Enquanto consulta a sessão no servidor ou redireciona, não renderiza
  // o conteúdo protegido — evita "flash" da tela de admin sem estar logado.
  if (isLoading || !session || session.tipo !== "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
