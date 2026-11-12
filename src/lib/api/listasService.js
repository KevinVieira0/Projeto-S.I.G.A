import { apiClient } from "@/lib/api/axiosClient";

export async function listarCursos() {
  const { data: dados } = await apiClient.get("/listas/cursos");
  return dados.cursos;
}
