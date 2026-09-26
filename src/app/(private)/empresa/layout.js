import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/authorize";
import { ROUTES } from "@/constants/routes";

export default async function EmpresaLayout({ children }) {
  const session = await getCurrentSession();
  if (session?.tipo !== "empresa") redirect(ROUTES.LOGIN);
  return children;
}
