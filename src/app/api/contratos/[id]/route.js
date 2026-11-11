import { authorize } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { conferirUuid } from "@/lib/solicitacoes/participacoes";
import { jsonEmpresa, erroEmpresa } from "@/lib/empresas/respostas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(requisicao, { params }) {
  const perfil = new URL(requisicao.url).searchParams.get("perfil");
  if (perfil && !["admin", "empresa"].includes(perfil))
    return jsonEmpresa({ mensagem: "Perfil inválido." }, 400);
  const { error, session } = await authorize(requisicao, perfil || undefined);
  if (error) return error;
  try {
    conferirUuid(params.id);
    const documento = await prisma.comprovanteContrato.findFirst({
      where: {
        id: params.id,
        ...(session.tipo === "empresa" ? { empresaId: session.dados.id } : {}),
      },
      select: { conteudo: true, nome: true, tipo: true, tamanho: true },
    });
    if (!documento)
      return jsonEmpresa({ mensagem: "Comprovante não encontrado." }, 404);
    return new Response(documento.conteudo, {
      headers: {
        "Content-Type": documento.tipo,
        "Content-Length": String(documento.tamanho),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(documento.nome).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16))}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "sandbox; default-src 'none'; frame-ancestors 'self'",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (erro) {
    return erroEmpresa(erro);
  }
}
