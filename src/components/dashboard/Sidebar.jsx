"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftToLine,
  ArrowRightFromLine,
  Building2,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import LogoutButton from "@/components/login/LogoutButton";
import logoSenai from "../../../public/images/Logo-SENAI.png";
import estilos from "./Sidebar.module.css";

const GRUPOS = [
  {
    titulo: "Painel",
    itens: [
      {
        rotulo: "Visão Geral",
        href: ROUTES.ADMIN_DASHBOARD,
        Icone: LayoutDashboard,
        termos: "dashboard indicadores gráficos",
      },
      {
        rotulo: "Solicitações",
        href: "/admin/solicitacoes",
        Icone: ClipboardList,
        termos: "pedidos indicações vagas histórico",
      },
    ],
  },
  {
    titulo: "Gestão",
    itens: [
      {
        rotulo: "Alunos",
        href: "/admin/alunos",
        Icone: GraduationCap,
        termos: "aprendizes turmas cursos cpf",
      },
      {
        rotulo: "Empresas",
        href: "/admin/empresas",
        Icone: Building2,
        termos: "parceiros cnpj cadastros",
      },
    ],
  },
];
const CHAVE_ARMAZENAMENTO = "siga:sidebar-collapsed";
const CONSULTA_MOVEL = "(max-width: 639px)";
const CONSULTA_COMPACTA = "(max-width: 1023px)";
const GRADIENTES_AVATAR = [
  "from-blue-900 to-blue-600",
  "from-indigo-900 to-indigo-500",
  "from-sky-800 to-cyan-500",
  "from-blue-950 to-sky-600",
  "from-violet-900 to-blue-500",
];

// Os canais vermelho e verde deslocam a imagem para dentro nas bordas da lente.
const MAPA_REFRACAO =
  "data:image/svg+xml," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
    <defs>
      <linearGradient id="x">
        <stop stop-color="#ed0000"/><stop offset=".13" stop-color="#800000"/>
        <stop offset=".87" stop-color="#800000"/><stop offset="1" stop-color="#130000"/>
      </linearGradient>
      <linearGradient id="y" x2="0%" y2="100%">
        <stop stop-color="#00ed00"/><stop offset=".13" stop-color="#008000"/>
        <stop offset=".87" stop-color="#008000"/><stop offset="1" stop-color="#001300"/>
      </linearGradient>
    </defs>
    <rect width="96" height="96" fill="url(#x)"/>
    <rect width="96" height="96" fill="url(#y)" style="mix-blend-mode:screen"/>
  </svg>
`);

function lerEstadoDoMenu() {
  if (typeof window === "undefined") return { movel: false, recolhida: false };
  const movel = window.matchMedia(CONSULTA_MOVEL).matches;
  if (movel) return { movel, recolhida: true };

  try {
    const salvo = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (salvo !== null) return { movel, recolhida: salvo === "true" };
  } catch {}
  return { movel, recolhida: window.matchMedia(CONSULTA_COMPACTA).matches };
}

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterIniciais(nome) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes.at(-1)[0]).toUpperCase();
}

function obterGradiente(nome) {
  let hash = 0;
  for (const caractere of nome)
    hash = (hash * 31 + caractere.charCodeAt(0)) % 997;
  return GRADIENTES_AVATAR[hash % GRADIENTES_AVATAR.length];
}

function obterSaudacao() {
  const hora = new Date().getHours();
  if (hora < 5) return "Boa madrugada";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Sidebar() {
  const caminhoAtual = usePathname();
  const { session: sessao } = useAuth();
  const nome = sessao?.dados?.nome || "Administrador";
  const email = sessao?.dados?.email || "";
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const iniciais = obterIniciais(nome);
  const gradiente = obterGradiente(nome);
  const idNavegacao = useId();
  const idConta = useId();
  const idLente = "siga-lente-" + idNavegacao.replace(/[^a-zA-Z0-9_-]/g, "");
  const [{ movel, recolhida }, setEstado] = useState(lerEstadoDoMenu);
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [saudacao, setSaudacao] = useState("Olá");
  const [dica, setDica] = useState(null);
  const barraRef = useRef(null);
  const listaRef = useRef(null);
  const marcadorRef = useRef(null);
  const alternadorRef = useRef(null);
  const campoBuscaRef = useRef(null);
  const areaBuscaRef = useRef(null);
  const contaRef = useRef(null);
  const botaoContaRef = useRef(null);
  const consulta = recolhida ? "" : normalizar(busca.trim());
  const gruposVisiveis = GRUPOS.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter(({ rotulo, termos }) =>
      normalizar([rotulo, termos].join(" ")).includes(consulta),
    ),
  })).filter(({ itens }) => itens.length > 0);

  useEffect(() => {
    const consultas = [CONSULTA_MOVEL, CONSULTA_COMPACTA].map((regra) =>
      window.matchMedia(regra),
    );
    const adaptar = () => {
      setEstado(lerEstadoDoMenu());
      setBusca("");
      setMenuAberto(false);
      setDica(null);
    };
    consultas.forEach((media) => media.addEventListener("change", adaptar));
    return () =>
      consultas.forEach((media) =>
        media.removeEventListener("change", adaptar),
      );
  }, []);

  useEffect(() => {
    setSaudacao(obterSaudacao());
    const id = setInterval(() => setSaudacao(obterSaudacao()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const barra = barraRef.current;
    const reduzir = window.matchMedia(
      "(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)",
    );
    let quadro = 0;

    function moverReflexo({ clientX, clientY, pointerType }) {
      if (reduzir.matches || pointerType === "touch") return;
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        const { left, top } = barra.getBoundingClientRect();
        barra.style.setProperty(
          "--reflexo-x",
          Math.round(clientX - left) + "px",
        );
        barra.style.setProperty(
          "--reflexo-y",
          Math.round(clientY - top) + "px",
        );
      });
    }

    barra.addEventListener("pointermove", moverReflexo, { passive: true });
    return () => {
      cancelAnimationFrame(quadro);
      barra.removeEventListener("pointermove", moverReflexo);
    };
  }, []);

  useEffect(() => {
    const lista = listaRef.current;
    const marcador = marcadorRef.current;
    function posicionarMarcador() {
      const ativo = lista.querySelector('a[aria-current="page"]');
      lista.dataset.marcador = String(Boolean(ativo));
      if (!ativo) return;
      const deslocamento =
        ativo.getBoundingClientRect().top - lista.getBoundingClientRect().top;
      marcador.style.setProperty(
        "--posicao-marcador",
        Math.round(deslocamento) + "px",
      );
      marcador.style.blockSize = ativo.offsetHeight + "px";
    }
    posicionarMarcador();
    const observador = new ResizeObserver(posicionarMarcador);
    observador.observe(lista);
    return () => observador.disconnect();
  }, [caminhoAtual, consulta]);

  const alternar = useCallback(() => {
    if (!recolhida && areaBuscaRef.current?.contains(document.activeElement)) {
      alternadorRef.current?.focus();
    }
    setEstado({ movel, recolhida: !recolhida });
    setBusca("");
    setMenuAberto(false);
    setDica(null);
    if (!movel) {
      try {
        localStorage.setItem(CHAVE_ARMAZENAMENTO, String(!recolhida));
      } catch {}
    }
  }, [movel, recolhida]);

  useEffect(() => {
    function tratarAtalho(evento) {
      if (evento.defaultPrevented) return;
      if (
        (evento.ctrlKey || evento.metaKey) &&
        evento.key.toLowerCase() === "b"
      ) {
        evento.preventDefault();
        alternar();
      } else if (evento.key === "Escape") {
        if (menuAberto) {
          setMenuAberto(false);
          botaoContaRef.current?.focus();
        } else if (movel && !recolhida) {
          alternar();
          alternadorRef.current?.focus();
        }
      }
    }

    window.addEventListener("keydown", tratarAtalho);
    return () => window.removeEventListener("keydown", tratarAtalho);
  }, [alternar, menuAberto, movel, recolhida]);

  useEffect(() => {
    if (!menuAberto) return;
    function fecharPorFora(evento) {
      if (!contaRef.current?.contains(evento.target)) setMenuAberto(false);
    }
    document.addEventListener("pointerdown", fecharPorFora);
    return () => document.removeEventListener("pointerdown", fecharPorFora);
  }, [menuAberto]);

  function limparBusca() {
    setBusca("");
    campoBuscaRef.current?.focus();
  }

  function aoNavegar(evento) {
    if (
      evento.defaultPrevented ||
      evento.button !== 0 ||
      evento.ctrlKey ||
      evento.metaKey ||
      evento.altKey ||
      evento.shiftKey
    )
      return;
    setBusca("");
    setMenuAberto(false);
    setDica(null);
    if (movel) setEstado({ movel, recolhida: true });
  }

  function mostrarDica(elemento, rotulo) {
    if (!recolhida || menuAberto) return;
    const caixa = elemento.getBoundingClientRect();
    setDica({
      rotulo,
      centro:
        caixa.top +
        caixa.height / 2 -
        barraRef.current.getBoundingClientRect().top,
    });
  }

  return (
    <>
      {movel && !recolhida && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Fechar menu lateral"
          className={estilos.fundo}
          onClick={() => {
            alternar();
            alternadorRef.current?.focus();
          }}
        />
      )}
      <aside
        ref={barraRef}
        aria-label="Menu lateral"
        data-recolhida={recolhida}
        className={estilos.barra}
        style={{ "--filtro-borda": `url("#${idLente}")` }}
      >
        <svg
          className={estilos.definicoesVidro}
          width="0"
          height="0"
          aria-hidden="true"
        >
          <defs>
            <filter
              id={idLente}
              x="0"
              y="0"
              width="100%"
              height="100%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={MAPA_REFRACAO}
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="mapa"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="mapa"
                scale="19"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
        <span className={estilos.bordaVidro} aria-hidden="true" />
        <span className={estilos.reflexoMovel} aria-hidden="true">
          <span key={String(recolhida)} className={estilos.passagemDeLuz} />
        </span>
        <header className={estilos.topo}>
          <div className={estilos.marca}>
            <span className={estilos.simbolo}>
              <Image
                src={logoSenai}
                alt="SENAI"
                width={35}
                height={11}
                priority
              />
            </span>
            <div className={estilos.textoMarca} aria-hidden={recolhida}>
              <strong>S.I.G.A.</strong>
              <small>Gestão de aprendizes</small>
            </div>
          </div>
          <button
            ref={alternadorRef}
            type="button"
            className={estilos.alternador}
            aria-label={
              recolhida ? "Expandir menu lateral" : "Recolher menu lateral"
            }
            aria-controls={idNavegacao}
            aria-expanded={!recolhida}
            title={recolhida ? "Expandir (Ctrl+B)" : "Recolher (Ctrl+B)"}
            onClick={alternar}
          >
            {recolhida ? (
              <ArrowRightFromLine size={17} aria-hidden="true" />
            ) : (
              <ArrowLeftToLine size={17} aria-hidden="true" />
            )}
          </button>
        </header>

        <div
          ref={areaBuscaRef}
          aria-hidden={recolhida}
          className={estilos.areaBusca}
        >
          <div className={estilos.recorteBusca}>
            <div className={estilos.busca}>
              <Search size={16} aria-hidden="true" />
              <input
                ref={campoBuscaRef}
                type="search"
                aria-label="Buscar página"
                aria-controls={idNavegacao}
                placeholder="Buscar página"
                disabled={recolhida}
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === "Escape" && busca) {
                    evento.preventDefault();
                    evento.stopPropagation();
                    limparBusca();
                  }
                }}
              />
              {busca && (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={limparBusca}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        <nav
          id={idNavegacao}
          className={estilos.navegacao}
          aria-label="Navegação do painel"
          onScroll={() => setDica(null)}
        >
          <div className={estilos.lista} ref={listaRef}>
            <div
              className={estilos.marcador}
              ref={marcadorRef}
              aria-hidden="true"
            />
            {gruposVisiveis.map(({ titulo, itens }) => (
              <section key={titulo} className={estilos.grupo}>
                <h2 className={estilos.tituloGrupo} aria-hidden={recolhida}>
                  {titulo}
                </h2>
                <ul aria-label={titulo} className={estilos.itens}>
                  {itens.map(({ rotulo, href, Icone }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className={estilos.link}
                        aria-label={rotulo}
                        aria-current={
                          caminhoAtual === href ||
                          caminhoAtual?.startsWith(href + "/")
                            ? "page"
                            : undefined
                        }
                        onClick={aoNavegar}
                        onPointerEnter={(evento) => {
                          if (evento.pointerType === "mouse")
                            mostrarDica(evento.currentTarget, rotulo);
                        }}
                        onPointerLeave={() => setDica(null)}
                        onFocus={(evento) => {
                          if (evento.currentTarget.matches(":focus-visible"))
                            mostrarDica(evento.currentTarget, rotulo);
                        }}
                        onBlur={() => setDica(null)}
                      >
                        <Icone size={18} aria-hidden="true" />
                        <span className={estilos.rotuloLink} aria-hidden="true">
                          {rotulo}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {!gruposVisiveis.length && (
              <p role="status" className={estilos.semResultados}>
                Nenhuma página encontrada.
              </p>
            )}
          </div>
        </nav>

        {dica && recolhida && !menuAberto && (
          <span
            className={estilos.dica}
            aria-hidden="true"
            style={{ top: dica.centro }}
          >
            {dica.rotulo}
          </span>
        )}

        <footer ref={contaRef} className={estilos.rodape}>
          <button
            ref={botaoContaRef}
            type="button"
            className={estilos.botaoConta}
            aria-controls={idConta}
            aria-expanded={menuAberto}
            aria-label={["Menu do usuário", nome].join(" ")}
            onClick={() => {
              setDica(null);
              setMenuAberto((aberto) => !aberto);
            }}
          >
            <span className={estilos.iconeConta}>
              <span
                className={[
                  estilos.avatar,
                  "bg-gradient-to-br",
                  gradiente,
                ].join(" ")}
                aria-hidden="true"
              >
                {iniciais}
              </span>
              <span className={estilos.indicadorSessao} aria-hidden="true" />
            </span>
            <span className={estilos.textoConta} aria-hidden={recolhida}>
              <small>{saudacao},</small>
              <strong>{primeiroNome}</strong>
            </span>
            <ChevronDown
              className={estilos.setaConta + " siga-seta-expansao"}
              aria-hidden="true"
            />
          </button>

          {menuAberto && (
            <section
              id={idConta}
              aria-label="Conta do administrador"
              className={estilos.cartaoConta}
            >
              <p className="break-words text-sm font-semibold text-slate-900">
                {nome}
              </p>
              {email && (
                <p className="mt-1 break-words text-xs text-slate-600">
                  {email}
                </p>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-900">
                <ShieldCheck size={15} aria-hidden="true" />
                Administrador
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-600"
                  aria-hidden="true"
                />
                Sessão ativa
              </p>
              <div className="mt-3 border-t border-slate-200 pt-3">
                <LogoutButton />
              </div>
            </section>
          )}
        </footer>
      </aside>
    </>
  );
}
