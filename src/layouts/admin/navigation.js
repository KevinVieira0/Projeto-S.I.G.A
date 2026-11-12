import { Building2, GraduationCap, LayoutDashboard, Mail } from "lucide-react";
export const itensNavegacao = [
  {
    rotulo: "Visão Geral",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    descricao: "Dados e indicadores",
  },
  {
    rotulo: "Solicitações",
    href: "/admin/solicitacoes",
    icon: Mail,
    descricao: "Pedidos e indicações",
  },
  {
    rotulo: "Alunos",
    href: "/admin/alunos",
    icon: GraduationCap,
    descricao: "Cadastro e acompanhamento",
  },
  {
    rotulo: "Empresas",
    href: "/admin/empresas",
    icon: Building2,
    descricao: "Empresas beneficiárias",
  },
];
export function itemAtivo(caminho, href) {
  return caminho === href || caminho.startsWith(href + "/");
}
