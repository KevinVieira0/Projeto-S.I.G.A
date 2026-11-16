"use client";

import { createContext, useContext, useState } from "react";
import { recortesIniciais } from "@/lib/dashboard/series";

const ContextoRecortes = createContext(null);

export function RecortesDaVisao({ visao, children }) {
  const [recortes, setRecortes] = useState(() => recortesIniciais(visao));

  function selecionar(campo, valor) {
    setRecortes((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <ContextoRecortes.Provider value={{ recortes, selecionar }}>
      {children}
    </ContextoRecortes.Provider>
  );
}

export function useRecortesDaVisao() {
  return useContext(ContextoRecortes);
}

export function useRecorte(campo, inicial) {
  const contexto = useRecortesDaVisao();
  const [local, setLocal] = useState(inicial);
  return contexto
    ? [contexto.recortes[campo], (valor) => contexto.selecionar(campo, valor)]
    : [local, setLocal];
}
