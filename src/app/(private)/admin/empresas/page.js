import RecebimentosCadastro from "@/components/dashboard/RecebimentosCadastro";

export const metadata = { title: "Empresas | Projeto S.I.G.A" };

export default function AdminEmpresasPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
      <RecebimentosCadastro tipo="EMPRESA" />
    </div>
  );
}
