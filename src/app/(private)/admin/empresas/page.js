import CompaniesTable from "@/components/dashboard/CompaniesTable";
import StudentIntakeStatus from "@/components/alunos/StudentIntakeStatus";

export const metadata = { title: "Empresas | Projeto S.I.G.A" };

export default function AdminEmpresasPage() {
  return (
    <div className="siga-pagina siga-entrada space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">Empresas</h1>
      <StudentIntakeStatus tipo="EMPRESA" />
      <CompaniesTable gestao />
    </div>
  );
}
