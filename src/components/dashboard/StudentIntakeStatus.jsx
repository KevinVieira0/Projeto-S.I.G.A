"use client";

import { useSincronizacaoAlunos } from "@/hooks/useSincronizacaoAlunos";
import { dashboardStyles } from "./DashboardCard";

export default function StudentIntakeStatus({ tipo = "ALUNO" }) {
  const {
    sincronizar,
    isLoading: carregando,
    resposta,
    erro,
  } = useSincronizacaoAlunos();
  const empresa = tipo === "EMPRESA";
  const registro = resposta?.recebimentos?.[empresa ? "empresas" : "alunos"];
  return (
    <section className="my-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <div>
        <p className="text-sm font-medium text-blue-950">
          Cadastro e atualização automática por {empresa ? "CNPJ" : "CPF"}
        </p>
        <p className="mt-1 text-xs text-blue-900">
          {empresa
            ? "Os dados válidos entram automaticamente. Situação cadastral e acesso existentes são preservados."
            : "Os dados válidos entram automaticamente. Status e vínculos administrativos são preservados."}
        </p>
        {registro && (
          <p role="status" className="mt-2 text-xs text-blue-900">
            {registro.criados} criados · {registro.atualizados} atualizados ·{" "}
            {registro.invalidos} envios inválidos · {registro.falhas} falhas ·{" "}
            {registro.restantes} aguardando processamento
          </p>
        )}
        {erro && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        {resposta?.recebimentos?.espelho?.falha && (
          <p role="alert" className="mt-2 text-xs text-amber-800">
            {resposta.recebimentos.espelho.mensagem}
          </p>
        )}
      </div>
      <button
        onClick={sincronizar}
        disabled={carregando}
        className={dashboardStyles.primaryAction}
      >
        {carregando ? "Processando…" : "Sincronizar cadastros"}
      </button>
    </section>
  );
}
