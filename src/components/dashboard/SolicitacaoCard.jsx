import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building2, 
  Calendar, 
  ChevronRight 
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDENTE: {
    label: 'Pendente',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  },
  EM_ANALISE: {
    label: 'Em Análise',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    icon: <AlertCircle className="w-3.5 h-3.5 text-blue-600" />,
  },
  APROVADO: {
    label: 'Aprovado',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  },
  RECUSADO: {
    label: 'Recusado',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
  },
};

export function SolicitacaoCard({ solicitacao, onSelect }) {
  const statusInfo = STATUS_CONFIG[solicitacao.status] || STATUS_CONFIG.PENDENTE;

  const dataFormatada = solicitacao.criadoEm 
    ? new Date(solicitacao.criadoEm).toLocaleDateString('pt-BR')
    : 'Data N/A';

  return (
    <div 
      onClick={() => onSelect?.(solicitacao.id)}
      className="group relative bg-white rounded-xl border border-gray-200 px-3.5 py-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
          #{solicitacao.protocolo || solicitacao.id?.substring(0, 8)}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.text}`}>
          {statusInfo.icon}
          {statusInfo.label}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
        {solicitacao.titulo || 'Solicitação de Estágio/Vaga'}
      </h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-3 line-clamp-1">
        {solicitacao.cursos || 'Todos os Cursos'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-600 border-t border-gray-100 pt-2.5 mt-2">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-medium truncate max-w-[130px]">
            {solicitacao.empresa?.razaoSocial || solicitacao.nomeEmpresa || 'Empresa parceira'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{dataFormatada}</span>
        </div>
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}