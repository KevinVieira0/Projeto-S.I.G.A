import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Importação nomeada do Prisma
import { authorize } from '@/lib/auth/authorize'; // Helper oficial de autorização do S.I.G.A.

export async function GET(request) {
  try {
    // 1. Validação com o helper de autorização oficial do S.I.G.A.
    const authResult = await authorize(request, { perfil: 'ADMIN' });

    if (!authResult || !authResult.authorized) {
      return NextResponse.json(
        { error: authResult?.reason || 'Acesso negado. Faça login como Administrador.' },
        { status: 401 }
      );
    }

    // 2. Consulta as solicitações no PostgreSQL via Prisma
    const solicitacoesBrutas = await prisma.solicitacao.findMany({
      orderBy: {
        id: 'desc',
      },
    });

    // 3. Consulta empresas para associação dos dados
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        razaoSocial: true,
        nomeFantasia: true,
      },
    });

    const empresasMap = new Map(empresas.map((e) => [e.id, e]));

    // 4. Associa cada solicitação à sua empresa correspondente
    const solicitacoes = solicitacoesBrutas.map((sol) => ({
      ...sol,
      empresa: sol.empresaId ? empresasMap.get(sol.empresaId) : null,
    }));

    // 5. Agrupamento de métricas para os gráficos da tela
    const totalStatus = {
      APROVADO: 0,
      EM_ANALISE: 0,
      PENDENTE: 0,
      RECUSADO: 0,
    };

    const agrupadoPorMes = {};

    solicitacoes.forEach((sol) => {
      const statusKey = (sol.status || 'PENDENTE').toUpperCase();
      if (totalStatus[statusKey] !== undefined) {
        totalStatus[statusKey]++;
      } else {
        totalStatus.PENDENTE++;
      }

      const dataRef = sol.criadoEm || sol.createdAt;
      if (dataRef) {
        const mesAno = new Date(dataRef).toLocaleDateString('pt-BR', { month: 'short' });
        const mesLimpo = mesAno.replace('.', '');
        agrupadoPorMes[mesLimpo] = (agrupadoPorMes[mesLimpo] || 0) + 1;
      }
    });

    const statusData = [
      { name: 'Aprovados', value: totalStatus.APROVADO, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
      { name: 'Em Análise', value: totalStatus.EM_ANALISE, color: 'bg-blue-500', textColor: 'text-blue-700' },
      { name: 'Pendentes', value: totalStatus.PENDENTE, color: 'bg-amber-500', textColor: 'text-amber-700' },
      { name: 'Recusados', value: totalStatus.RECUSADO, color: 'bg-rose-500', textColor: 'text-rose-700' },
    ];

    const monthlyData = Object.entries(agrupadoPorMes).map(([mes, count]) => ({
      mes,
      solicitacoes: count,
    }));

    return NextResponse.json({
      solicitacoes,
      analytics: {
        statusData,
        monthlyData,
      },
    });
  } catch (error) {
    console.error('=== ERRO ROTA SOLICITACOES ===', error.message);
    return NextResponse.json(
      { error: 'Erro ao consultar o banco de dados.', detalhe: error.message },
      { status: 500 }
    );
  }
}