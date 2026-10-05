import { apiClient } from "./axiosClient";

export async function listarCursos() {
  const { data: dados } = await apiClient.get("/listas/cursos");
  return dados.cursos;
}
