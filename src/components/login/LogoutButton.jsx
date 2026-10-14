"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erroCapturado, setErro] = useState("");
  async function sair() {
    setCarregando(true);
    setErro("");
    try {
      await logout();
      router.replace(ROUTES.LOGIN);
      router.refresh();
    } catch {
      setErro("Não foi possível sair. Tente novamente.");
      setCarregando(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={sair}
        disabled={carregando}
       className="inline-flex items-center justify-center rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 active:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {carregando ? "Saindo..." : "Sair"}
      </button>
      {erroCapturado && (
        <p role="alert" className="text-xs text-red-600">
          {erroCapturado}
        </p>
      )}
    </div>
  );
}
