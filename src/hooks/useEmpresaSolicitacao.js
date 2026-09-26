"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createSolicitacaoSchema } from "@/lib/validations/solicitacaoSchema";
import { createSolicitacao } from "@/lib/api/solicitacaoService";

const INITIAL = {
  idadeMinima: "", idadeMaxima: "", sexo: "", pratica: "", cursos: "",
  inicio: "", fim: "", quantidadeAlunos: "", observacoes: "",
};

export function useEmpresaSolicitacao({ cursos, carregandoCursos, erroCursos }) {
  const { session, isLoading: carregandoSessao } = useAuth();
  const [form, setForm] = useState({ ...INITIAL });
  const [erros, setErros] = useState({});
  const [apiError, setApiError] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const sending = useRef(false);

  function handleChange(event) {
    const { name, value, type } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" && value !== "" ? Number(value) : value }));
    setMensagemSucesso(false);
    setApiError("");
    setErros((prev) => {
      const next = { ...prev };
      delete next[name];
      if (["idadeMinima", "idadeMaxima"].includes(name)) {
        delete next.idadeMinima;
        delete next.idadeMaxima;
      }
      if (["inicio", "fim"].includes(name)) { delete next.inicio; delete next.fim; }
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending.current || carregandoSessao) return;
    setMensagemSucesso(false);
    setApiError("");
    if (session?.tipo !== "empresa") {
      setSessaoExpirada(true);
      setApiError("Entre com uma conta de empresa para enviar a solicitação.");
      return;
    }
    if (carregandoCursos || erroCursos || cursos.length === 0) {
      setErros({ cursos: carregandoCursos ? "Aguarde o carregamento dos cursos." : "Não há uma lista de cursos disponível. Recarregue a página para tentar novamente." });
      return;
    }
    const result = createSolicitacaoSchema(cursos.map((curso) => curso.value)).safeParse(form);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setErros(Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]])));
      const firstField = Object.keys(errors)[0];
      event.currentTarget.elements.namedItem(firstField)?.focus();
      return;
    }
    setErros({});
    sending.current = true;
    setIsLoading(true);
    try {
      await createSolicitacao(result.data);
      setForm({ ...INITIAL });
      setMensagemSucesso(true);
      setSessaoExpirada(false);
    } catch (error) {
      const data = error.response?.data;
      setApiError(data?.message || "Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente.");
      const errors = data?.errors?.fieldErrors || {};
      setErros(Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]])));
      setSessaoExpirada([401, 403].includes(error.response?.status));
    } finally {
      sending.current = false;
      setIsLoading(false);
    }
  }

  return { form, erros, apiError, mensagemSucesso, isLoading, carregandoSessao, sessaoExpirada, handleChange, handleSubmit };
}
