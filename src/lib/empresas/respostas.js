import { NextResponse } from "next/server";

export const jsonEmpresa = (dados, status = 200) =>
  NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
export function erroEmpresa(erro) {
  const status = erro.status || (erro instanceof SyntaxError ? 400 : 500);
  return jsonEmpresa(
    {
      mensagem: erro.status
        ? erro.message
        : status === 400
          ? "JSON inválido."
          : "Não foi possível concluir a operação. Tente novamente.",
    },
    status,
  );
}
