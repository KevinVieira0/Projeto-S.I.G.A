"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/login/LogoutButton";
import { ROUTES } from "@/constants/routes";

/* ---------- Dados de exemplo (somente visualização) ---------- */

const ABAS = [
  { id: "alunos", rotulo: "Aprendizes contratados" },
  { id: "nova", rotulo: "Nova solicitação" },
  { id: "solicitacoes", rotulo: "Minhas solicitações" },
];

const APRENDIZES = [
  { nome: "Lucas Ferreira", curso: "Mecânica de Usinagem", inicio: "03/02/2026", fim: "03/02/2028", pratica: "Presencial", status: "Ativo" },
  { nome: "Mariana Souza", curso: "Eletromecânica", inicio: "03/02/2026", fim: "03/02/2028", pratica: "Presencial", status: "Ativo" },
  { nome: "Pedro Henrique Lima", curso: "Automação Industrial", inicio: "15/05/2026", fim: "15/05/2028", pratica: "Remota", status: "Ativo" },
  { nome: "Beatriz Almeida", curso: "Logística", inicio: "10/08/2026", fim: "10/08/2028", pratica: "Presencial", status: "Ativo" },
  { nome: "Rafael Costa", curso: "Mecânica de Usinagem", inicio: "01/03/2025", fim: "01/03/2027", pratica: "Presencial", status: "Ativo" },
  { nome: "Camila Rocha", curso: "Eletromecânica", inicio: "20/01/2025", fim: "20/10/2026", pratica: "Presencial", status: "Encerra em breve" },
];

const SOLICITACOES = [
  { codigo: "SOL-0042", curso: "Eletromecânica", quantidade: 3, encaminhados: 1, faixa: "16 a 21 anos", pratica: "Presencial", periodo: "01/11/2026 a 01/11/2028", criada: "28/09/2026", status: "Em andamento" },
  { codigo: "SOL-0045", curso: "Automação Industrial", quantidade: 2, encaminhados: 0, faixa: "17 a 24 anos", pratica: "Remota", periodo: "02/01/2027 a 02/01/2029", criada: "03/10/2026", status: "Em análise" },
  { codigo: "SOL-0031", curso: "Logística", quantidade: 1, encaminhados: 1, faixa: "16 a 22 anos", pratica: "Presencial", periodo: "10/08/2026 a 10/08/2028", criada: "02/07/2026", status: "Atendida" },
  { codigo: "SOL-0024", curso: "Mecânica de Usinagem", quantidade: 4, encaminhados: 4, faixa: "16 a 20 anos", pratica: "Presencial", periodo: "03/02/2026 a 03/02/2028", criada: "10/12/2025", status: "Atendida" },
];

const ESTILO_STATUS = {
  "Em análise": "bg-amber-100 text-amber-800",
  "Em andamento": "bg-orange-100 text-orange-800",
  Atendida: "bg-emerald-100 text-emerald-800",
  Ativo: "bg-emerald-100 text-emerald-800",
  "Encerra em breve": "bg-amber-100 text-amber-800",
};

/* ---------- Componentes auxiliares ---------- */

function Status({ valor }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
        ESTILO_STATUS[valor] || "bg-slate-100 text-slate-700"
      }`}
    >
      {valor}
    </span>
  );
}

function Resumo({ valor, rotulo }) {
  return (
    <div className="rounded-2xl bg-white/15 px-5 py-3 text-white">
      <p className="text-3xl font-black leading-none">{valor}</p>
      <p className="mt-1 text-sm text-orange-50">{rotulo}</p>
    </div>
  );
}

function CampoLeitura({ rotulo, valor, largo = false }) {
  return (
    <div className={largo ? "col-span-full" : ""}>
      <dt className="mb-1 text-sm font-semibold text-slate-700">{rotulo}</dt>
      <dd className="min-h-[46px] rounded-xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-sm text-slate-800">
        {valor}
      </dd>
    </div>
  );
}

/* ---------- Conteúdo de cada aba ---------- */

function AbaAprendizes() {
  return (
    <section aria-labelledby="titulo-aprendizes">
      <h2 id="titulo-aprendizes" className="text-2xl font-black text-slate-900">
        Aprendizes contratados
      </h2>
      <p className="mt-1 text-slate-600">
        Jovens formados pelo SENAI que atuam hoje na sua empresa.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-orange-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-orange-500 text-white">
            <tr>
              <th className="px-5 py-3 font-semibold">Aprendiz</th>
              <th className="px-5 py-3 font-semibold">Curso</th>
              <th className="px-5 py-3 font-semibold">Prática</th>
              <th className="px-5 py-3 font-semibold">Início</th>
              <th className="px-5 py-3 font-semibold">Término</th>
              <th className="px-5 py-3 font-semibold">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100">
            {APRENDIZES.map((a) => (
              <tr key={a.nome} className="odd:bg-white even:bg-orange-50/40">
                <td className="px-5 py-4 font-semibold text-slate-900">{a.nome}</td>
                <td className="px-5 py-4 text-slate-700">{a.curso}</td>
                <td className="px-5 py-4 text-slate-700">{a.pratica}</td>
                <td className="px-5 py-4 text-slate-700">{a.inicio}</td>
                <td className="px-5 py-4 text-slate-700">{a.fim}</td>
                <td className="px-5 py-4">
                  <Status valor={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AbaNovaSolicitacao() {
  return (
    <section aria-labelledby="titulo-nova">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="titulo-nova" className="text-2xl font-black text-slate-900">
            Nova solicitação
          </h2>
          <p className="mt-1 max-w-xl text-slate-600">
            Informe o perfil do aprendiz que você procura. Abaixo está um exemplo
            dos dados pedidos no formulário.
          </p>
        </div>
        <Link
          href={ROUTES.EMPRESA_SOLICITACAO}
          className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
        >
          Preencher solicitação
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-5 gap-y-5 rounded-2xl border border-orange-200 bg-white p-6 sm:grid-cols-2">
        <CampoLeitura rotulo="Idade mínima" valor="16 anos" />
        <CampoLeitura rotulo="Idade máxima" valor="24 anos" />
        <CampoLeitura rotulo="Sexo" valor="Indiferente" />
        <CampoLeitura rotulo="Prática" valor="Presencial" />
        <CampoLeitura rotulo="Curso" valor="Eletromecânica" />
        <CampoLeitura rotulo="Quantidade (até 5)" valor="3 aprendizes" />
        <CampoLeitura rotulo="Início previsto" valor="01/11/2026" />
        <CampoLeitura rotulo="Término previsto" valor="01/11/2028" />
        <CampoLeitura
          rotulo="Observações"
          valor="Disponibilidade para o turno da manhã."
          largo
        />
      </dl>
    </section>
  );
}

function AbaSolicitacoes() {
  return (
    <section aria-labelledby="titulo-solicitacoes">
      <h2 id="titulo-solicitacoes" className="text-2xl font-black text-slate-900">
        Minhas solicitações
      </h2>
      <p className="mt-1 text-slate-600">
        Acompanhe os pedidos já enviados e em que etapa cada um está.
      </p>

      <ul className="mt-6 space-y-4">
        {SOLICITACOES.map((s) => {
          const pct = Math.round((s.encaminhados / s.quantidade) * 100);
          return (
            <li
              key={s.codigo}
              className="rounded-2xl border border-orange-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{s.curso}</h3>
                  <p className="text-sm text-slate-500">
                    {s.codigo}, enviada em {s.criada}
                  </p>
                </div>
                <Status valor={s.status} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-slate-500">Faixa etária</dt>
                  <dd className="font-semibold text-slate-800">{s.faixa}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Prática</dt>
                  <dd className="font-semibold text-slate-800">{s.pratica}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Período</dt>
                  <dd className="font-semibold text-slate-800">{s.periodo}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600">Aprendizes encaminhados</span>
                  <span className="font-semibold text-slate-800">
                    {s.encaminhados} de {s.quantidade}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-orange-100"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${s.encaminhados} de ${s.quantidade} aprendizes encaminhados`}
                >
                  <div className="h-full rounded-full bg-orange-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- Página ---------- */

export default function DashboardEmpresa() {
  const [aba, setAba] = useState("alunos");

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Faixa laranja: identificação + abas encaixadas no conteúdo */}
      <header className="bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600">
        <div className="mx-auto max-w-6xl px-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">
                Olá, Metalúrgica Horizonte
              </h1>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Resumo valor={APRENDIZES.length} rotulo="aprendizes contratados" />
            <Resumo
              valor={SOLICITACOES.filter((s) => s.status !== "Atendida").length}
              rotulo="solicitações abertas"
            />
          </div>

          <div role="tablist" aria-label="Seções do painel" className="mt-8 flex gap-1 overflow-x-auto">
            {ABAS.map((item) => {
              const ativa = aba === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  id={`aba-${item.id}`}
                  aria-selected={ativa}
                  aria-controls={`painel-${item.id}`}
                  onClick={() => setAba(item.id)}
                  className={`shrink-0 rounded-t-2xl px-6 py-3 text-sm font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70 ${
                    ativa
                      ? "bg-orange-50 text-orange-700"
                      : "text-white hover:bg-white/15"
                  }`}
                >
                  {item.rotulo}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div
          role="tabpanel"
          id={`painel-${aba}`}
          aria-labelledby={`aba-${aba}`}
        >
          {aba === "alunos" && <AbaAprendizes />}
          {aba === "nova" && <AbaNovaSolicitacao />}
          {aba === "solicitacoes" && <AbaSolicitacoes />}
        </div>
      </main>
    </div>
  );
}