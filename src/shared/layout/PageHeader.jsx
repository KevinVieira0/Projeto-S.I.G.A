export default function PageHeader({ titulo, descricao, categoria, children }) {
  return (
    <header className="ui-page-header">
      <div className="min-w-0">
        {categoria && <p className="ui-eyebrow">{categoria}</p>}
        <h1 className="ui-page-title">{titulo}</h1>
        {descricao && <p className="ui-page-description">{descricao}</p>}
      </div>
      {children && <div className="min-w-0 max-w-full">{children}</div>}
    </header>
  );
}
