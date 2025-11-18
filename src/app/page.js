// src/app/page.js (Substitua todo o conteúdo)

"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, Users, AlertCircle, Loader2, TrendingUp, Zap } from "lucide-react";

// ⚠️ SEU LINK (Mantenha o que você já configurou)
const API_URL = "https://script.google.com/macros/s/AKfycbzxXmTlxzi_DNjy2kume35loHfgFicyCSeIuUjtoe6uhS_XXL7qU2DI04xmrPBLEXy2TA/exec";

// Função utilitária para formatar dinheiro (BRL) - MANTIDA
const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

// --- FUNÇÃO PARA CALCULAR O TOTAL CONSOLIDADO ---
const calculateConsolidatedTotal = (professoresTotal, alunosTotal) => {
  if (!professoresTotal || !alunosTotal) return {};

  // Soma dos valores (financeiro)
  const totalPaid = (professoresTotal["Pagamentos confirmados"] || 0) + (alunosTotal["Valor Pago"] || 0);
  const totalExpected = (professoresTotal["Valores Esperados"] || 0) + (alunosTotal["Valores Esperados"] || 0);
  const totalMissing = (professoresTotal["Faltante"] || 0) + (alunosTotal["Valores Faltante"] || 0);

  // Soma de pessoas (contagem)
  const totalPeopleConfirmed = (professoresTotal["Professores confirmados"] || 0) + (alunosTotal["Alunos confirmados"] || 0);
  const totalCompanions = (professoresTotal["Acompanhantes confirmados"] || 0) + (alunosTotal["Acompanhantes confirmados"] || 0);
  
  const totalAllPeople = totalPeopleConfirmed + totalCompanions;

  return {
    "": "Total Consolidado",
    "Pessoas Confirmadas (Prof + Aluno)": totalPeopleConfirmed,
    "Acompanhantes Confirmados (Prof + Aluno)": totalCompanions,
    "Total Pessoas (Base + Acomp.)": totalAllPeople,
    "Pagamento Consolidado": totalPaid,
    "Faltante Consolidado": totalMissing,
    "Esperado Consolidado": totalExpected
  };
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("professores"); 

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "sucesso") setData(json.data);
      })
      .catch((err) => console.error("Erro:", err))
      .finally(() => setLoading(false));
  }, []);

  const consolidatedTotal = useMemo(() => {
    if (!data) return null;
    const profTotalRow = data.tabela_professores.find(row => row[""] === "Total");
    const alunoTotalRow = data.tabela_alunos.find(row => row[""] === "Total");
    
    return calculateConsolidatedTotal(profTotalRow, alunoTotalRow);
  }, [data]);


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-500">Sincronizando com Google Sheets...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center text-red-500">Erro ao carregar dados.</div>;

  // --- LÓGICA DE DADOS SELECIONADOS ---
  
  let currentData, totalRow, listData, keys;

  if (activeTab === "professores") {
    currentData = data.tabela_professores;
    keys = {
      name: "",
      paid: "Pagamentos confirmados",
      missing: "Faltante",
      expected: "Valores Esperados",
      people_confirmed: "Professores confirmados",
      companions: "Acompanhantes confirmados",
      // Chaves para exibição nos Cards
      kpi_people_label: 'Professores',
      kpi_companion_label: 'Acomp. Professores',
      kpi_total_label: 'Prof + Acomp',
    };
  } else if (activeTab === "alunos") {
    currentData = data.tabela_alunos;
    keys = {
      name: "",
      paid: "Valor Pago",
      missing: "Valores Faltante",
      expected: "Valores Esperados",
      people_confirmed: "Alunos confirmados",
      companions: "Acompanhantes confirmados",
      // Chaves para exibição nos Cards
      kpi_people_label: 'Alunos',
      kpi_companion_label: 'Acomp. Alunos',
      kpi_total_label: 'Alunos + Acomp',
    };
  } else if (activeTab === "total") {
    currentData = [];
    totalRow = consolidatedTotal; 
    keys = {
      name: "",
      paid: "Pagamento Consolidado",
      missing: "Faltante Consolidado",
      expected: "Esperado Consolidado",
      people_confirmed: "Total Pessoas (Base + Acomp.)", // Valor total para o KPI
      companions: "Acompanhantes Confirmados (Prof + Aluno)",
      // Chaves para exibição nos Cards
      kpi_people_label: 'Professores + Alunos',
      kpi_companion_label: 'Total Acompanhantes',
      kpi_total_label: 'Pessoas Gerais', // Usaremos este para o Total Pessoas
    };
  }

  if (activeTab !== "total") {
    totalRow = currentData.find((row) => row[""] === "Total") || {};
    listData = currentData.filter((row) => row[""] !== "Total");
  }
  
  const totalPeopleBase = activeTab === 'total' 
    ? consolidatedTotal["Pessoas Confirmadas (Prof + Aluno)"] 
    : (totalRow[keys.people_confirmed] || 0);

  const totalCompanionsCount = activeTab === 'total'
    ? consolidatedTotal["Acompanhantes Confirmados (Prof + Aluno)"]
    : (totalRow[keys.companions] || 0);

  // Calcula o total geral de pessoas (base + acompanhantes)
  const totalAllPeople = totalPeopleBase + totalCompanionsCount;


  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Cabeçalho e Navegação */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Painel Financeiro</h1>
            <p className="text-slate-500 mt-1">Acompanhamento em tempo real</p>
          </div>
          
          {/* Botões de Alternância (Abas) */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            <TabButton 
              isActive={activeTab === "professores"} 
              onClick={() => setActiveTab("professores")} 
              label="Professores" 
            />
            <TabButton 
              isActive={activeTab === "alunos"} 
              onClick={() => setActiveTab("alunos")} 
              label="Alunos" 
            />
            <TabButton 
              isActive={activeTab === "total"} 
              onClick={() => setActiveTab("total")} 
              label="Total Geral" 
              icon={<Zap className="w-4 h-4 mr-1"/>}
            />
          </div>
        </div>

        {/* CARDS DE TOTAL (KPIs) - COM DESCRIÇÃO MELHORADA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard 
            title="Arrecadado" 
            value={totalRow[keys.paid]} 
            icon={<DollarSign className="text-emerald-600 w-5 h-5" />} 
            colorClass="border-emerald-500 bg-emerald-50"
            textColor="text-emerald-700"
            subtitle="" // Sem subtítulo para valores
          />
          <KpiCard 
            title="Faltante" 
            value={totalRow[keys.missing]} 
            icon={<AlertCircle className="text-rose-600 w-5 h-5" />} 
            colorClass="border-rose-500 bg-rose-50"
            textColor="text-rose-700"
            subtitle="" // Sem subtítulo para valores
          />
          {/* Card Total Pessoas: Agora exibe 164 (Base + Acomp) */}
          <KpiCard 
            title="Pessoas Confirmadas" 
            value={totalAllPeople} 
            isCurrency={false}
            icon={<Users className="text-blue-600 w-5 h-5" />} 
            colorClass="border-blue-500 bg-blue-50"
            textColor="text-blue-700"
            // Subtítulo que explica o que é o total
            subtitle={`(Base + Acompanhantes)`}
          />
           {/* Card Acompanhantes: Agora exibe 19 */}
           <KpiCard 
            title="Total Acompanhantes" 
            value={totalCompanionsCount} 
            isCurrency={false}
            icon={<Users className="text-purple-600 w-5 h-5" />} 
            colorClass="border-purple-500 bg-purple-50"
            textColor="text-purple-700"
            // Subtítulo que explica o que é a base
            subtitle={`(${keys.kpi_companion_label})`}
          />
        </div>
        
        {/* Gráfico e Tabela */}
        
        {activeTab === 'total' ? (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-4 text-slate-800">Resumo Consolidado Detalhado</h2>
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                    <SummaryRow label="Arrecadado Total" value={consolidatedTotal["Pagamento Consolidado"]} isMissing={false}/>
                    <SummaryRow label="Faltante Total" value={consolidatedTotal["Faltante Consolidado"]} isMissing={true}/>
                    <SummaryRow label="Esperado Total" value={consolidatedTotal["Esperado Consolidado"]} isMissing={false}/>
                    <hr className="my-3"/>
                    <SummaryRow label="Total de Pessoas (Base: Prof + Aluno)" value={consolidatedTotal["Pessoas Confirmadas (Prof + Aluno)"]} isMissing={false} isCurrency={false}/>
                    <SummaryRow label="Total de Acompanhantes" value={consolidatedTotal["Acompanhantes Confirmados (Prof + Aluno)"]} isMissing={false} isCurrency={false}/>
                    <SummaryRow label="PESSOAS TOTAIS GERAIS" value={consolidatedTotal["Total Pessoas (Base + Acomp.)"]} isMissing={false} isCurrency={false} isBold={true}/>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GRÁFICO (Ocupa 1/3) - Mantido igual */}
                 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-lg font-semibold mb-6 text-slate-700">Comparativo Visual</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={listData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey={keys.name} type="category" width={80} tick={{fontSize: 11}} />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)}
                                    cursor={{fill: '#f8fafc'}}
                                />
                                <Legend wrapperStyle={{fontSize: '12px'}} />
                                <Bar name="Pago" dataKey={keys.paid} fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar name="Faltante" dataKey={keys.missing} fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TABELA DETALHADA (Ocupa 2/3) - Mantida igual */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-700">Detalhamento por Grupo</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Grupo</th>
                                    <th className="px-6 py-3 text-center">Confirmados</th>
                                    <th className="px-6 py-3 text-center">Acompanhantes</th>
                                    <th className="px-6 py-3 text-right">Pago</th>
                                    <th className="px-6 py-3 text-right text-rose-600">Faltante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {listData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900">{row[keys.name] || "Sem Nome"}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{row[keys.people_confirmed]}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{row[keys.companions]}</td>
                                        <td className="px-6 py-4 text-right font-medium text-emerald-600">{formatCurrency(row[keys.paid])}</td>
                                        <td className="px-6 py-4 text-right font-medium text-rose-600">{formatCurrency(row[keys.missing])}</td>
                                    </tr>
                                ))}
                            </tbody>
                            
                            {/* RODAPÉ DA TABELA COM O TOTAL */}
                            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-200 text-slate-800">
                                <tr>
                                    <td className="px-6 py-4">TOTAL POR ABA</td>
                                    <td className="px-6 py-4 text-center">{totalRow[keys.people_confirmed]}</td>
                                    <td className="px-6 py-4 text-center">{totalRow[keys.companions]}</td>
                                    <td className="px-6 py-4 text-right text-emerald-700">{formatCurrency(totalRow[keys.paid])}</td>
                                    <td className="px-6 py-4 text-right text-rose-700">{formatCurrency(totalRow[keys.missing])}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTES VISUAIS (Aprimorados) ---

const TabButton = ({ isActive, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-md text-sm transition-all duration-200 flex items-center ${
      isActive 
        ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5 font-bold" 
        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
    }`}
  >
    {icon}
    {label}
  </button>
);

// COMPONENTE KPI ATUALIZADO PARA RECEBER SUBTÍTULO
const KpiCard = ({ title, value, icon, colorClass, textColor, isCurrency = true, subtitle = '' }) => (
  <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between relative overflow-hidden bg-white`}>
    <div className={`absolute top-0 right-0 p-3 rounded-bl-xl border-b border-l ${colorClass}`}>
        {icon}
    </div>
    
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-2xl font-bold ${textColor} flex items-baseline gap-2`}>
        {isCurrency ? formatCurrency(value) : value}
        {/* NOVO: Exibe o subtítulo ao lado do valor */}
        {subtitle && <span className="text-sm font-medium text-slate-500 normal-case">{subtitle}</span>}
      </p>
    </div>
  </div>
);

const SummaryRow = ({ label, value, isMissing, isCurrency = true, isBold = false }) => (
    <div className={`flex justify-between items-center ${isBold ? 'font-bold text-lg border-t pt-2 border-slate-200' : 'text-sm'}`}>
        <span>{label}</span>
        <span className={`${isMissing ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isCurrency ? formatCurrency(value) : value}
        </span>
    </div>
);