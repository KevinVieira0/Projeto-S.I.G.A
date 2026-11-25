import StudentsTable from "@/components/dashboard/StudentsTable";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import CompaniesTable from "@/components/dashboard/CompaniesTable";

export const metadata = { title: "Visão Geral | Projeto S.I.G.A" };

export default function AdminDashboardPage() {
  return (
    <DashboardOverview empresas={<CompaniesTable />}>
      <StudentsTable />
    </DashboardOverview>
  );
}
