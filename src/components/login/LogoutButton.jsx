"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function sair() {
    setLoading(true);
    setError("");
    try {
      await logout();
      router.replace(ROUTES.LOGIN);
      router.refresh();
    } catch {
      setError("Não foi possível sair. Tente novamente.");
      setLoading(false);
    }
  }
  return (
    <div>
      <button type="button" onClick={sair} disabled={loading}
        className="rounded px-2 py-1 text-sm font-semibold text-blue-900 hover:underline focus-visible:outline focus-visible:outline-2 disabled:opacity-50">
        {loading ? "Saindo..." : "Sair"}
      </button>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
