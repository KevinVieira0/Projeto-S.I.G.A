"use client";
export default function Tabs({
  itens,
  valor,
  alterar,
  rotulo,
  prefixo,
  className = "",
}) {
  function navegar(evento, indice) {
    const proximo = {
      ArrowRight: (indice + 1) % itens.length,
      ArrowLeft: (indice + itens.length - 1) % itens.length,
      Home: 0,
      End: itens.length - 1,
    }[evento.key];
    if (proximo === undefined) return;
    evento.preventDefault();
    alterar(itens[proximo].id);
    evento.currentTarget.parentElement
      .querySelectorAll('[role="tab"]')
      [proximo]?.focus();
  }
  return (
    <div role="tablist" aria-label={rotulo} className={`ui-tabs ${className}`}>
      {itens.map(({ id, rotulo: texto, icon: Icone }, indice) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`${prefixo}-${id}-tab`}
          aria-controls={`${prefixo}-${id}-panel`}
          aria-selected={valor === id}
          tabIndex={valor === id ? 0 : -1}
          onClick={() => alterar(id)}
          onKeyDown={(evento) => navegar(evento, indice)}
          className="ui-tab"
        >
          {Icone && <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {texto}
        </button>
      ))}
    </div>
  );
}
