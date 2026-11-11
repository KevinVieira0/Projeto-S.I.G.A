"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Mail, Phone } from "lucide-react";
import CompanyDrawer from "@/components/dashboard/CompanyDrawer";
import { apiClient } from "@/lib/api/axiosClient";
import ComprovantesContrato from "@/components/alunos/ComprovantesContrato";
import EnvioContratoEmpresa from "./EnvioContratoEmpresa";
import {
  estilosEmpresa,
  SeloParticipacao,
  rotulosParticipacao,
  dataEmpresa,
  useDadosEmpresa,
  FalhaEmpresa,
} from "./base";

function Contato({ valor, rotulo, Icone }) {
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setErro(false);
    } catch {
      setErro(true);
    }
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
      <p className="mb-1 flex items-center gap-2 text-xs text-slate-500">
        <Icone className="h-3.5 w-3.5" />
        {rotulo}
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="break-all text-sm font-medium text-slate-800">
          {valor || "Não informado"}
        </span>
        {valor && (
          <button
            type="button"
            onClick={copiar}
            aria-label={`Copiar ${rotulo.toLowerCase()}`}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-orange-50 hover:text-orange-700"
          >
            {copiado ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      <span role="status" className="text-xs text-slate-500">
        {erro
          ? "Selecione o contato acima para copiar."
          : copiado
            ? "Copiado."
            : ""}
      </span>
    </div>
  );
}
export default function PainelAlunoEmpresa({ selecao, onClose, onChanged }) {
  const caminho = selecao.participacaoId
    ? `/empresas/solicitacao/${selecao.solicitacaoId}/alunos/${selecao.participacaoId}`
    : `/empresas/aprendizes/${selecao.matriculaId}`;
  const { dados, carregando, erro, recarregar } = useDadosEmpresa(
    caminho,
    false,
  );
  const [acao, setAcao] = useState(null);
  const [confirmado, setConfirmado] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [retorno, setRetorno] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const p = dados?.participacao;
  const aluno = p?.aluno;
  const precisaConfirmar = acao === "ENCERRAR";
  function escolherAcao(valor) {
    setAcao(valor);
    setConfirmado(false);
    setMotivo("");
    setErroAcao("");
    setRetorno("");
  }
  async function atualizar(operacao) {
    if (salvando || !p?.podeAlterar) return;
    setSalvando(true);
    setErroAcao("");
    setRetorno("");
    try {
      const { data } = await apiClient.patch(caminho, {
        acao: operacao,
        versao: p.versao,
        ...(["CONTRATAR", "ENCERRAR"].includes(operacao) ? { confirmado } : {}),
        ...(operacao === "ENCERRAR" ? { motivo } : {}),
      });
      setAcao(null);
      setRetorno(
        data.espelho?.falha
          ? `Atualização salva. ${data.espelho.mensagem}`
          : "Acompanhamento atualizado.",
      );
      recarregar();
      onChanged?.();
      window.dispatchEvent(new Event("empresa:atualizada"));
    } catch (erro) {
      setErroAcao(
        erro.response?.data?.mensagem ||
          "Não foi possível atualizar. Tente novamente.",
      );
      if (erro.response?.status === 409) {
        setAcao(null);
        recarregar();
      }
    } finally {
      setSalvando(false);
    }
  }
  return (
    <CompanyDrawer
      empresaId={selecao.participacaoId || selecao.matriculaId}
      nome={aluno?.nome || selecao.nome}
      titulo={aluno?.nome || selecao.nome || "Detalhes do aluno"}
      subtitulo={aluno && `${aluno.curso} · ${aluno.turma}`}
      categoria="Acompanhamento do aluno"
      variante="laranja"
      rotuloFechar="Fechar detalhes do aluno"
      ocupado={salvando}
      onClose={onClose}
    >
      {() => (
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
          {carregando && !p ? (
            <p role="status" className="flex gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Carregando aluno…
            </p>
          ) : null}
          {erro && <FalhaEmpresa mensagem={erro} tentar={recarregar} />}
          {p && !erro && (
            <>
              <section className="rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-orange-800">
                  Situação neste acompanhamento
                </p>
                <SeloParticipacao status={p.status} />
                {p.status === "APROVADO" && (
                  <p className="mt-3 text-sm text-slate-600">
                    A seleção foi aprovada. Anexe o contrato ou comprovante para
                    concluir a contratação.
                  </p>
                )}
                {p.motivo && (
                  <p className="mt-3 text-sm text-slate-600">{p.motivo}</p>
                )}
              </section>
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Informações acadêmicas
                </h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Curso", aluno.curso],
                    ["Turma", aluno.turma],
                    ["Turno", aluno.turno],
                    ["Termo", aluno.termo],
                  ].map(([rotulo, valor]) => (
                    <div key={rotulo}>
                      <dt className="text-xs text-slate-500">{rotulo}</dt>
                      <dd className="mt-1 font-medium text-slate-800">
                        {valor || "Não informado"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Contato do aluno
                </h3>
                <div className="space-y-2">
                  <Contato
                    rotulo="Celular"
                    valor={aluno.celular || aluno.telefone}
                    Icone={Phone}
                  />
                  <Contato rotulo="E-mail" valor={aluno.email} Icone={Mail} />
                </div>
                {["NAO_CONTRATADO", "DESISTIU", "CANCELADO"].includes(
                  p.status,
                ) && (
                  <p className="mt-2 text-xs text-slate-500">
                    Os contatos ficam disponíveis enquanto o vínculo está ativo.
                  </p>
                )}
              </section>
              <section className="space-y-4 border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Contratos e comprovantes
                </h3>
                <ComprovantesContrato
                  documentos={p.comprovantes}
                  variante="laranja"
                  perfil="empresa"
                />
                {p.podeEnviarContrato && !carregando && (
                  <EnvioContratoEmpresa
                    caminho={caminho}
                    versao={p.versao}
                    contratado={p.status === "CONTRATADO"}
                    onOcupado={setSalvando}
                    onConflito={recarregar}
                    onEnviado={(data) => {
                      setRetorno(
                        data.espelho?.falha
                          ? `Comprovante salvo. ${data.espelho.mensagem}`
                          : p.status === "CONTRATADO"
                            ? "Nova versão do comprovante salva."
                            : "Comprovante salvo. Contratação concluída.",
                      );
                      recarregar();
                      onChanged?.();
                      window.dispatchEvent(new Event("empresa:atualizada"));
                    }}
                  />
                )}
              </section>
              {!p.id && (
                <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                  Este vínculo não possui solicitação associada. Alterações são
                  realizadas pela coordenação.
                </p>
              )}
              {retorno && (
                <p
                  role="status"
                  className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
                >
                  {retorno}
                </p>
              )}
              {erroAcao && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
                >
                  {erroAcao}
                </p>
              )}
              {p.podeAlterar && !carregando && (
                <section className="space-y-3 border-t border-slate-200 pt-5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Atualizar acompanhamento
                  </h3>
                  {!acao && (
                    <div className="flex flex-wrap gap-2">
                      {p.status === "INDICADO" && (
                        <button
                          type="button"
                          disabled={salvando}
                          className={estilosEmpresa.primario}
                          onClick={() => atualizar("INICIAR")}
                        >
                          Iniciar processo
                        </button>
                      )}
                      {p.status === "EM_PROCESSO" && (
                        <button
                          type="button"
                          disabled={salvando}
                          className={estilosEmpresa.secundario}
                          onClick={() => atualizar("APROVAR")}
                        >
                          Aprovar seleção
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={salvando}
                        className={estilosEmpresa.secundario}
                        onClick={() => escolherAcao("ENCERRAR")}
                      >
                        Encerrar participação
                      </button>
                    </div>
                  )}
                  {precisaConfirmar && (
                    <div className="space-y-4 rounded-xl border border-orange-200 bg-white p-4">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Encerrar participação
                      </h4>
                      {acao === "ENCERRAR" && (
                        <label className="block text-xs font-medium text-slate-600">
                          Motivo
                          <select
                            value={motivo}
                            disabled={salvando}
                            onChange={(e) => setMotivo(e.target.value)}
                            className={`mt-1 ${estilosEmpresa.campo}`}
                          >
                            <option value="">Selecione</option>
                            <option value="NAO_SELECIONADO">
                              Aluno não selecionado
                            </option>
                            <option value="DESISTENCIA">
                              Desistência do aluno
                            </option>
                          </select>
                        </label>
                      )}
                      <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                        <input
                          type="checkbox"
                          checked={confirmado}
                          disabled={salvando}
                          onChange={(e) => setConfirmado(e.target.checked)}
                          className="mt-1 h-4 w-4 accent-orange-600"
                        />
                        Confirmo o encerramento desta participação.
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={
                            salvando ||
                            !confirmado ||
                            (acao === "ENCERRAR" && !motivo)
                          }
                          onClick={() => atualizar(acao)}
                          className={estilosEmpresa.primario}
                        >
                          {salvando ? "Salvando…" : "Confirmar"}
                        </button>
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => setAcao(null)}
                          className={estilosEmpresa.secundario}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  {salvando && !acao && (
                    <p role="status" className="text-sm text-slate-500">
                      Salvando atualização…
                    </p>
                  )}
                </section>
              )}
              {p.eventos.length > 0 && (
                <section className="border-t border-slate-200 pt-5">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">
                    Histórico desta solicitação
                  </h3>
                  <ol className="space-y-4 border-l border-orange-200 pl-4">
                    {p.eventos.map((e) => (
                      <li key={e.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-orange-400" />
                        <p className="text-sm font-medium text-slate-800">
                          {e.descricao || rotulosParticipacao[e.novoStatus]}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {dataEmpresa(e.registradoEm, true)} ·{" "}
                          {e.autor === "EMPRESA"
                            ? "Informado pela empresa"
                            : e.autor === "ADMIN"
                              ? "Registrado pela coordenação"
                              : "Conciliado com o histórico"}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </CompanyDrawer>
  );
}
