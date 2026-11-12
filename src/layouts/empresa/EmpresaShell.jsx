import Image from "next/image";
import LogoutButton from "@/features/autenticacao/components/LogoutButton";
import PageContainer from "@/shared/layout/PageContainer";
import EmpresaNavigation from "./EmpresaNavigation";
export default function EmpresaShell({ aba, alterar, children }) {
  return (
    <div className="empresa-shell">
      <a href="#conteudo-empresa" className="ui-skip-link">
        Ir para o conteúdo
      </a>
      <header className="empresa-topbar">
        <div className="empresa-topbar-inner">
          <div className="flex items-center gap-3">
            <Image
              src="/images/Logo-SENAI.png"
              alt="SENAI"
              width={112}
              height={34}
              className="h-auto w-24 sm:w-28"
            />
            <span className="border-l border-slate-200 pl-3 text-xs font-semibold tracking-widest text-slate-600">
              S.I.G.A.
            </span>
          </div>
          <EmpresaNavigation aba={aba} alterar={alterar} />
          <div className="empresa-logout">
            <LogoutButton variante="laranja" />
          </div>
        </div>
      </header>
      <main id="conteudo-empresa" tabIndex={-1}>
        <PageContainer className="max-w-6xl">{children}</PageContainer>
      </main>
    </div>
  );
}
