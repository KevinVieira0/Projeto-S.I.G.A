import OverviewStatusCard from "@/features/dashboard/components/OverviewStatusCard";
import StudentsTable from "@/features/alunos/components/StudentsTable";
import DashboardOverview from "@/features/dashboard/components/DashboardOverview";
import StudentsByCourseCard from "@/features/dashboard/components/StudentsByCourseCard";
import CompaniesTable from "@/features/empresas/components/CompaniesTable";

export default function AdminDashboardPage() {
  return (
    <DashboardOverview
      empresas={
        <>
          <CompaniesTable />
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <OverviewStatusCard showViewToggle={false} initialView="empresas" />
          </div>
        </>
      }
    >
      <StudentsTable />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <OverviewStatusCard showViewToggle={false} />

        <StudentsByCourseCard />
      </div>
    </DashboardOverview>
  );
}
