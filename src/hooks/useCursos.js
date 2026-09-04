"use client";

import { useEffect, useState } from "react";
import { listarCursos } from "@/lib/api/listasService";

export function useCursos() {
  const [cursos, setCursos] = useState([]);
  const [carregandoCursos, setCarregandoCursos] =
    useState(true);
  const [erroCursos, setErroCursos] = useState("");

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarCursos() {
      try {
        setErroCursos("");

        const cursosRecebidos = await listarCursos();

        if (componenteAtivo) {
          setCursos(cursosRecebidos);
        }
      } catch {
        if (componenteAtivo) {
          setErroCursos(
            "Não foi possível carregar os cursos."
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoCursos(false);
        }
      }
    }

    carregarCursos();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  return {
    cursos,
    carregandoCursos,
    erroCursos,
  };
}