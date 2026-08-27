import axios from "axios";

/**
 * Instância única do axios, usada por todos os *Service.js.
 *
 * O backend É o próprio Next.js: as chamadas vão para as rotas internas
 * em src/app/api/**, que já falam direto com o banco via Prisma. Por isso
 * o baseURL aponta para "/api" (mesma origem) por padrão.
 *
 * Se um dia isso mudar para um serviço externo, basta definir
 * NEXT_PUBLIC_API_URL no .env.local.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
