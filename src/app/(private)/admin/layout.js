import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/authorize";
import { ROUTES } from "@/constants/routes";
import AdminShell from "@/components/dashboard/AdminShell";

export default async function AdminLayout({ children }) {
  const sessao = await getCurrentSession();
  if (sessao?.tipo !== "admin") redirect(ROUTES.LOGIN);
  return <AdminShell>{children}</AdminShell>;
}
