import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorize";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { session, error } = await authorize(request);
    if (error) return error;
    return NextResponse.json({ session }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ mensagem: "Não foi possível verificar a sessão." }, { status: 503 });
  }
}
