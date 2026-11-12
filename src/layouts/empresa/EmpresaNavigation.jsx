"use client";
import Tabs from "@/shared/ui/Tabs";
const itens = [
  { id: "alunos", rotulo: "Aprendizes" },
  { id: "nova", rotulo: "Nova solicitação" },
  { id: "solicitacoes", rotulo: "Minhas solicitações" },
];
export default function EmpresaNavigation({ aba, alterar }) {
  return (
    <Tabs
      itens={itens}
      valor={aba}
      alterar={alterar}
      rotulo="Seções do painel"
      prefixo="empresa"
      className="empresa-navigation"
    />
  );
}
