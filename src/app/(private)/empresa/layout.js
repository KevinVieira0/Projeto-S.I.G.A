import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/authorize";
import { ROUTES } from "@/constants/routes";

export default async function EmpresaLayout({ children }) {
  const sessao = await getCurrentSession();
  if (sessao?.tipo !== "empresa") redirect(ROUTES.LOGIN);
  return children;
}
