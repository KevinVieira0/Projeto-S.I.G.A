"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

export default function PerfilProtegido({ perfil, children }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && session?.tipo !== perfil) router.replace(ROUTES.LOGIN);
  }, [isLoading, session, perfil, router]);
  return !isLoading && session?.tipo === perfil ? children : null;
}
