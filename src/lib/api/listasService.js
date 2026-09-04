import { apiClient } from "./axiosClient";

export async function listarCursos() {
  const { data } = await apiClient.get("/listas/cursos");

  return data.cursos;
}