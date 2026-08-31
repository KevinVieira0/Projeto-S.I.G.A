import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerAlunosDaPlanilha } from "@/lib/googleSheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizarChave(valor) {
  return normalizarTexto(valor).replace(/[^a-z0-9]/g, "");
}

function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function criarMapaCabecalhos(cabecalhos) {
  const mapa = new Map();

  cabecalhos.forEach((cabecalho, indice) => {
    mapa.set(normalizarChave(cabecalho), indice);
  });

  return mapa;
}

function localizarColuna(mapaCabecalhos, ...nomesPossiveis) {
  for (const nome of nomesPossiveis) {
    const chave = normalizarChave(nome);

    if (mapaCabecalhos.has(chave)) {
      return mapaCabecalhos.get(chave);
    }
  }

  throw new Error(
    `Coluna não encontrada: ${nomesPossiveis.join(" / ")}`
  );
}

function pegarValor(linha, indice) {
  return String(linha[indice] ?? "").trim();
}

function converterInteiro(valor, nomeCampo) {
  const numero = Number.parseInt(String(valor).trim(), 10);

  if (!Number.isInteger(numero)) {
    throw new Error(`${nomeCampo} deve ser um número inteiro.`);
  }

  return numero;
}

function converterEmpregado(valor) {
  const valorNormalizado = normalizarChave(valor);

  if (
    valorNormalizado === "sim" ||
    valorNormalizado === "true" ||
    valorNormalizado === "1"
  ) {
    return true;
  }

  if (
    valorNormalizado === "nao" ||
    valorNormalizado === "false" ||
    valorNormalizado === "0"
  ) {
    return false;
  }

  throw new Error(
    'O campo "Empregado" deve possuir o valor "Sim" ou "Não".'
  );
}

function converterGenero(valor) {
  const valorNormalizado = normalizarChave(valor);

  if (valorNormalizado === "masculino") {
    return "Masculino";
  }

  if (valorNormalizado === "feminino") {
    return "Feminino";
  }

  throw new Error(
    'O campo "Gênero" deve possuir o valor "Masculino" ou "Feminino".'
  );
}

function converterStatus(valor, possuiEmpresa) {
  const valorNormalizado = normalizarChave(valor);

  if (!valorNormalizado) {
    return possuiEmpresa ? "Indicado" : "Não indicado";
  }

  if (valorNormalizado === "indicado") {
    return "Indicado";
  }

  if (valorNormalizado === "naoindicado") {
    return "Não indicado";
  }

  if (valorNormalizado === "emanalise") {
    return "Em análise";
  }

  throw new Error(
    `Status da indicação inválido: "${valor}".`
  );
}

function converterData(valor, nomeCampo) {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return null;
  }

  const formatoBrasileiro = texto.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (formatoBrasileiro) {
    const [
      ,
      diaTexto,
      mesTexto,
      anoTexto,
      horaTexto = "0",
      minutoTexto = "0",
      segundoTexto = "0",
    ] = formatoBrasileiro;

    const dia = Number(diaTexto);
    const mes = Number(mesTexto);
    const ano = Number(anoTexto);
    const hora = Number(horaTexto);
    const minuto = Number(minutoTexto);
    const segundo = Number(segundoTexto);

    const data = new Date(ano, mes - 1, dia, hora, minuto, segundo);

    const componentesValidos =
      data.getFullYear() === ano &&
      data.getMonth() === mes - 1 &&
      data.getDate() === dia &&
      data.getHours() === hora &&
      data.getMinutes() === minuto &&
      data.getSeconds() === segundo;

    if (componentesValidos) {
      return data;
    }

    throw new Error(
      `${nomeCampo} possui uma data inválida: "${texto}".`
    );
  }

  const dataAlternativa = new Date(texto);

  if (!Number.isNaN(dataAlternativa.getTime())) {
    return dataAlternativa;
  }

  throw new Error(
    `${nomeCampo} possui uma data inválida: "${texto}".`
  );
}

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        mensagem:
          "Rota disponível somente em desenvolvimento.",
      },
      {
        status: 404,
      }
    );
  }

  try {
    const linhas = await lerAlunosDaPlanilha();

    if (linhas.length === 0) {
      return NextResponse.json(
        {
          mensagem: "A planilha está vazia.",
        },
        {
          status: 400,
        }
      );
    }

    const cabecalhos = linhas[0];
    const mapaCabecalhos =
      criarMapaCabecalhos(cabecalhos);

    const colunas = {
      nome: localizarColuna(
        mapaCabecalhos,
        "Nome",
        "Nome completo"
      ),

      cpf: localizarColuna(
        mapaCabecalhos,
        "CPF"
      ),

      celular: localizarColuna(
        mapaCabecalhos,
        "Número para contato",
        "Numero para contato",
        "Celular",
        "Telefone"
      ),

      email: localizarColuna(
        mapaCabecalhos,
        "E-mail para contato",
        "Email para contato",
        "E-mail",
        "Email"
      ),

      idade: localizarColuna(
        mapaCabecalhos,
        "Idade"
      ),

      genero: localizarColuna(
        mapaCabecalhos,
        "Gênero",
        "Genero",
        "Sexo"
      ),

      modalidade: localizarColuna(
        mapaCabecalhos,
        "Modalidade"
      ),

      curso: localizarColuna(
        mapaCabecalhos,
        "Curso",
        "Nome do curso"
      ),

      turma: localizarColuna(
        mapaCabecalhos,
        "Turma",
        "Turma (Sigla)"
      ),

      periodo: localizarColuna(
        mapaCabecalhos,
        "Período",
        "Periodo"
      ),

      termo: localizarColuna(
        mapaCabecalhos,
        "Termo"
      ),

      empregado: localizarColuna(
        mapaCabecalhos,
        "Empregado",
        "Está empregado?",
        "Esta empregado?"
      ),

      empresa: localizarColuna(
        mapaCabecalhos,
        "Empresa"
      ),

      statusIndicacao: localizarColuna(
        mapaCabecalhos,
        "Status da indicação",
        "Status da indicacao",
        "Status"
      ),

      dataCadastro: localizarColuna(
        mapaCabecalhos,
        "Data de cadastro"
      ),

      ultimaAtualizacao: localizarColuna(
        mapaCabecalhos,
        "Última atualização",
        "Ultima atualizacao"
      ),
    };

    const empresas = await prisma.empresa.findMany({
      where: {
        ativa: true,
      },

      select: {
        id: true,
        nomeFantasia: true,
        razaoSocial: true,
      },
    });

    const empresasPorNome = new Map();

    for (const empresa of empresas) {
      if (empresa.nomeFantasia) {
        empresasPorNome.set(
          normalizarChave(empresa.nomeFantasia),
          empresa
        );
      }

      empresasPorNome.set(
        normalizarChave(empresa.razaoSocial),
        empresa
      );
    }

    const resultado = {
      linhasRecebidas: Math.max(linhas.length - 1, 0),
      criados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: [],
    };

    for (
      let indiceLinha = 1;
      indiceLinha < linhas.length;
      indiceLinha++
    ) {
      const linha = linhas[indiceLinha];
      const numeroLinha = indiceLinha + 1;

      const linhaVazia = !linha.some(
        (valor) => String(valor ?? "").trim() !== ""
      );

      if (linhaVazia) {
        resultado.ignorados++;
        continue;
      }

      try {
        const nome = pegarValor(
          linha,
          colunas.nome
        );

        const cpf = somenteDigitos(
          pegarValor(linha, colunas.cpf)
        );

        const celularBruto = pegarValor(
          linha,
          colunas.celular
        );

        const celular = somenteDigitos(celularBruto);

        const email = pegarValor(
          linha,
          colunas.email
        ).toLowerCase();

        const idade = converterInteiro(
          pegarValor(linha, colunas.idade),
          "Idade"
        );

        const genero = converterGenero(
          pegarValor(linha, colunas.genero)
        );

        const modalidade = pegarValor(
          linha,
          colunas.modalidade
        );

        const curso = pegarValor(
          linha,
          colunas.curso
        );

        const turma = pegarValor(
          linha,
          colunas.turma
        );

        const periodo = pegarValor(
          linha,
          colunas.periodo
        );

        const termo = converterInteiro(
          pegarValor(linha, colunas.termo),
          "Termo"
        );

        const empregado = converterEmpregado(
          pegarValor(linha, colunas.empregado)
        );

        const nomeEmpresa = pegarValor(
          linha,
          colunas.empresa
        );

        const statusPlanilha = pegarValor(
          linha,
          colunas.statusIndicacao
        );

        const dataCadastroPlanilha = converterData(
          pegarValor(linha, colunas.dataCadastro),
          "Data de cadastro"
        );

        const ultimaAtualizacaoPlanilha =
          converterData(
            pegarValor(
              linha,
              colunas.ultimaAtualizacao
            ),
            "Última atualização"
          );

        if (!nome) {
          throw new Error("O nome do aluno está vazio.");
        }

        if (cpf.length !== 11) {
          throw new Error(
            "O CPF deve possuir exatamente 11 números."
          );
        }

        if (idade <= 0 || idade > 120) {
          throw new Error("A idade informada é inválida.");
        }

        if (termo < 1 || termo > 5) {
          throw new Error(
            "O termo deve estar entre 1 e 5."
          );
        }

        if (!modalidade) {
          throw new Error("A modalidade está vazia.");
        }

        if (!curso) {
          throw new Error("O curso está vazio.");
        }

        if (!turma) {
          throw new Error("A turma está vazia.");
        }

        if (!periodo) {
          throw new Error("O período está vazio.");
        }

        let empresaEncontrada = null;

        if (empregado) {
          if (!nomeEmpresa) {
            throw new Error(
              "O aluno está empregado, mas nenhuma empresa foi informada."
            );
          }

          empresaEncontrada = empresasPorNome.get(
            normalizarChave(nomeEmpresa)
          );

          if (!empresaEncontrada) {
            throw new Error(
              `A empresa "${nomeEmpresa}" não está cadastrada ou está inativa.`
            );
          }
        }

        const statusIndicacao = converterStatus(
          statusPlanilha,
          Boolean(empresaEncontrada)
        );

        const agora = new Date();

        const dadosAluno = {
          nome,
          celular: celular || null,
          email: email || null,
          genero,
          idade,
          modalidade,
          curso,
          turma,
          periodo,
          termo,
          empregado,
          empresaId: empresaEncontrada?.id ?? null,
          statusIndicacao,
          ultimaAtualizacao:
            ultimaAtualizacaoPlanilha ?? agora,
        };

        const alunoExistente =
          await prisma.aluno.findUnique({
            where: {
              cpf,
            },

            select: {
              id: true,
            },
          });

        await prisma.aluno.upsert({
          where: {
            cpf,
          },

          update: dadosAluno,

          create: {
            cpf,
            ...dadosAluno,
            dataCadastro:
              dataCadastroPlanilha ?? agora,
          },
        });

        if (alunoExistente) {
          resultado.atualizados++;
        } else {
          resultado.criados++;
        }
      } catch (error) {
        resultado.erros.push({
          linha: numeroLinha,
          mensagem: error.message,
        });
      }
    }

    const possuiErros = resultado.erros.length > 0;

    return NextResponse.json({
      mensagem: possuiErros
        ? "Sincronização concluída com pendências."
        : "Sincronização concluída com sucesso.",

      resultado,
    });
  } catch (error) {
    console.error(
      "Erro ao sincronizar alunos:",
      error
    );

    return NextResponse.json(
      {
        mensagem:
          "Não foi possível sincronizar os alunos.",

        erro: error.message,
      },
      {
        status: 500,
      }
    );
  }
}