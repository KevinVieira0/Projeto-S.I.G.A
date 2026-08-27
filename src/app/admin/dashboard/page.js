import StudentSyncCard from "@/components/dashboard/StudentSyncCard";

export const metadata = {
  title: "Visão Geral | Projeto S.I.G.A",
};

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Visão Geral
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        Bem-vindo ao painel administrativo do S.I.G.A.
      </p>

      <StudentSyncCard />
    </div>
  );
}