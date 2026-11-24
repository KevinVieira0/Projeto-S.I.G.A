"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createSolicitacaoSchema } from "@/lib/validations/solicitacaoSchema";
import { createSolicitacao } from "@/lib/api/solicitacaoService";

const FORMULARIO_INICIAL = {
  idadeMinima: "16",
  idadeMaxima: "16",
  sexo: "",
  pratica: "",
  periodoPratica: "",
  cursos: "",
  inicio: "",
  fim: "",
  quantidadeVagas: "1",
  observacoes: "",
};

function primeirasMensagens(erros) {
  return Object.fromEntries(
    Object.entries(erros).map(([campo, mensagens]) => [campo, mensagens[0]]),
  );
}

export function useEmpresaSolicitacao({
  cursos,
  carregandoCursos,
  erroCursos,
}) {
  const { session: sessao, isLoading: carregandoSessao } = useAuth();
  const [formulario, setFormulario] = useState({ ...FORMULARIO_INICIAL });
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState(false);
  const [solicitacaoCriada, setSolicitacaoCriada] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const enviandoRef = useRef(false);
  function alterarCampo(evento) {
    const { name: nomeCampo, value: valor, type: tipo } = evento.target;
    setFormulario((anterior) => {
      const proximo = {
        ...anterior,
        [nomeCampo]: tipo === "number" && valor !== "" ? Number(valor) : valor,
      };
      if (nomeCampo === "pratica" && valor !== "com")
        proximo.periodoPratica = "";
      return proximo;
    });
    setMensagemSucesso(false);
    setErroApi("");
    setErros((anterior) => {
      const proximo = { ...anterior };
      delete proximo[nomeCampo];
      if (["idadeMinima", "idadeMaxima"].includes(nomeCampo)) {
        delete proximo.idadeMinima;
        delete proximo.idadeMaxima;
      }
      if (["inicio", "fim"].includes(nomeCampo)) {
        delete proximo.inicio;
        delete proximo.fim;
      }
      return proximo;
    });
  }
  async function enviarFormulario(evento) {
    evento.preventDefault();
    if (enviandoRef.current || carregandoSessao) return;
    setMensagemSucesso(false);
    setErroApi("");
    if (sessao?.tipo !== "empresa") {
      setSessaoExpirada(true);
      setErroApi("Entre com uma conta de empresa para enviar a solicitação.");
      return;
    }
    if (carregandoCursos || erroCursos || cursos.length === 0) {
      setErros({
        cursos: carregandoCursos
          ? "Aguarde o carregamento dos cursos."
          : "Não há uma lista de cursos disponível. Recarregue a página para tentar novamente.",
      });
      return;
    }
    const resultado = createSolicitacaoSchema(
      cursos.map((curso) => curso.value),
    ).safeParse(formulario);
    if (!resultado.success) {
      const { fieldErrors, formErrors } = resultado.error.flatten();
      console.warn("Validação falhou:", { fieldErrors, formErrors });

      setErros(primeirasMensagens(fieldErrors));

      if (formErrors.length > 0) {
        setErroApi(formErrors[0]);
      } else if (Object.keys(fieldErrors).length === 0) {
        setErroApi("Não foi possível validar o formulário. Revise os campos.");
      }

      const primeiroCampo = Object.keys(fieldErrors)[0];
      if (primeiroCampo) {
        evento.currentTarget.elements.namedItem(primeiroCampo)?.focus();
      }
      return;
    }
    setErros({});
    enviandoRef.current = true;
    setCarregando(true);
    try {
      const resposta = await createSolicitacao(resultado.data);
      setSolicitacaoCriada(resposta.solicitacao);
      window.dispatchEvent(new Event("empresa:atualizada"));
      setFormulario({ ...FORMULARIO_INICIAL });
      setMensagemSucesso(true);
      setSessaoExpirada(false);
    } catch (erroCapturado) {
      const dados = erroCapturado.response?.data;
      setErroApi(
        dados?.message ||
          "Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente.",
      );
      const errosCampos = dados?.errors?.fieldErrors || {};
      setErros(primeirasMensagens(errosCampos));
      setSessaoExpirada([401, 403].includes(erroCapturado.response?.status));
    } finally {
      enviandoRef.current = false;
      setCarregando(false);
    }
  }
  return {
    form: formulario,
    erros,
    apiError: erroApi,
    mensagemSucesso,
    solicitacaoCriada,
    isLoading: carregando,
    carregandoSessao,
    sessaoExpirada,
    handleChange: alterarCampo,
    handleSubmit: enviarFormulario,
  };
}
