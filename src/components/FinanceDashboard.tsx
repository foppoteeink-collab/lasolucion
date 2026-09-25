import React, { useState, useMemo, useEffect } from 'react';
import { FinancialTransaction, TaskItem } from '../types';
import { formatMoney, getSavedCurrencySymbol } from '../utils/finance';
import { TrendingUp, TrendingDown, Download, Search, Percent, ArrowUpRight, ArrowDownRight, Calendar, Receipt, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getTodayDateString } from '../utils/date';

const AnimatedCounter = ({ value, duration = 1500, prefix = "", suffix = "" }: { value: number, duration?: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <>{prefix}{count.toLocaleString('es-CR')}{suffix}</>;
};

interface FinanceDashboardProps {
  expenses: FinancialTransaction[];
  setExpenses: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  tasksByDate: Record<string, TaskItem[]>;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ expenses, setExpenses, tasksByDate }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('taskquest_finance_dashboard_collapsed');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('taskquest_finance_dashboard_collapsed', String(next));
    } catch {}
  };

  const [currencySymbol, setCurrencySymbol] = useState<string>(getSavedCurrencySymbol);
  const [financeSearchTerm, setFinanceSearchTerm] = useState('');
  const [financeTypeFilter, setFinanceTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [financeViewType, setFinanceViewType] = useState<'month' | 'quarter' | 'semester' | 'year' | 'all'>('month');

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrencySymbol(customEvent.detail);
      }
    };
    window.addEventListener('taskquest:currency-change', handler);
    return () => window.removeEventListener('taskquest:currency-change', handler);
  }, []);

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(ex => ex.id !== id));
  };

  const allTransactions = useMemo(() => {
    const list: { id: string; date: string; type: 'income' | 'expense'; description: string; amount: number; category: string; timestamp: number }[] = [];
    
    // Incomes from Tasks
    Object.entries(tasksByDate).forEach(([dateStr, tasks]) => {
      (tasks as TaskItem[]).forEach(t => {
        if (t.completed && t.incomeAmount && t.incomeAmount > 0) {
          const tDate = t.completedAt ? t.completedAt.split('T')[0] : dateStr;
          const [y, m, d] = (tDate || '').split('-').map(Number);
          const timestamp = new Date(y, (m || 1) - 1, d || 1).getTime();

          list.push({
            id: `task-${t.id}`,
            date: tDate,
            type: 'income',
            description: t.title,
            amount: Number(t.incomeAmount),
            category: 'Misión Cumplida',
            timestamp
          });
        }
      });
    });
    
    // Expenses & Manual Incomes from expenses store
    expenses.forEach(ex => {
      const type = (ex as any).type || 'expense';
      const [y, m, d] = (ex.date || '').split('-').map(Number);
      const timestamp = new Date(y, (m || 1) - 1, d || 1).getTime();

      list.push({
        id: ex.id,
        date: ex.date,
        type: type,
        description: ex.description,
        amount: Number(ex.amount) || 0,
        category: (ex as any).category || (type === 'income' ? 'Ingreso General' : 'Gasto General'),
        timestamp
      });
    });
    
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [tasksByDate, expenses]);

  const financialTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    allTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    
    const balance = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((balance / income) * 100)) : 0;

    return { income, expense, balance, savingsRate };
  }, [allTransactions]);

  const financeSummaries = useMemo(() => {
    const monthly: Record<string, { income: number; expense: number }> = {};
    const quarterly: Record<string, { income: number; expense: number }> = {};
    const semesterly: Record<string, { income: number; expense: number }> = {};
    const yearly: Record<string, { income: number; expense: number }> = {};

    allTransactions.forEach(t => {
      const parts = (t.date || '').split('-');
      const y = Number(parts[0]) || 2026;
      const m = Number(parts[1]) || 1; // 1-12
      const q = Math.ceil(m / 3); // 1-4
      const s = m <= 6 ? 1 : 2; // 1-2 (6 meses)

      const monthKey = `${y}-${String(m).padStart(2, '0')}`;
      const quarterKey = `${y}-Q${q}`;
      const semesterKey = `${y}-S${s}`;
      const yearKey = `${y}`;

      const amt = t.amount;
      const isInc = t.type === 'income';

      if (!monthly[monthKey]) monthly[monthKey] = { income: 0, expense: 0 };
      if (isInc) monthly[monthKey].income += amt; else monthly[monthKey].expense += amt;

      if (!quarterly[quarterKey]) quarterly[quarterKey] = { income: 0, expense: 0 };
      if (isInc) quarterly[quarterKey].income += amt; else quarterly[quarterKey].expense += amt;

      if (!semesterly[semesterKey]) semesterly[semesterKey] = { income: 0, expense: 0 };
      if (isInc) semesterly[semesterKey].income += amt; else semesterly[semesterKey].expense += amt;

      if (!yearly[yearKey]) yearly[yearKey] = { income: 0, expense: 0 };
      if (isInc) yearly[yearKey].income += amt; else yearly[yearKey].expense += amt;
    });

    const formatMonth = (key: string) => {
      const [y, m] = key.split('-');
      return new Date(Number(y), Number(m) - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    };

    const quarterNames = ['', 'Ene - Mar', 'Abr - Jun', 'Jul - Sep', 'Oct - Dic'];

    return {
      month: Object.entries(monthly).map(([k, v]) => ({
        key: k,
        label: formatMonth(k),
        ...v,
        balance: v.income - v.expense,
        savingsRate: v.income > 0 ? Math.max(0, Math.round(((v.income - v.expense) / v.income) * 100)) : 0
      })).sort((a, b) => b.key.localeCompare(a.key)),

      quarter: Object.entries(quarterly).map(([k, v]) => {
        const [, q] = k.split('-Q');
        const qNum = Number(q) || 1;
        return {
          key: k,
          label: `${k.split('-')[0]} • Trimestre ${q} (${quarterNames[qNum]})`,
          ...v,
          balance: v.income - v.expense,
          savingsRate: v.income > 0 ? Math.max(0, Math.round(((v.income - v.expense) / v.income) * 100)) : 0
        };
      }).sort((a, b) => b.key.localeCompare(a.key)),

      semester: Object.entries(semesterly).map(([k, v]) => {
        const [, s] = k.split('-S');
        return {
          key: k,
          label: `${k.split('-')[0]} • 6 Meses / Semestre ${s} (${s === '1' ? 'Ene - Jun' : 'Jul - Dic'})`,
          ...v,
          balance: v.income - v.expense,
          savingsRate: v.income > 0 ? Math.max(0, Math.round(((v.income - v.expense) / v.income) * 100)) : 0
        };
      }).sort((a, b) => b.key.localeCompare(a.key)),

      year: Object.entries(yearly).map(([k, v]) => ({
        key: k,
        label: `Año Fiscal ${k}`,
        ...v,
        balance: v.income - v.expense,
        savingsRate: v.income > 0 ? Math.max(0, Math.round(((v.income - v.expense) / v.income) * 100)) : 0
      })).sort((a, b) => b.key.localeCompare(a.key)),

      all: [{
        key: 'all-time',
        label: 'Total Consolidado Histórico',
        income: financialTotals.income,
        expense: financialTotals.expense,
        balance: financialTotals.balance,
        savingsRate: financialTotals.savingsRate
      }]
    };
  }, [allTransactions, financialTotals]);

  const categoryBreakdown = useMemo(() => {
    const expenseCats: Record<string, number> = {};
    let totalExpense = 0;

    allTransactions.forEach(t => {
      if (t.type === 'expense') {
        const cat = t.category || 'Otros Gastos';
        expenseCats[cat] = (expenseCats[cat] || 0) + t.amount;
        totalExpense += t.amount;
      }
    });

    return Object.entries(expenseCats)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      if (financeTypeFilter !== 'all' && t.type !== financeTypeFilter) return false;
      if (financeSearchTerm.trim()) {
        const term = financeSearchTerm.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(term);
        const matchesCat = t.category.toLowerCase().includes(term);
        const matchesDate = t.date.includes(term);
        if (!matchesDesc && !matchesCat && !matchesDate) return false;
      }
      return true;
    });
  }, [allTransactions, financeTypeFilter, financeSearchTerm]);

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Tipo,Categoria,Descripcion,Monto,Divisa\n";

    allTransactions.forEach(t => {
      const typeStr = t.type === 'income' ? 'Ingreso' : 'Gasto';
      const cat = (t.category || '').replace(/,/g, '');
      const desc = t.description.replace(/,/g, '');
      csvContent += `${t.date},${typeStr},${cat},${desc},${t.amount},${currencySymbol}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_finanzas_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 mb-8 bg-[#00150b]/80 border border-emerald-900/40 p-5 sm:p-7 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.05)] relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 relative z-10">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  Oficina de Finanzas
                </h3>
                <p className="text-[11px] text-emerald-400/80 font-mono">Consolidación de tesorería, flujo de caja y proyecciones</p>
              </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-800/60" title="Divisa configurada en Ajustes">
                <span>Divisa: <strong className="font-mono text-white">{currencySymbol}</strong></span>
              </span>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/50 text-emerald-300 hover:text-white hover:bg-emerald-600/80 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border border-emerald-700/60"
                title="Descargar Reporte en CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={toggleCollapse}
                className="p-1.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 hover:text-white hover:bg-emerald-600/60 transition-colors cursor-pointer"
                title={isCollapsed ? 'Expandir Finanzas' : 'Minimizar Finanzas'}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
          </div>
      </div>
      
      {!isCollapsed && (
        <div className="mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 relative z-10">
        <div className="bg-[#001a11]/90 p-4 sm:p-5 rounded-2xl border border-emerald-800/40 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Total Ingresos</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">
              <AnimatedCounter value={financialTotals.income} prefix={`+${currencySymbol}`} />
            </p>
            <p className="text-[10px] text-emerald-600/80 font-mono mt-1">Misiones y entradas manuales</p>
        </div>
        
        <div className="bg-[#1a0606]/90 p-4 sm:p-5 rounded-2xl border border-red-900/40 flex flex-col justify-between relative overflow-hidden group hover:border-red-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400/80">Total Gastos</span>
              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-red-400 font-mono tracking-tight">
              <AnimatedCounter value={financialTotals.expense} prefix={`-${currencySymbol}`} />
            </p>
            <p className="text-[10px] text-red-500/60 font-mono mt-1">Egresos registrados</p>
        </div>
        
        <div className="bg-[#001710]/90 p-4 sm:p-5 rounded-2xl border border-emerald-800/40 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Balance Neto</span>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                financialTotals.balance >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {financialTotals.balance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${financialTotals.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
              <AnimatedCounter 
                value={Math.abs(financialTotals.balance)} 
                prefix={`${financialTotals.balance >= 0 ? '+' : '-'}${currencySymbol}`} 
              />
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              {financialTotals.balance >= 0 ? 'Superávit consolidado' : 'Déficit acumulado'}
            </p>
        </div>

        <div className="bg-[#041c14]/90 p-4 sm:p-5 rounded-2xl border border-emerald-800/40 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Tasa de Ahorro</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">
                {financialTotals.savingsRate}%
              </p>
              <span className="text-[10px] text-emerald-500/70 font-mono">del flujo</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden border border-emerald-950">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-700" 
                style={{ width: `${Math.min(100, Math.max(0, financialTotals.savingsRate))}%` }} 
              />
            </div>
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Desglose por Período
              </h4>
              <p className="text-[11px] text-slate-400">Total acumulado segmentado según tu horizonte de planificación</p>
            </div>
            
            <div className="flex bg-[#001c10] rounded-xl p-1 border border-emerald-900/60 overflow-x-auto">
              <button 
                onClick={() => setFinanceViewType('month')} 
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all whitespace-nowrap ${
                  financeViewType === 'month' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-white'
                }`}
              >
                Mes
              </button>
              <button 
                onClick={() => setFinanceViewType('quarter')} 
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all whitespace-nowrap ${
                  financeViewType === 'quarter' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-white'
                }`}
              >
                Trimestre (3M)
              </button>
              <button 
                onClick={() => setFinanceViewType('semester')} 
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all whitespace-nowrap ${
                  financeViewType === 'semester' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-white'
                }`}
              >
                6 Meses
              </button>
              <button 
                onClick={() => setFinanceViewType('year')} 
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all whitespace-nowrap ${
                  financeViewType === 'year' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-white'
                }`}
              >
                Un Año
              </button>
              <button 
                onClick={() => setFinanceViewType('all')} 
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all whitespace-nowrap ${
                  financeViewType === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-white'
                }`}
              >
                Totales
              </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {financeSummaries[financeViewType].map(summary => {
            const totalFlow = summary.income + summary.expense;
            const incomePercent = totalFlow > 0 ? Math.round((summary.income / totalFlow) * 100) : 50;

            return (
              <div key={summary.key} className="bg-[#00170d]/90 p-4 rounded-2xl border border-emerald-900/40 flex flex-col gap-3 relative overflow-hidden hover:border-emerald-600/40 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-white uppercase tracking-wider capitalize truncate max-w-[200px]" title={summary.label}>
                    {summary.label}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                    summary.balance >= 0 ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' : 'bg-red-900/50 text-red-300 border border-red-700/50'
                  }`}>
                    {summary.savingsRate}% ahorro
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Ingresos:
                      </span>
                      <span className="text-emerald-300 font-mono font-bold">+{formatMoney(summary.income, currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Gastos:
                      </span>
                      <span className="text-red-400 font-mono font-bold">-{formatMoney(summary.expense, currencySymbol)}</span>
                    </div>
                </div>

                <div className="w-full bg-red-950/60 rounded-full h-2 overflow-hidden flex border border-emerald-950">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${incomePercent}%` }} 
                      title={`Ingresos: ${incomePercent}%`}
                    />
                </div>

                <div className="pt-2 border-t border-emerald-900/30 flex justify-between items-center text-sm font-black">
                    <span className="text-slate-300 text-xs uppercase tracking-wider">Balance:</span>
                    <span className={`font-mono ${summary.balance >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                      {summary.balance >= 0 ? '+' : '-'}{formatMoney(Math.abs(summary.balance), currencySymbol)}
                    </span>
                </div>
              </div>
            );
          })}

          {financeSummaries[financeViewType].length === 0 && (
              <div className="col-span-full text-center py-8 text-xs text-slate-400 bg-[#00170d]/40 rounded-2xl border border-emerald-900/20">
                No hay movimientos registrados para este agrupamiento temporal.
              </div>
          )}
        </div>
      </div>

      {categoryBreakdown.length > 0 && (
        <div className="mb-6 bg-[#00170d]/60 p-4 sm:p-5 rounded-2xl border border-emerald-900/40 relative z-10">
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Distribución de Gastos por Categoría
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryBreakdown.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium truncate">{cat.name}</span>
                  <span className="font-mono font-bold text-red-400">
                    {formatMoney(cat.amount, currencySymbol)} <span className="text-slate-500 text-[10px]">({cat.percent}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#001209] p-4 sm:p-5 rounded-2xl border border-emerald-900/40 shadow-inner relative z-10">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
              <input 
                type="text" 
                value={financeSearchTerm} 
                onChange={e => setFinanceSearchTerm(e.target.value)}
                placeholder="Buscar en descripción, categoría o fecha (ej: 2026-09)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#001a10] border border-emerald-900/50 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
              {financeSearchTerm && (
                <button 
                  onClick={() => setFinanceSearchTerm('')} 
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex bg-[#001c10] rounded-xl p-1 border border-emerald-900/50 shrink-0">
              <button 
                onClick={() => setFinanceTypeFilter('all')} 
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  financeTypeFilter === 'all' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({allTransactions.length})
              </button>
              <button 
                onClick={() => setFinanceTypeFilter('income')} 
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  financeTypeFilter === 'income' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                Ingresos
              </button>
              <button 
                onClick={() => setFinanceTypeFilter('expense')} 
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  financeTypeFilter === 'expense' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-red-300'
                }`}
              >
                Gastos
              </button>
            </div>
        </div>

        <div className="mb-3 px-3 py-2 bg-emerald-950/40 border border-emerald-800/30 rounded-xl flex items-center justify-between text-[11px] text-emerald-400/90">
            <span>💡 Para registrar ingresos y egresos diarios, utiliza el widget <strong>Tesorería Diaria</strong> en la pestaña de Misiones.</span>
            <span className="font-mono text-[10px] text-emerald-500">{filteredTransactions.length} registros</span>
        </div>

        {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No se encontraron movimientos con los filtros seleccionados.
            </div>
        ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#001209] z-10">
                    <tr className="border-b border-emerald-900/40 text-[10px] font-black uppercase text-emerald-500 tracking-wider">
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Categoría</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 text-right">Monto</th>
                      <th className="py-2.5 px-3 w-10 text-right"></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.map(t => {
                      const isIncome = t.type === 'income';
                      const isTaskIncome = t.id.startsWith('task-');
                      return (
                          <tr key={t.id} className="border-b border-emerald-900/20 hover:bg-emerald-900/20 transition-colors">
                            <td className="py-2.5 px-3 text-xs font-mono text-emerald-400/70 whitespace-nowrap">{t.date}</td>
                            <td className="py-2.5 px-3 text-xs text-slate-300">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/40 text-[11px]">
                                {t.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs font-bold text-white">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${isIncome ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                                  <span className="truncate max-w-xs">{t.description}</span>
                                </div>
                            </td>
                            <td className={`py-2.5 px-3 text-right font-mono font-bold text-xs whitespace-nowrap ${
                              isIncome ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                                {isIncome ? '+' : '-'}{formatMoney(t.amount, currencySymbol)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                                {!isTaskIncome && (
                                  <button 
                                    onClick={() => deleteExpense(t.id)}
                                    className="p-1 text-slate-500 hover:text-red-400 transition-colors rounded hover:bg-red-900/30"
                                    title="Eliminar Registro"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                            </td>
                          </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
};
