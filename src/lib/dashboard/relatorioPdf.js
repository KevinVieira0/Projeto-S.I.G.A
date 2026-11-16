import { jsPDF } from "jspdf";
import {
  formatarDataCivil,
  formatarDataCriacao,
  formatarDataHora,
} from "./solicitacoesResumo";
import { seriesDaVisao } from "./series";

const cor = {
  azul: "#0a3d7c",
  texto: "#172d49",
  secundario: "#4d607a",
  borda: "#cad7e7",
  faixa: "#f1f5fa",
  branco: "#ffffff",
  ambar: "#a65216",
};
const margem = 16;
const larguraUtil = 178;
const limitePagina = 274;
const numero = (valor) => valor.toLocaleString("pt-BR");

function texto(valor) {
  return (
    String(valor ?? "-")
      .normalize("NFC")
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "-"
  );
}

export function gerarRelatorioPdf(dados) {
  const documento = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  });
  const alunos = dados.visao === "alunos";
  const titulo = alunos ? "Relatório de alunos" : "Relatório de empresas";
  const geradoEm = formatarDataHora(dados.geradoEm);
  const configuracao = seriesDaVisao[dados.visao];
  let y;
  documento.setProperties({
    title: `S.I.G.A. | ${titulo}`,
    author: "S.I.G.A.",
    subject: "Visão Geral",
  });
  documento.setCreationDate(dados.geradoEm);
  documento.setLineHeightFactor(1.24);

  function fonte(tamanho, peso = "normal", preenchimento = cor.texto) {
    documento.setFont("helvetica", peso);
    documento.setFontSize(tamanho);
    documento.setTextColor(preenchimento);
  }

  function linha(x1, y1, x2, y2, preenchimento = cor.borda, espessura = 0.2) {
    documento.setDrawColor(preenchimento);
    documento.setLineWidth(espessura);
    documento.line(x1, y1, x2, y2);
  }

  function cabecalho(primeiraPagina) {
    documento.setFillColor(cor.azul);
    documento.rect(0, 0, 210, 5, "F");
    fonte(13, "bold", cor.azul);
    documento.text("S.I.G.A.", margem, 17);
    fonte(8.5, "normal", cor.secundario);
    documento.text(
      "Sistema de Indicação e Gerenciamento do Aprendiz",
      margem,
      22,
    );
    documento.text(`Gerado em ${geradoEm}`, 194, 17, { align: "right" });
    fonte(primeiraPagina ? 23 : 13, "bold");
    documento.text(titulo, margem, primeiraPagina ? 34 : 30);
    linha(margem, primeiraPagina ? 40 : 34, 194, primeiraPagina ? 40 : 34);
    y = primeiraPagina ? 47 : 41;
  }

  function reservar(altura) {
    if (y + altura <= limitePagina) return false;
    documento.addPage();
    cabecalho(false);
    return true;
  }

  function paragrafo(conteudo) {
    fonte(9, "normal", cor.secundario);
    const linhas = documento.splitTextToSize(texto(conteudo), larguraUtil);
    documento.text(linhas, margem, y);
    y += linhas.length * 4.1 + 1;
  }

  function tituloDaSecao(titulo) {
    fonte(12.5, "bold");
    documento.text(texto(titulo), margem, y);
    y += 6;
  }

  function desenharResumo() {
    reservar(39);
    tituloDaSecao("Principais indicadores");
    const largura = (larguraUtil - 8) / 3;
    for (const [indice, indicador] of dados.resumo.entries()) {
      const x = margem + indice * (largura + 4);
      documento.setFillColor(cor.faixa);
      documento.setDrawColor(cor.borda);
      documento.setLineWidth(0.22);
      documento.roundedRect(x, y, largura, 29, 1.6, 1.6, "FD");
      linha(
        x + 1.7,
        y + 0.2,
        x + largura - 1.7,
        y + 0.2,
        indice === 0 ? cor.ambar : cor.azul,
        0.6,
      );
      fonte(9, "bold");
      documento.text(
        documento.splitTextToSize(texto(indicador.titulo), largura - 6),
        x + 3,
        y + 5,
      );
      fonte(18, "bold", cor.azul);
      documento.text(numero(indicador.valor), x + 3, y + 18);
      fonte(8, "normal", cor.secundario);
      documento.text(
        documento.splitTextToSize(
          texto(indicador.detalhe || indicador.descricao),
          largura - 6,
        ),
        x + 3,
        y + 23,
      );
    }
    y += 38;
  }

  function desenharGraficoDeLinhas() {
    reservar(74);
    tituloDaSecao(configuracao.titulo);
    paragrafo(configuracao.explicacao);
    const maximo = Math.max(
      0,
      ...dados.pontos.flatMap((ponto) =>
        configuracao.series.map(({ chave }) => ponto[chave]),
      ),
    );
    if (!maximo) {
      paragrafo(
        "Nenhuma movimentação registrada neste período para os filtros selecionados.",
      );
      y += 3;
      return;
    }
    const passo = Math.max(1, Math.ceil(maximo / 4));
    const xInicial = margem + 11;
    const xFinal = margem + larguraUtil;
    const larguraGrafico = xFinal - xInicial;
    const altura = 33;
    const topo = y + 1;
    const xDoPonto = (indice) =>
      xInicial + ((indice + 0.5) * larguraGrafico) / dados.pontos.length;
    const yDoPonto = (valor) => topo + (1 - valor / (4 * passo)) * altura;
    fonte(8, "normal", cor.secundario);
    for (const nivel of [0, 1, 2, 3, 4]) {
      const posicao = yDoPonto(nivel * passo);
      linha(xInicial, posicao, xFinal, posicao);
      documento.text(numero(nivel * passo), xInicial - 2, posicao + 1, {
        align: "right",
      });
    }
    dados.pontos.forEach(({ rotulo }, indice) => {
      documento.text(texto(rotulo), xDoPonto(indice), topo + altura + 4.4, {
        align: "center",
      });
    });
    const alturaLegenda = topo + altura + 11;
    configuracao.series.forEach(
      ({ chave, cor: preenchimento, rotulo }, serie) => {
        const xLegenda = margem + serie * 88;
        if (serie) documento.setLineDashPattern([1.4, 0.9], 0);
        dados.pontos.slice(1).forEach((ponto, indice) => {
          linha(
            xDoPonto(indice),
            yDoPonto(dados.pontos[indice][chave]),
            xDoPonto(indice + 1),
            yDoPonto(ponto[chave]),
            preenchimento,
            0.56,
          );
        });
        linha(
          xLegenda,
          alturaLegenda - 0.8,
          xLegenda + 6,
          alturaLegenda - 0.8,
          preenchimento,
          0.6,
        );
        documento.setLineDashPattern([], 0);
        documento.setFillColor(preenchimento);
        dados.pontos.forEach((ponto, indice) => {
          documento.circle(xDoPonto(indice), yDoPonto(ponto[chave]), 0.85, "F");
        });
        fonte(8.5, "normal", cor.secundario);
        documento.text(rotulo, xLegenda + 8, alturaLegenda);
      },
    );
    y = alturaLegenda + 9;
  }

  function desenharGraficoHorizontal(titulo, explicacao, itens) {
    fonte(9, "bold");
    const rotulos = itens.map(({ rotulo }) =>
      documento.splitTextToSize(texto(rotulo), 140),
    );
    fonte(8, "normal");
    const observacoes = itens.map(({ detalhe }) =>
      detalhe ? documento.splitTextToSize(texto(detalhe), larguraUtil) : [],
    );
    const alturaItens = rotulos.reduce(
      (total, rotulo, i) =>
        total + rotulo.length * 4 + observacoes[i].length * 3.8 + 7,
      0,
    );
    reservar(21 + alturaItens);
    tituloDaSecao(titulo);
    paragrafo(explicacao);
    if (!itens.some(({ valor }) => valor > 0)) {
      paragrafo("Nenhum registro neste recorte.");
      y += 4;
      return;
    }
    const maximo = Math.max(...itens.map(({ valor }) => valor));
    for (const [indice, { valor }] of itens.entries()) {
      fonte(9, "bold");
      documento.text(rotulos[indice], margem, y);
      documento.text(numero(valor), 194, y, { align: "right" });
      y += rotulos[indice].length * 4;
      documento.setFillColor(cor.faixa);
      documento.roundedRect(margem, y, larguraUtil, 2.1, 0.7, 0.7, "F");
      if (valor > 0) {
        documento.setFillColor(cor.azul);
        documento.rect(margem, y, (valor / maximo) * larguraUtil, 2.1, "F");
      }
      y += 6;
      if (observacoes[indice].length) {
        fonte(8, "normal", cor.secundario);
        documento.text(observacoes[indice], margem, y);
        y += observacoes[indice].length * 3.8;
      }
    }
    y += 4;
  }

  function desenharTabela({ titulo, colunas, linhas, manterJunta = false }) {
    const larguras = colunas.map(({ largura }) => largura * larguraUtil);
    const prepararLinha = (valores) => {
      fonte(8.5);
      const celulas = valores.map((valor, i) =>
        documento.splitTextToSize(texto(valor), larguras[i] - 5),
      );
      return {
        celulas,
        altura: 4 + Math.max(...celulas.map((linhas) => linhas.length)) * 3.75,
      };
    };
    function abrirTabela(continuacao = false) {
      tituloDaSecao(continuacao ? `${titulo} - continuação` : titulo);
      documento.setFillColor(cor.azul);
      documento.rect(margem, y, larguraUtil, 7.2, "F");
      let x = margem;
      fonte(8.5, "bold", cor.branco);
      colunas.forEach(({ rotulo }, indice) => {
        documento.text(texto(rotulo), x + 2.5, y + 4.6);
        x += larguras[indice];
      });
      y += 7.2;
    }
    if (linhas.length === 0) {
      reservar(17);
      tituloDaSecao(titulo);
      paragrafo("Nenhum cadastro corresponde aos filtros selecionados.");
      return;
    }
    const alturaInicial = manterJunta
      ? linhas.reduce((total, linha) => total + prepararLinha(linha).altura, 0)
      : prepararLinha(linhas[0]).altura;
    reservar(16 + alturaInicial);
    abrirTabela();
    for (const [indice, valores] of linhas.entries()) {
      const { celulas, altura } = prepararLinha(valores);
      if (y + altura > limitePagina) {
        reservar(altura);
        abrirTabela(true);
      }
      documento.setFillColor(indice % 2 ? cor.branco : cor.faixa);
      documento.rect(margem, y, larguraUtil, altura, "F");
      fonte(8.5);
      let x = margem;
      celulas.forEach((linhas, coluna) => {
        documento.text(linhas, x + 2.5, y + 4.5);
        x += larguras[coluna];
      });
      y += altura;
    }
    linha(margem, y, 194, y);
    y += 9;
  }

  cabecalho(true);
  tituloDaSecao("Períodos e filtros");
  const primeiro = dados.pontos[0];
  const ultimo = dados.pontos.at(-1);
  const intervalo = alunos
    ? `${formatarDataCivil(primeiro.chave)} a ${formatarDataCriacao(dados.geradoEm)}`
    : `${primeiro.rotuloCompleto} a ${ultimo.rotuloCompleto}`;
  paragrafo(
    `Série principal: ${dados.recortes.serie} ${configuracao.unidade.toLowerCase()} (${intervalo}).`,
  );
  paragrafo(
    dados.recortes.panorama === "todos"
      ? "Panorama: todo o período."
      : `Panorama: cadastros atualizados nos últimos ${dados.recortes.panorama} dias.`,
  );
  paragrafo(dados.filtros.join(" | "));
  if (alunos)
    paragrafo(
      `Alunos por curso: ${dados.recortes.curso === "disponiveis" ? "somente disponíveis" : "todos no recorte"}.`,
    );
  paragrafo(`Cadastros no recorte: ${numero(dados.tabela.linhas.length)}.`);
  y += 4;
  desenharResumo();
  desenharGraficoDeLinhas();
  desenharTabela({
    titulo: "Valores da série principal",
    manterJunta: true,
    colunas: [
      { rotulo: "Período", largura: 0.37 },
      { rotulo: configuracao.series[0].rotulo, largura: 0.27 },
      { rotulo: configuracao.series[1].rotulo, largura: 0.36 },
    ],
    linhas: dados.pontos.map((ponto) => [
      ponto.rotuloCompleto,
      ...configuracao.series.map(({ chave }) => numero(ponto[chave])),
    ]),
  });
  desenharGraficoHorizontal(
    alunos ? "Panorama dos alunos" : "Panorama das empresas",
    "Situação atual dos cadastros do recorte no período do panorama.",
    dados.panorama,
  );
  desenharGraficoHorizontal(
    alunos ? "Alunos por curso" : "Cursos mais solicitados",
    alunos
      ? "Cursos com mais alunos no recorte, com os totais por turno."
      : "Quantidade de pedidos por curso no mês atual e nos dois meses anteriores.",
    dados.cursos,
  );
  desenharTabela(dados.tabela);

  const paginas = documento.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina++) {
    documento.setPage(pagina);
    linha(margem, 281, 194, 281);
    fonte(8, "normal", cor.secundario);
    documento.text("S.I.G.A. | Visão Geral", margem, 287);
    documento.text(`Página ${pagina} de ${paginas}`, 194, 287, {
      align: "right",
    });
  }
  return documento.output("arraybuffer");
}
