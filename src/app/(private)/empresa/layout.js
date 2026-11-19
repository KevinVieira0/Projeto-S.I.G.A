import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/authorize";
import { ROUTES } from "@/constants/routes";
import PerfilProtegido from "@/components/login/PerfilProtegido";

export default async function EmpresaLayout({ children }) {
  const sessao = await getCurrentSession("empresa");
  if (sessao?.tipo !== "empresa") redirect(ROUTES.LOGIN);
  return <PerfilProtegido perfil="empresa">{children}</PerfilProtegido>;
}
