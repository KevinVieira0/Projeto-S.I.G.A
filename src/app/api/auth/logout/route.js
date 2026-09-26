import { NextResponse } from "next/server";
import { validateMutationOrigin } from "@/lib/auth/authorize";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export async function POST(request) {
  const error = validateMutationOrigin(request);
  if (error) return error;
  const response = NextResponse.json({ mensagem: "Sessão encerrada." });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
