"use client";

import { useEffect, useState } from "react";
import { listSolicitacoes } from "@/lib/api/solicitacaoService";
import LogoutButton from "@/components/login/LogoutButton";
import FormularioSolicitacao from "@/components/empresa/FormularioSolicitacao";

/* ---------- Dados de exemplo (somente visualização) ---------- */

const ABAS = [
  { id: "alunos", rotulo: "Aprendizes contratados" },
  { id: "nova", rotulo: "Nova solicitação" },
  { id: "solicitacoes", rotulo: "Minhas solicitações" },
];

const ESTILO_STATUS = {
  "Em análise": "bg-amber-100 text-amber-800",
  "Em andamento": "bg-orange-100 text-orange-800",
  Atendida: "bg-emerald-100 text-emerald-800",
  Ativo: "bg-emerald-100 text-emerald-800",
  "Encerra em breve": "bg-amber-100 text-amber-800",
  Ativa: "bg-emerald-100 text-emerald-800",
  Encerrada: "bg-slate-100 text-slate-700",
};

function Status({ valor }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ESTILO_STATUS[valor] || "bg-slate-100 text-slate-700"
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

function AbaAprendizes() {

  const [aprendizes, setAprendizes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function buscarAprendizes() {
      try {
        const resposta = await fetch("/api/empresas/aprendizes");
        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados.mensagem || "Não foi possível carregar os aprendizes."
          );
        }

        setAprendizes(dados.aprendizes);
      } catch (erro) {
        setErro(erro.message || "Erro ao carregar os aprendizes.");
      } finally {
        setCarregando(false);
      }
    }

    buscarAprendizes();
  }, []);

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
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Carregando aprendizes...
                </td>
              </tr>
            ) : erro ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-red-600">
                  {erro}
                </td>
              </tr>
            ) : aprendizes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Nenhum aprendiz contratado encontrado.
                </td>
              </tr>
            ) : (
              aprendizes.map((a) => (
                <tr key={a.id} className="odd:bg-white even:bg-orange-50/40">
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {a.nome}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{a.curso}</td>
                  <td className="px-5 py-4 text-slate-700">—</td>
                  <td className="px-5 py-4 text-slate-700">—</td>
                  <td className="px-5 py-4 text-slate-700">—</td>
                  <td className="px-5 py-4">
                    <Status valor={a.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}



function AbaNovaSolicitacao() {
  return (
    <section aria-labelledby="titulo-nova">
      <h2 id="titulo-nova" className="text-2xl font-black text-slate-900">
        Nova solicitação
      </h2>
      <p className="mt-1 text-slate-600">
        Informe o perfil do aprendiz que você procura.
      </p>
      <div className="mt-6">
        <FormularioSolicitacao />
      </div>
    </section>
  );
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

const NOME_PERIODO = { manha: "Manhã", tarde: "Tarde" };

function AbaSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    listSolicitacoes()
      .then(setSolicitacoes)
      .catch(() => setErro("Não foi possível carregar as solicitações."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <section aria-labelledby="titulo-solicitacoes">
      <h2 id="titulo-solicitacoes" className="text-2xl font-black text-slate-900">
        Minhas solicitações
      </h2>
      <p className="mt-1 text-slate-600">
        Acompanhe os pedidos já enviados e em que etapa cada um está.
      </p>

      {carregando && <p className="mt-6 text-slate-500">Carregando...</p>}
      {erro && (
        <p role="alert" className="mt-6 text-red-600">
          {erro}
        </p>
      )}
      {!carregando && !erro && solicitacoes.length === 0 && (
        <p className="mt-6 text-slate-500">Você ainda não enviou nenhuma solicitação.</p>
      )}

      <ul className="mt-6 space-y-4">
        {solicitacoes.map((s) => (
          <li key={s.id} className="rounded-2xl border border-orange-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{s.cursos}</h3>
                <p className="text-sm text-slate-500">
                  SOL-{s.id.slice(0, 6).toUpperCase()}, enviada em {formatarData(s.criadoEm)}
                </p>
              </div>
              <Status valor={s.ativa ? "Ativa" : "Encerrada"} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-slate-500">Faixa etária</dt>
                <dd className="font-semibold text-slate-800">
                  {s.idadeMinima} a {s.idadeMaxima} anos
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Prática</dt>
                <dd className="font-semibold text-slate-800">
                  {s.pratica === "com"
                    ? `Com prática${s.periodoPratica ? ` (${NOME_PERIODO[s.periodoPratica]})` : ""}`
                    : "Sem prática"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Vagas</dt>
                <dd className="font-semibold text-slate-800">{s.quantidadeVagas}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Período</dt>
                <dd className="font-semibold text-slate-800">
                  {formatarData(s.inicio)} a {formatarData(s.fim)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Página ---------- */


export default function DashboardEmpresa() {
  const [aba, setAba] = useState("alunos");
  const [nomeEmpresa, setNomeEmpresa] = useState("");

  useEffect(() => {
    async function buscarEmpresa() {
      try {
        const resposta = await fetch("/api/empresas/me");

        if (!resposta.ok) {
          throw new Error("Não foi possível buscar a empresa.");
        }

        const dados = await resposta.json();
        setNomeEmpresa(dados.nome);
      } catch (erro) {
        console.error("Erro ao carregar a empresa:", erro);
      }
    }

    buscarEmpresa();
  }, []);


  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header flutuante: o wrapper é sticky e não captura cliques (pointer-events-none);
        só a pílula recebe eventos, então o conteúdo atrás continua clicável */}
      <header className="pointer-events-none sticky top-0 z-40 flex justify-center px-6 pt-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 p-1.5 shadow-lg shadow-orange-900/10 backdrop-blur-xl">
          <div
            role="tablist"
            aria-label="Seções do painel"
            className="flex gap-1"
          >
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
                  className={`shrink-0 rounded-full px-5 py-2 text-sm font-bold transition-colors duration-200 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-800 ${ativa
                      ? "bg-orange-100 text-orange-900 ring-1 ring-inset ring-orange-300"
                      : "text-orange-950 hover:bg-orange-100/70"
                    }`}
                >
                  {item.rotulo}
                </button>
              );
            })}
          </div>

          <span aria-hidden="true" className="mx-1 h-6 w-px bg-orange-200" />

          <div className="shrink-0 pr-0.5">
            <LogoutButton variante="laranja" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-10 pt-8">
        {/* Saudação movida do header para o conteúdo (remova esta linha se não quiser) */}
        <h1 className="mb-6 text-2xl font-extrabold text-[#0f172a] sm:text-3xl">
          Olá, {nomeEmpresa || "..."}
        </h1>

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