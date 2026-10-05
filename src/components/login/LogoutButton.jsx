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
        className="rounded px-2 py-1 text-sm font-semibold text-blue-900 hover:underline focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
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
