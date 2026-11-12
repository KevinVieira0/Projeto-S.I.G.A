export default function Pagination({ pagina, total, tamanho = 25, alterar }) {
  const paginas = Math.max(1, Math.ceil(total / tamanho));
  return (
    <footer className="ui-pagination">
      <span>
        {total} {total === 1 ? "registro" : "registros"} · Página {pagina} de{" "}
        {paginas}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="ui-action ui-action-secondary"
          aria-label="Página anterior"
          disabled={pagina <= 1}
          onClick={() => alterar(pagina - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="ui-action ui-action-secondary"
          aria-label="Próxima página"
          disabled={pagina >= paginas}
          onClick={() => alterar(pagina + 1)}
        >
          Próxima
        </button>
      </div>
    </footer>
  );
}
