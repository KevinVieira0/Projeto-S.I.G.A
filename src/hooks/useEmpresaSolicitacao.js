import { solicitacaoSchema } from "@/lib/validations/solicitacaoSchema";



export function useEmpresaSolicitacao(){


const form = useForm({
    resolver: zodResolver(solicitacaoSchema),
    defaultValues: {idadeMinina: 0, sexo: [], pratica: "", cursos: "", inicio:  },
});

}