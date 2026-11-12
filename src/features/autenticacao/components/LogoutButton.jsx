"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

const CORES = {
  azul: "bg-blue-700 hover:bg-blue-800 active:bg-blue-900",
  laranja: "bg-orange-800 hover:bg-orange-900 active:bg-orange-950",
};

export default function LogoutButton({ variante = "azul" }) {
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
        className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 ${CORES[variante]}`}
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
