'use client';

import React, { useState, useEffect } from 'react';
import { SolicitacaoCard } from '@/components/dashboard/SolicitacaoCard';
import { SolicitacoesAnalytics } from '@/components/dashboard/SolicitacoesAnalytics';
import { apiClient as api } from '@/lib/api/axiosClient';

export default function AdminSolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [analytics, setAnalytics] = useState({ statusData: [], monthlyData: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErro(null);
        
        const response = await api.get('/admin/solicitacoes');
        
        setSolicitacoes(response.data.solicitacoes || []);
        if (response.data.analytics) {
          setAnalytics(response.data.analytics);
        }
      } catch (err) {
        console.error('Erro ao carregar solicitações:', err);
        const mensagem = err.response?.data?.error || 'Falha ao carregar as solicitações do servidor.';
        setErro(mensagem);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  return (
    <div className="px-3 md:px-5 py-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Gerenciamento de Solicitações</h1>
        <p className="text-xs text-gray-500">Acompanhe e analise os chamados enviados pelas empresas parceiras.</p>
      </div>

      <SolicitacoesAnalytics 
        dadosStatus={analytics.statusData} 
        dadosMensais={analytics.monthlyData} 
      />

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Todas as Solicitações</h2>

        {carregando ? (
          <div className="text-center py-10 text-xs text-gray-500">
            Carregando solicitações do banco de dados...
          </div>
        ) : erro ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs text-center">
            {erro}
          </div>
        ) : solicitacoes.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-xs text-gray-500">
            Nenhuma solicitação cadastrada até o momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {solicitacoes.map((item) => (
              <SolicitacaoCard 
                key={item.id} 
                solicitacao={item} 
                onSelect={(id) => console.log('Solicitação selecionada:', id)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}