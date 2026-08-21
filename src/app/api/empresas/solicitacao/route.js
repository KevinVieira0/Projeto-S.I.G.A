import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

    const solicitacaoSchema = z.object({
        idadeMinina: z.number().min(0),
        sexo: z.array(z.string()).nonempty(),
        pratica: z.string().min(1),
        cursos: z.string().min(1),
        inicio: z.string().min(1),
        fim: z.string().min(1),
        quantidadeAlunos: z.number().min(1),
        observacao: z.string().optional(),
    });

export async function POST(request) {
    const body = await request.json();
    const resultado = solicitacaoSchema.safeParse(body);

    if (!resultado.success) {
        return NextResponse.json(
            {
                message: "Dados de solicitação inválidos.",
            },
            {
                status: 400,
            }
        );
    }
    const { idadeMinina, sexo, pratica, cursos, inicio, fim, quantidadeAlunos, observacao } = resultado.data;

    try {
        const solicitacao = await prisma.solicitacao.create({
            data: {
                idadeMinina,
                sexo: sexo.join(","),
                pratica,
                cursos,
                inicio,
                fim,
                quantidadeAlunos,
                observacao,
            },
        });

        return NextResponse.json(
            {
                message: "Solicitação criada com sucesso.",
                solicitacao,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error("Erro ao criar solicitação:", error);
        return NextResponse.json(
            {
                message: "Erro ao criar solicitação.",
            },
            {
                status: 500,
            }
        );
    }
}