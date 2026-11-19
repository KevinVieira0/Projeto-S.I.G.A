"use client";

import { useId, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { apiClient } from "@/lib/api/axiosClient";
import { estilosEmpresa } from "./base";

export default function EnvioContratoEmpresa({
  caminho,
  versao,
  contratado,
  onOcupado,
  onEnviado,
  onConflito,
}) {
  const [arquivo, setArquivo] = useState(null);
  const [confirmado, setConfirmado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const envioRef = useRef(null);
  const entradaRef = useRef(null);
  const enviandoRef = useRef(false);
  const campoId = useId();
  function selecionar(evento) {
    const proximo = evento.target.files?.[0] || null;
    setConfirmado(false);
    setErro("");
    if (proximo && (proximo.size === 0 || proximo.size > 5 * 1024 * 1024)) {
      setErro("Selecione um arquivo de até 5 MB.");
      setArquivo(null);
      evento.target.value = "";
      return;
    }
    setArquivo(proximo);
    envioRef.current = proximo ? crypto.randomUUID() : null;
  }
  async function enviar(evento) {
    evento.preventDefault();
    if (!arquivo || !confirmado || enviandoRef.current) return;
    enviandoRef.current = true;
    setSalvando(true);
    onOcupado(true);
    setErro("");
    const formulario = new FormData();
    formulario.append("arquivo", arquivo);
    formulario.append("versao", versao);
    formulario.append("envioId", envioRef.current);
    formulario.append("confirmado", "true");
    try {
      const { data } = await apiClient.post(`${caminho}/contrato`, formulario, {
        headers: { "Content-Type": undefined },
      });
      setArquivo(null);
      setConfirmado(false);
      entradaRef.current.value = "";
      onEnviado(data);
    } catch (falha) {
      setErro(
        falha.response?.data?.mensagem ||
          "Não foi possível enviar. Tente novamente com o mesmo arquivo.",
      );
      if (falha.response?.status === 409) onConflito();
    } finally {
      enviandoRef.current = false;
      setSalvando(false);
      onOcupado(false);
    }
  }
  return (
    <form
      onSubmit={enviar}
      className="space-y-4 rounded-xl border border-orange-200 bg-white/80 p-4"
    >
      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          {contratado
            ? "Substituir comprovante"
            : "Anexar contrato e concluir contratação"}
        </h4>
        <p
          id={`${campoId}-ajuda`}
          className="mt-2 text-xs leading-5 text-slate-600"
        >
          {contratado
            ? "Envie o arquivo corrigido. A versão anterior continuará no histórico."
            : "Ao enviar, o aluno será marcado como empregado e o comprovante ficará disponível para o SENAI."}{" "}
          PDF, JPG ou PNG de até 5 MB.
        </p>
      </div>
      <label
        htmlFor={campoId}
        className="block text-xs font-medium text-slate-700"
      >
        Contrato ou comprovante
      </label>
      <input
        ref={entradaRef}
        id={campoId}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={selecionar}
        disabled={salvando}
        aria-describedby={`${campoId}-ajuda`}
        className="block w-full min-w-0 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2.5 file:font-medium file:text-orange-800"
      />
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => setConfirmado(e.target.checked)}
          disabled={salvando}
          className="mt-1 h-4 w-4 shrink-0 accent-orange-600"
        />
        Declaro que o arquivo comprova a contratação deste aluno pela empresa.
      </label>
      {erro && (
        <p role="alert" className="text-sm text-red-700">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={!arquivo || !confirmado || salvando}
        className={estilosEmpresa.primario}
      >
        <Upload className="h-4 w-4" />
        {salvando
          ? "Enviando…"
          : contratado
            ? "Enviar nova versão"
            : "Enviar e concluir contratação"}
      </button>
    </form>
  );
}
