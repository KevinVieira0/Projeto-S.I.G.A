"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { apiClient } from "@/lib/api/axiosClient";
import { dashboardStyles } from "./DashboardCard";
import { formatarCnpj } from "./CompanyDetails";

const classeCampo =
  "mt-1 min-h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50";

export default function CompanyEditor({ empresaId, onClose, onSaved }) {
  const tituloId = useId();
  const dialogoRef = useRef(null);
  const montadoRef = useRef(false);
  const [empresa, setEmpresa] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [versao, setVersao] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [conflito, setConflito] = useState(false);
  useEffect(() => {
    const dialogo = dialogoRef.current;
    const focoAnterior = document.activeElement;
    const rolagemAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogo.showModal();
    return () => {
      dialogo.close();
      document.body.style.overflow = rolagemAnterior;
      if (focoAnterior?.isConnected) focoAnterior.focus();
    };
  }, [empresaId]);
  useEffect(() => {
    montadoRef.current = true;
    const controlador = new AbortController();
    setCarregando(true);
    setFormulario(null);
    setErro("");
    setConflito(false);
    apiClient
      .get(`/admin/empresas/${empresaId}`, { signal: controlador.signal })
      .then(({ data }) => {
        if (controlador.signal.aborted) return;
        const cadastro = data.empresa;
        setEmpresa(cadastro);
        setFormulario({
          razaoSocial: cadastro.razaoSocial,
          nomeFantasia: cadastro.nomeFantasia || "",
          email: cadastro.email || "",
          telefone: cadastro.telefone || "",
          ativa: cadastro.ativa,
        });
      })
      .catch((erroCapturado) => {
        if (!controlador.signal.aborted)
          setErro(
            erroCapturado.response?.data?.mensagem ||
              "Não foi possível carregar o cadastro.",
          );
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });
    return () => {
      montadoRef.current = false;
      controlador.abort();
    };
  }, [empresaId, versao]);

  async function salvar(evento) {
    evento.preventDefault();
    if (carregando || salvando || conflito || !empresa) return;
    setSalvando(true);
    setErro("");
    try {
      const { data } = await apiClient.patch(`/admin/empresas/${empresaId}`, {
        ...formulario,
        versao: empresa.versao,
      });
      window.dispatchEvent(new Event("empresas:sincronizadas"));
      if (montadoRef.current)
        onSaved(
          data.espelho?.falha ? data.espelho.mensagem : "Empresa atualizada.",
        );
    } catch (erroCapturado) {
      if (montadoRef.current) {
        setErro(
          erroCapturado.response?.data?.mensagem ||
            "Não foi possível salvar o cadastro.",
        );
        setConflito(erroCapturado.response?.status === 409);
        setSalvando(false);
      }
    }
  }
  function campo(chave, rotulo, atributos = {}) {
    return (
      <label className="block text-xs font-medium text-gray-600">
        {rotulo}
        <input
          className={classeCampo}
          value={formulario[chave]}
          onChange={(evento) =>
            setFormulario((anterior) => ({
              ...anterior,
              [chave]: evento.target.value,
            }))
          }
          maxLength={255}
          {...atributos}
        />
      </label>
    );
  }
  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault();
        if (!salvando) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/40"
    >
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div>
          <h2 id={tituloId} className="text-lg font-semibold text-gray-900">
            Editar empresa
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Atualize os dados da empresa beneficiária.
          </p>
        </div>
        <button
          type="button"
          aria-label="Fechar cadastro da empresa"
          disabled={salvando}
          onClick={onClose}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={salvar}>
        <fieldset
          disabled={carregando || salvando || conflito}
          className="space-y-5 px-6 py-5"
        >
          {carregando ? (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Carregando cadastro…
            </p>
          ) : (
            formulario && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {campo("razaoSocial", "Razão social", {
                    required: true,
                    minLength: 2,
                  })}
                  {campo("nomeFantasia", "Nome fantasia")}
                  {campo("email", "E-mail", { type: "email" })}
                  {campo("telefone", "Telefone com DDD", {
                    type: "tel",
                    maxLength: 20,
                  })}
                  <div>
                    <p className="text-xs font-medium text-gray-600">CNPJ</p>
                    <p
                      className={`${classeCampo} flex items-center bg-gray-50`}
                    >
                      {formatarCnpj(empresa.cnpj)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      O CNPJ identifica o cadastro e permanece o mesmo.
                    </p>
                  </div>
                  <label className="text-xs font-medium text-gray-600">
                    Situação cadastral
                    <select
                      className={classeCampo}
                      value={formulario.ativa ? "ativa" : "inativa"}
                      onChange={(evento) =>
                        setFormulario((anterior) => ({
                          ...anterior,
                          ativa: evento.target.value === "ativa",
                        }))
                      }
                    >
                      <option value="ativa">Ativa</option>
                      <option value="inativa">Inativa</option>
                    </select>
                  </label>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <p className="text-xs leading-5 text-gray-500">
                    Inativar bloqueia o acesso da empresa ao sistema e novos
                    vínculos de alunos. Os vínculos existentes e as solicitações
                    são preservados. Ativar mantém as permissões de acesso já
                    cadastradas.
                  </p>
                </div>
              </>
            )
          )}
        </fieldset>
        {erro && (
          <p role="alert" className={`mx-6 mb-4 ${dashboardStyles.error}`}>
            {erro}
          </p>
        )}
        {(conflito || (!carregando && !formulario)) && (
          <div className="mx-6 mb-4">
            <button
              type="button"
              className={dashboardStyles.secondaryAction}
              disabled={carregando || salvando}
              onClick={() => setVersao((valor) => valor + 1)}
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar cadastro
            </button>
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            className={dashboardStyles.secondaryAction}
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={dashboardStyles.primaryAction}
            disabled={carregando || salvando || conflito || !formulario}
          >
            {salvando ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none" />
                Salvando…
              </>
            ) : (
              "Salvar alterações"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
