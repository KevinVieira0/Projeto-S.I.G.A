import React from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle 
} from 'lucide-react';

export function SolicitacoesAnalytics({ dadosStatus = [], dadosMensais = [] }) {
  const defaultStatus = [
    { name: 'Aprovados', value: 42, color: 'bg-emerald-500', textColor: 'text-emerald-700', icon: CheckCircle2 },
    { name: 'Em Análise', value: 25, color: 'bg-blue-500', textColor: 'text-blue-700', icon: AlertCircle },
    { name: 'Pendentes', value: 18, color: 'bg-amber-500', textColor: 'text-amber-700', icon: Clock },
    { name: 'Recusados', value: 10, color: 'bg-rose-500', textColor: 'text-rose-700', icon: XCircle },
  ];

  const defaultMensais = [
    { mes: 'Jan', solicitacoes: 12 },
    { mes: 'Fev', solicitacoes: 19 },
    { mes: 'Mar', solicitacoes: 25 },
    { mes: 'Abr', solicitacoes: 32 },
    { mes: 'Mai', solicitacoes: 28 },
  ];

  const statusData = dadosStatus.length > 0 ? dadosStatus : defaultStatus;
  const monthlyData = dadosMensais.length > 0 ? dadosMensais : defaultMensais;

  const maxSolicitacoes = Math.max(...monthlyData.map((d) => d.solicitacoes), 1);
  const totalStatus = statusData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Gráfico 1: Volume Mensal */}
      <div className="lg:col-span-2 bg-white px-3.5 py-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-800">Volume de Solicitações</h4>
        </div>

        <div className="flex items-end justify-between h-44 gap-2 pt-6 border-b border-gray-100 pb-2 px-1">
          {monthlyData.map((item, idx) => {
            const heightPercent = Math.round((item.solicitacoes / maxSolicitacoes) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[11px] font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">
                  {item.solicitacoes}
                </span>
                <div className="w-full bg-gray-100 rounded-t-md h-full flex items-end overflow-hidden max-w-[40px]">
                  <div 
                    className="w-full bg-blue-600 rounded-t-md transition-all duration-300 group-hover:bg-blue-500" 
                    style={{ height: `${heightPercent}%` }} 
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">{item.mes}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico 2: Distribuição por Status */}
      <div className="bg-white px-3.5 py-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <PieChartIcon className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-800">Status Geral</h4>
        </div>

        <div className="space-y-2.5 my-auto">
          {statusData.map((item, idx) => {
            const Icon = item.icon || AlertCircle;
            const percent = totalStatus > 0 ? Math.round((item.value / totalStatus) * 100) : 0;

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <Icon className={`w-3.5 h-3.5 ${item.textColor}`} />
                    {item.name}
                  </span>
                  <span className="text-gray-500 font-mono text-[11px]">
                    {item.value} ({percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-300`} 
                    style={{ width: `${percent}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}