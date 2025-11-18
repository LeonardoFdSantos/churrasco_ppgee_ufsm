// src/app/page.js

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
import { 
    DollarSign, Users, AlertCircle, Loader2, Zap, CheckCircle, Clock, Target, CreditCard
} from "lucide-react";

// ⚠️ SUBSTITUA PELO SEU LINK DO APPS SCRIPT AQUI
const API_URL = "https://script.google.com/macros/s/AKfycbzxXmTlxzi_DNjy2kume35loHfgFicyCSeIuUjtoe6uhS_XXL7qU2DI04xmrPBLEXy2TA/exec";

// ====================================================================
// FUNÇÕES UTILITÁRIAS
// ====================================================================

// Função para formatar dinheiro (BRL)
const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

// Função para calcular o Total Consolidado (Professores + Alunos)
const calculateConsolidatedTotal = (professoresTotal, alunosTotal) => {
  if (!professoresTotal || !alunosTotal) return {};

  // Soma dos valores (financeiro)
  const totalPaid = (professoresTotal["Pagamentos confirmados"] || 0) + (alunosTotal["Valor Pago"] || 0);
  const totalExpected = (professoresTotal["Valores Esperados"] || 0) + (alunosTotal["Valores Esperados"] || 0);
  const totalMissing = (professoresTotal["Faltante"] || 0) + (alunosTotal["Valores Faltante"] || 0);

  // Soma de pessoas (contagem)
  const totalProfessors = (professoresTotal["Professores confirmados"] || 0);
  const totalStudents = (alunosTotal["Alunos confirmados"] || 0);
  const totalPeopleConfirmed = totalProfessors + totalStudents;

  const totalCompanions = (professoresTotal["Acompanhantes confirmados"] || 0) + (alunosTotal["Acompanhantes confirmados"] || 0);
  
  const totalAllPeople = totalPeopleConfirmed + totalCompanions;

  return {
    "": "Total Consolidado",
    "Pagamento Consolidado": totalPaid,
    "Faltante Consolidado": totalMissing,
    "Esperado Consolidado": totalExpected,
    "Total Base (Prof + Aluno)": totalPeopleConfirmed,
    "Total Professores": totalProfessors,
    "Total Alunos": totalStudents,
    "Total Acompanhantes": totalCompanions,
    "Total Pessoas (Geral)": totalAllPeople,
  };
};


// ====================================================================
// COMPONENTE PRINCIPAL: DASHBOARD
// ====================================================================

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

  // Cálculo e Memorização do Total Consolidado
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

  // --- EXTRAÇÃO DE DADOS E CHAVES ---
  let currentData, totalRow, listData, keys;
  const profTotalData = data.tabela_professores.find(row => row[""] === "Total") || {};
  const alunosTotalData = data.tabela_alunos.find(row => row[""] === "Total") || {};


  if (activeTab === "professores") {
    currentData = data.tabela_professores;
    keys = {
      name: "", paid: "Pagamentos confirmados", missing: "Faltante", people_confirmed: "Professores confirmados", companions: "Acompanhantes confirmados", kpi_people_title: 'Professores Confirmados', kpi_people_label: '(Apenas Professores)', kpi_companion_label: '(Acomp. Professores)',
    };
  } else if (activeTab === "alunos") {
    currentData = data.tabela_alunos;
    keys = {
      name: "", paid: "Valor Pago", missing: "Valores Faltante", people_confirmed: "Alunos confirmados", companions: "Acompanhantes confirmados", kpi_people_title: 'Alunos Confirmados', kpi_people_label: '(Apenas Alunos)', kpi_companion_label: '(Acomp. Alunos)',
    };
  } else if (activeTab === "total") {
    currentData = [];
    totalRow = consolidatedTotal; 
    keys = {
      name: "", paid: "Pagamento Consolidado", missing: "Faltante Consolidado", people_confirmed: "Total Base (Prof + Aluno)", companions: "Total Acompanhantes", kpi_people_title: 'Pessoas Base Confirmadas', kpi_people_label: '(Professores + Alunos)', kpi_companion_label: 'Total Acompanhantes',
    };
  }

  if (activeTab !== "total") {
    totalRow = currentData.find((row) => row[""] === "Total") || {};
    listData = currentData.filter((row) => row[""] !== "Total");
  }
  
  // Contagens para os cards
  const totalPeopleBase = totalRow[keys.people_confirmed] || 0;
  const totalCompanionsCount = totalRow[keys.companions] || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Cabeçalho e Navegação */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Painel Churrasco do PPGEE UFSM</h1>
            <p className="text-slate-500 mt-1">Acompanhamento em tempo real</p>
          </div>
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            <TabButton isActive={activeTab === "professores"} onClick={() => setActiveTab("professores")} label="Professores" />
            <TabButton isActive={activeTab === "alunos"} onClick={() => setActiveTab("alunos")} label="Alunos" />
            <TabButton isActive={activeTab === "total"} onClick={() => setActiveTab("total")} label="Total Geral" icon={<Zap className="w-4 h-4 mr-1"/>} />
          </div>
        </div>

        {/* CARDS DE TOTAL (KPIs) - 4 COLUNAS EM TODAS AS ABAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Card Arrecadado */}
          <KpiCard 
            title="Arrecadado" 
            value={totalRow[keys.paid]} 
            icon={DollarSign} 
            colorClass="border-emerald-500 bg-emerald-50"
            textColor="text-emerald-700"
            subtitle={activeTab === 'total' ? '(Professores + Alunos)' : ''}
          />
          
          {/* 2. Card Faltante */}
          <KpiCard 
            title="Faltante" 
            value={totalRow[keys.missing]} 
            icon={AlertCircle} 
            colorClass="border-rose-500 bg-rose-50"
            textColor="text-rose-700"
            subtitle={activeTab === 'total' ? '(Professores + Alunos)' : ''}
          />

          {/* 3. Card Pessoas Base Confirmadas (Professores ou Alunos) */}
          <KpiCard 
              title={keys.kpi_people_title} 
              value={totalPeopleBase} 
              isCurrency={false}
              icon={CheckCircle} 
              colorClass="border-blue-500 bg-blue-50"
              textColor="text-blue-700"
              subtitle={keys.kpi_people_label}
          />
          
          {/* 4. Card Total Acompanhantes */}
          <KpiCard 
              title="Total Acompanhantes" 
              value={totalCompanionsCount} 
              isCurrency={false}
              icon={Users} 
              colorClass="border-purple-500 bg-purple-50"
              textColor="text-purple-700"
              subtitle={keys.kpi_companion_label}
          />

        </div>
        
        {/* Bloco de Resumo Consolidado Detalhado */}
        
        {activeTab === 'total' ? (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold mb-4 text-slate-800">Resumo Consolidado Detalhado</h2>
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                    
                    {/* LINHA 1: ARRECADADO TOTAL */}
                    <SummaryRow 
                        label="Arrecadado Total" 
                        value={consolidatedTotal["Pagamento Consolidado"]} 
                        isMissing={false}
                        icon={DollarSign}
                        valueColor="text-emerald-600"
                        isBold={true}
                    />
                    {/* Subtotais Arrecadado */}
                    <SummaryRow 
                        label="Arrecadado (Professores)" 
                        value={profTotalData["Pagamentos confirmados"]} 
                        isMissing={false}
                        icon={CreditCard}
                        isSubtotal={true}
                        valueColor="text-slate-600"
                    />
                    <SummaryRow 
                        label="Arrecadado (Alunos)" 
                        value={alunosTotalData["Valor Pago"]} 
                        isMissing={false}
                        icon={CreditCard}
                        isSubtotal={true}
                        valueColor="text-slate-600"
                    />
                    
                    {/* LINHA 2: FALTANTE TOTAL */}
                    <SummaryRow 
                        label="Faltante Total" 
                        value={consolidatedTotal["Faltante Consolidado"]} 
                        isMissing={true} 
                        icon={AlertCircle}
                        isBold={true}
                    />
                    {/* Subtotais Faltante */}
                    <SummaryRow 
                        label="Faltante (Professores)" 
                        value={profTotalData["Faltante"]} 
                        isMissing={true}
                        icon={Clock}
                        isSubtotal={true}
                        valueColor="text-rose-500"
                    />
                    <SummaryRow 
                        label="Faltante (Alunos)" 
                        value={alunosTotalData["Valores Faltante"]} 
                        isMissing={true}
                        icon={Clock}
                        isSubtotal={true}
                        valueColor="text-rose-500"
                    />

                    {/* LINHA 3: ESPERADO TOTAL */}
                    <SummaryRow 
                        label="Esperado Total" 
                        value={consolidatedTotal["Esperado Consolidado"]} 
                        isMissing={false}
                        icon={Target}
                        valueColor="text-blue-600" 
                        isBold={true}
                    />
                     {/* Subtotais Esperado */}
                    <SummaryRow 
                        label="Esperado (Professores)" 
                        value={profTotalData["Valores Esperados"]} 
                        isMissing={false}
                        icon={Target}
                        isSubtotal={true}
                        valueColor="text-slate-600"
                    />
                    <SummaryRow 
                        label="Esperado (Alunos)" 
                        value={alunosTotalData["Valores Esperados"]} 
                        isMissing={false}
                        icon={Target}
                        isSubtotal={true}
                        valueColor="text-slate-600"
                    />
                    

                    {/* SEPARADOR PESSOAS */}
                    <hr className="my-3 border-slate-300"/> 

                    {/* Linha de Pessoas (Mantida) */}
                    <SummaryRow 
                        label="Total de Pessoas (Base: Prof + Aluno)" 
                        value={consolidatedTotal["Total Base (Prof + Aluno)"]} 
                        isMissing={false} 
                        isCurrency={false}
                        icon={CheckCircle}
                        valueColor="text-slate-700"
                    />
                    <SummaryRow 
                        label="Total de Acompanhantes" 
                        value={consolidatedTotal["Total Acompanhantes"]} 
                        isMissing={false} 
                        isCurrency={false}
                        icon={Users}
                        valueColor="text-slate-700"
                    />
                    <SummaryRow 
                        label="PESSOAS TOTAIS GERAIS" 
                        value={consolidatedTotal["Total Pessoas (Geral)"]} 
                        isMissing={false} 
                        isCurrency={false} 
                        isBold={true}
                        icon={Zap}
                        valueColor="text-slate-900" 
                    />
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GRÁFICO (Ocupa 1/3) */}
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

                {/* TABELA DETALHADA (Ocupa 2/3) */}
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

// ====================================================================
// COMPONENTES VISUAIS AUXILIARES
// ====================================================================

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

const KpiCard = ({ title, value, icon: Icon, colorClass, textColor, isCurrency = true, subtitle = '' }) => (
  <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between relative overflow-hidden bg-white`}>
    <div className={`absolute top-0 right-0 p-3 rounded-bl-xl border-b border-l ${colorClass}`}>
        <Icon className="w-5 h-5" />
    </div>
    
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-2xl font-bold ${textColor} flex items-baseline gap-2`}>
        {isCurrency ? formatCurrency(value) : value}
        {subtitle && <span className="text-sm font-medium text-slate-500 normal-case">{subtitle}</span>}
      </p>
    </div>
  </div>
);

// COMPONENTE SummaryRow ATUALIZADO para SUBTOTAIS e ÍCONES
const SummaryRow = ({ label, value, isMissing, isCurrency = true, isBold = false, icon: Icon, valueColor = 'text-emerald-600', isSubtotal = false }) => (
    <div className={`flex justify-between items-center 
        ${isBold ? 'font-bold text-base border-t pt-2 border-slate-200' : 'text-sm'}
        ${isSubtotal ? 'ml-6 opacity-85 text-sm' : ''} // Estilo para indentação de subtotal
    `}>
        <span className="flex items-center gap-2">
            {/* Ícone no Rótulo */}
            {Icon && <Icon className={`w-4 h-4 ${isBold ? 'text-slate-800' : 'text-slate-500'}`} />}
            {label}
        </span>
        {/* Cor do Valor: Se isMissing for true, usa rose-600, senão usa valueColor */}
        <span className={`${isMissing ? 'text-rose-600' : valueColor} font-semibold`}>
            {isCurrency ? formatCurrency(value) : value}
        </span>
    </div>
);