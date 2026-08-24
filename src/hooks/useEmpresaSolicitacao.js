"Use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { solicitacaoSchema } from "@/lib/validations/solicitacaoSchema";
import { createSolicitacao } from "@/lib/api/solicitacaoService"



export function useEmpresaSolicitacao(){
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  const form = useForm({
    resolver: zodResolver(solicitacaoSchema),
    defaultValues: {
            idadeMinima: 0,
            sexo: "",
            pratica: "",
            cursos: "",
            inicio:"",
            fim:"",
            quantidadeAlunos: 0,
            observacoes:""
            },
    });


    const onSubmit = form.handleSubmit(async (values) => { 
        setApiError(null);
        setIsLoading(true);
        try {
            const data = await createSolicitacao(values);
            console.log("Solicitação criada com sucesso", data);
            form.reset();
        }catch (err) {
            setApiError("Erro ao criar solicitação.");
        } finally {
            setIsLoading(false);
       }
    }); 
    return { ...form, onSubmit, apiError, isLoading };
}