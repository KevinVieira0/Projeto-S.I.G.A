export const periodosPanorama = [7, 30, 90];

export function inicioDoPanorama(periodo, agora = new Date()) {
  if (periodo === "todos") return null;
  const inicio = new Date(agora);
  inicio.setDate(inicio.getDate() - periodo);
  return inicio;
}
