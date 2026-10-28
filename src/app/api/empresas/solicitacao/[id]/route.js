import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { obterPedidoEmpresa } from "@/lib/solicitacoes/participacoes";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";

export const dynamic = "force-dynamic";
export async function GET(requisicao, { params }) {
  const { error, session } = await authorize(requisicao, "empresa");
  if (error) return error;
  try {
    return jsonEmpresa({
      solicitacao: await obterPedidoEmpresa(
        prisma,
        session.dados.id,
        params.id,
        new URL(requisicao.url).searchParams.get("pagina") || 1,
      ),
    });
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
