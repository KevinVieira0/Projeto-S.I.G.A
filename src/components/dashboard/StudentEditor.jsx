"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/axiosClient";
import { dashboardStyles } from "./DashboardCard";

const inicial = {
  nome: "",
  cpf: "",
  dataNascimento: "",
  email: "",
  celular: "",
  genero: "",
  telefone: "",
  endereco: "",
  cep: "",
  turmaId: "",
  termo: 1,
  status: "DISPONIVEL",
  empresaId: null,
};
const statusPorRotulo = {
  Disponível: "DISPONIVEL",
  Indicado: "INDICADO",
  "Em processo": "EM_PROCESSO",
  Contratado: "CONTRATADO",
};
const classeCampo =
  "mt-1 min-h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50";

function preencherFormulario(aluno) {
  return Object.fromEntries(
    Object.keys(inicial).map((campo) => {
      if (campo === "status") {
        return [campo, statusPorRotulo[aluno.statusIndicacao] || "DISPONIVEL"];
      }
      if (campo === "dataNascimento") {
        return [campo, aluno[campo]?.slice(0, 10) || ""];
      }
      return [campo, aluno[campo] ?? inicial[campo]];
    }),
  );
}

export default function StudentEditor({ alunoId, modo, onClose, onSaved }) {
  const dialogoRef = useRef(null);
  const [formulario, setFormulario] = useState(inicial);
  const [versao, setVersao] = useState(null);
  const [catalogo, setCatalogo] = useState({ turmas: [], empresas: [] });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const excluir = modo === "excluir";
  const editar = Boolean(alunoId);
  useEffect(() => {
    const elemento = dialogoRef.current;
    elemento.showModal();
    const controlador = new AbortController();
    async function carregar() {
      try {
        const [respostaCatalogo, respostaAluno] = await Promise.all([
          excluir
            ? Promise.resolve({ data: { turmas: [], empresas: [] } })
            : apiClient.get("/admin/alunos/catalogo", { signal: controlador.signal }),
          editar
            ? apiClient.get("/admin/alunos/" + alunoId, { signal: controlador.signal })
            : Promise.resolve(null),
        ]);
        if (controlador.signal.aborted) return;
        setCatalogo(respostaCatalogo.data);
        if (respostaAluno) {
          const aluno = respostaAluno.data.aluno;
          setFormulario(preencherFormulario(aluno));
          setVersao(aluno.versao);
        }
      } catch (erroCapturado) {
        if (!controlador.signal.aborted)
          setErro(
            erroCapturado.response?.data?.mensagem ||
              "Não foi possível carregar o cadastro.",
          );
      } finally {
        if (!controlador.signal.aborted) setCarregando(false);
      }
    }
    carregar();
    return () => {
      controlador.abort();
      elemento.close();
    };
  }, [alunoId, editar, excluir]);
  const mudar = (chave, valor) =>
    setFormulario((anterior) => ({
      ...anterior,
      [chave]: valor,
      ...(chave === "status" && valor === "DISPONIVEL" ? { empresaId: null } : {}),
    }));
  const turma = catalogo.turmas.find((oferta) => oferta.id === formulario.turmaId);
  async function salvar(evento) {
    evento.preventDefault();
    if (carregando || salvando) return;
    setErro("");
    setSalvando(true);
    try {
      if (excluir)
        await apiClient.delete("/admin/alunos/" + alunoId, { data: { versao } });
      else if (editar)
        await apiClient.patch("/admin/alunos/" + alunoId, {
          ...formulario,
          termo: Number(formulario.termo),
          versao,
        });
      else
        await apiClient.post("/admin/alunos", {
          ...formulario,
          termo: Number(formulario.termo),
        });
      window.dispatchEvent(new Event("alunos:sincronizados"));
      onSaved(
        excluir
          ? "Aluno excluído das listagens."
          : editar
            ? "Aluno atualizado."
            : "Aluno cadastrado.",
      );
    } catch (erroCapturado) {
      setErro(
        erroCapturado.response?.data?.mensagem ||
          "Não foi possível salvar. Tente novamente.",
      );
      setSalvando(false);
    }
  }
  const campo = (chave, rotulo, tipo = "text", atributos = {}) => (
    <label className="text-xs font-medium text-gray-600">
      {rotulo}
      <input
        className={classeCampo}
        type={tipo}
        value={formulario[chave]}
        onChange={(evento) => mudar(chave, evento.target.value)}
        {...atributos}
      />
    </label>
  );
  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="student-editor-title"
      onCancel={(evento) => {
        evento.preventDefault();
        if (!salvando) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/40"
    >
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div>
          <h2 id="student-editor-title" className="text-lg font-semibold text-gray-900">
            {excluir ? "Excluir aluno" : editar ? "Editar aluno" : "Novo aluno"}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {excluir
              ? "O histórico será preservado."
              : "Cadastro direto no sistema, conectado à Visão Geral."}
          </p>
        </div>
        <button
          type="button"
          aria-label="Fechar cadastro"
          disabled={salvando}
          onClick={onClose}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={salvar}>
        <fieldset disabled={carregando || salvando} className="space-y-5 px-6 py-5">
          {carregando ? (
            <p role="status" className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando cadastro…
            </p>
          ) : excluir ? (
            <p className="text-sm leading-6 text-gray-600">
              Excluir <strong className="text-gray-900">{formulario.nome}</strong>? O
              aluno sairá das tabelas, dos gráficos e das buscas. As matrículas e o
              histórico continuarão guardados, e novos envios deste CPF não reativarão o
              cadastro automaticamente.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {campo("nome", "Nome completo", "text", {
                  required: true,
                  maxLength: 150,
                })}
                {campo("cpf", "CPF", "text", {
                  required: true,
                  maxLength: 14,
                  inputMode: "numeric",
                })}
                {campo("dataNascimento", "Data de nascimento", "date", {
                  required: true,
                })}
                <label className="text-xs font-medium text-gray-600">
                  Gênero
                  <select
                    className={classeCampo}
                    value={formulario.genero}
                    onChange={(evento) => mudar("genero", evento.target.value)}
                  >
                    {["", "Masculino", "Feminino", "Outro", "Prefiro não informar"].map(
                      (valor) => (
                        <option key={valor} value={valor}>
                          {valor || "Não informado"}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                {campo("email", "E-mail", "email", { required: true, maxLength: 255 })}
                {campo("celular", "Celular com DDD", "tel", {
                  required: true,
                  maxLength: 20,
                })}
                {campo("telefone", "Telefone (opcional)", "tel", { maxLength: 30 })}
                {campo("cep", "CEP (opcional)", "text", {
                  maxLength: 10,
                  inputMode: "numeric",
                })}
              </div>
              {campo("endereco", "Endereço (opcional)", "text", { maxLength: 300 })}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Dados acadêmicos
                </h3>
                <label className="text-xs font-medium text-gray-600">
                  Curso e turma
                  <select
                    required
                    className={classeCampo}
                    value={formulario.turmaId}
                    onChange={(evento) => {
                      mudar("turmaId", evento.target.value);
                      mudar("termo", 1);
                    }}
                  >
                    <option value="">Selecione uma oferta</option>
                    {catalogo.turmas.map((oferta) => (
                      <option key={oferta.id} value={oferta.id}>
                        {oferta.curso.nome} · {oferta.curso.tipoCurso} · {oferta.codigo} ·{" "}
                        {oferta.turno}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {campo("termo", "Termo atual", "number", {
                    required: true,
                    min: 1,
                    max: turma?.quantidadeTermos || 1,
                  })}
                  <p className="self-end pb-2 text-xs text-gray-500">
                    {turma
                      ? `${turma.turno} · ${turma.quantidadeTermos} termos no curso`
                      : "Curso e período serão preenchidos pela turma selecionada."}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Situação profissional
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-medium text-gray-600">
                    Status
                    <select
                      className={classeCampo}
                      value={formulario.status}
                      onChange={(evento) => mudar("status", evento.target.value)}
                    >
                      <option value="DISPONIVEL">Disponível</option>
                      <option value="INDICADO">Indicado</option>
                      <option value="EM_PROCESSO">Em processo</option>
                      <option value="CONTRATADO">Empregado</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium text-gray-600">
                    Empresa vinculada
                    <select
                      required={formulario.status !== "DISPONIVEL"}
                      disabled={formulario.status === "DISPONIVEL"}
                      className={classeCampo}
                      value={formulario.empresaId || ""}
                      onChange={(evento) =>
                        mudar("empresaId", evento.target.value || null)
                      }
                    >
                      <option value="">
                        {formulario.status === "DISPONIVEL"
                          ? "Sem vínculo"
                          : "Selecione a empresa"}
                      </option>
                      {catalogo.empresas
                        .filter(
                          (empresa) =>
                            empresa.ativa || empresa.id === formulario.empresaId,
                        )
                        .map((empresa) => (
                          <option key={empresa.id} value={empresa.id}>
                            {empresa.nomeFantasia || empresa.razaoSocial}
                            {!empresa.ativa ? " (inativa)" : ""}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Indicado: encaminhado à empresa. Em processo: aguardando aceitação.
                  Empregado: contratação confirmada. Disponível: sem vínculo.
                </p>
              </div>
            </>
          )}
        </fieldset>
        {erro && (
          <p role="alert" className={`mx-6 mb-4 ${dashboardStyles.error}`}>
            {erro}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            disabled={salvando}
            onClick={onClose}
            className={dashboardStyles.secondaryAction}
          >
            Cancelar
          </button>
          <button
            disabled={carregando || salvando || (!versao && editar)}
            type="submit"
            className={
              excluir
                ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                : dashboardStyles.primaryAction
            }
          >
            {salvando ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : excluir ? (
              "Excluir aluno"
            ) : editar ? (
              "Salvar alterações"
            ) : (
              "Cadastrar aluno"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
