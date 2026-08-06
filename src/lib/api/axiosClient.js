import axios from "axios";

/**
 * Instância única do axios, usada por todos os *Service.js.
 * Quando o backend (provavelmente NestJS) estiver no ar, basta
 * apontar NEXT_PUBLIC_API_URL no .env.local.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333",
  headers: {
    "Content-Type": "application/json",
  },
});
