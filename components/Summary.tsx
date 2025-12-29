import React, { useState, useEffect, useMemo } from 'react';
import { Evaluation } from '../types';
import { exportEvaluationToExcel } from '../services/excelExport';
import { getEvaluations } from '../services/storage';
import { FileDown, ArrowLeft, Edit2, CheckCircle2, AlertCircle, Mail, Heart, TrendingUp, DollarSign, Printer, X, MapPin, Sprout, Calendar, User, Hash, BrainCircuit, Sparkles, Loader2, Key, ExternalLink, Trash2 } from 'lucide-react';
import DonationModal from './DonationModal';
import { generateAgronomicAnalysis, saveApiKey, getStoredApiKey, removeApiKey } from '../services/ai';
import ReactMarkdown from 'react-markdown';

interface Props {
  evaluation: Evaluation;
  onBackToEdit: () => void;
  onExit: () => void;
}

const StatCard = ({ label, value, subValue, variant = 'default', alertLevel = null }: { label: string, value: any, subValue?: string, variant?: 'default' | 'success' | 'warning', alertLevel?: 'green' | 'yellow' | 'red' | null }) => {
  const styles = {
    default: {
      card: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700',
      text: 'text-gray-800 dark:text-gray-100'
    },
    success: {
      card: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400'
    },
    warning: {
      card: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400'
    }
  };
  
  const currentStyle = styles[variant] || styles.default;
  
  // Alert Badge Logic
  let badge = null;
  if (alertLevel === 'green') badge = <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 shadow-sm animate-pulse"></span>;
  if (alertLevel === 'yellow') badge = <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-500 shadow-sm animate-pulse"></span>;
  if (alertLevel === 'red') badge = <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-600 shadow-sm animate-pulse"></span>;

  return (
    <div className={`p-4 rounded-xl border shadow-sm relative overflow-hidden ${currentStyle.card}`}>
      {badge}
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{label}</p>
      <p className={`text-3xl font-black mt-1 ${currentStyle.text}`}>{value}</p>
      {subValue && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">{subValue}</p>}
    </div>
  );
};

// Simple Line Chart Component (SVG)
const SimpleTrendChart = ({ history }: { history: { date: string, broca: number, roya: number }[] }) => {
  if (history.length < 2) return <p className="text-sm text-gray-400 italic text-center p-4">Se necesitan al menos 2 evaluaciones para ver tendencias.</p>;

  const sorted = [...history].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const maxVal = Math.max(...sorted.map(h => Math.max(h.broca, h.roya)), 5); // Min Y-axis 5%
  
  const width = 300;
  const height = 150;
  const padding = 20;
  
  const getX = (i: number) => padding + (i / (sorted.length - 1)) * (width - padding * 2);
  const getY = (val: number) => height - padding - (val / maxVal) * (height - padding * 2);

  const brocaPath = sorted.map((d, i) => `${getX(i)},${getY(d.broca)}`).join(' ');
  const royaPath = sorted.map((d, i) => `${getX(i)},${getY(d.roya)}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#ccc" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#ccc" strokeWidth="1" />
        
        {/* Paths */}
        <polyline points={brocaPath} fill="none" stroke="#dc2626" strokeWidth="2" />
        <polyline points={royaPath} fill="none" stroke="#f59e0b" strokeWidth="2" />
        
        {/* Points */}
        {sorted.map((d, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(d.broca)} r="3" fill="#dc2626" />
            <circle cx={getX(i)} cy={getY(d.roya)} r="3" fill="#f59e0b" />
            <text x={getX(i)} y={height - 5} fontSize="8" textAnchor="middle" fill="currentColor" className="text-gray-500">{d.date.substring(5)}</text>
          </g>
        ))}
      </svg>
      <div className="flex justify-center gap-4 mt-2 text-xs font-bold">
        <span className="text-red-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-600"></div> Broca</span>
        <span className="text-amber-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Roya</span>
      </div>
    </div>
  );
};

const Summary: React.FC<Props> = ({ evaluation, onBackToEdit, onExit }) => {
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [showDonation, setShowDonation] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  
  // Calculator State
  const [coffeePrice, setCoffeePrice] = useState<number>(0); // Per Carga/Kilo
  const [harvestEst, setHarvestEst] = useState<number>(0);
  const [priceUnit, setPriceUnit] = useState<'kilo' | 'carga'>('kilo');
  
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Calculations
  const totalTrees = evaluation.trees.length; 
  
  const totals = evaluation.trees.reduce((acc, tree) => {
    return {
      fa: acc.fa + tree.fa,
      fba: acc.fba + tree.fba,
      fs: acc.fs + tree.fs,
      fbs: acc.fbs + tree.fbs,
      nh: acc.nh + tree.nh,
      hr: acc.hr + tree.hr
    };
  }, { fa: 0, fba: 0, fs: 0, fbs: 0, nh: 0, hr: 0 });

  const totalFruits = totals.fa + totals.fs;
  const totalBroca = totals.fba + totals.fbs;
  const infestationPercentRaw = totalFruits > 0 ? (totalBroca / totalFruits) * 100 : 0;
  const infestationPercent = infestationPercentRaw.toFixed(2);
  
  const royaPercentRaw = totals.nh > 0 ? (totals.hr / totals.nh) * 100 : 0;
  const royaPercent = royaPercentRaw.toFixed(2);

  // --- TRAFFIC LIGHT LOGIC ---
  const getBrocaAlert = (val: number) => {
    if (val < 2) return 'green';
    if (val < 5) return 'yellow';
    return 'red';
  };
  const getRoyaAlert = (val: number) => {
    if (val < 5) return 'green';
    if (val < 10) return 'yellow';
    return 'red';
  };

  const brocaLevel = getBrocaAlert(infestationPercentRaw);
  const royaLevel = getRoyaAlert(royaPercentRaw);

  // --- HISTORY DATA ---
  const historyData = useMemo(() => {
    const all = getEvaluations();
    // Filter by same lot name and valid dates
    return all
      .filter(e => e.nombreLote.toLowerCase().trim() === evaluation.nombreLote.toLowerCase().trim() && e.status === 'completed')
      .map(e => {
         const tFruits = e.trees.reduce((acc, t) => acc + t.fa + t.fs, 0);
         const tBroca = e.trees.reduce((acc, t) => acc + t.fba + t.fbs, 0);
         const tLeaves = e.trees.reduce((acc, t) => acc + t.nh, 0);
         const tRoya = e.trees.reduce((acc, t) => acc + t.hr, 0);
         return {
           date: e.fechaVisita,
           broca: tFruits > 0 ? (tBroca / tFruits) * 100 : 0,
           roya: tLeaves > 0 ? (tRoya / tLeaves) * 100 : 0
         };
      });
  }, [evaluation.nombreLote]);

  // --- EXPORT ---
  const handleExport = () => {
    try {
      exportEvaluationToExcel(evaluation);
      setToast({ msg: "Archivo descargado correctamente", type: 'success' });
    } catch (e) {
      setToast({ msg: "Error al exportar archivo", type: 'error' });
      console.error(e);
    }
  };

  const handlePrint = () => {
    // Basic reliable print trigger with a small delay to ensure UI threads are clear
    setTimeout(() => {
        window.print();
    }, 100);
  };

  // --- AI ANALYSIS ---
  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setShowAiModal(true);
    setAiAnalysis(null);

    const stats = {
      infestationPercent,
      royaPercent,
      totalTrees
    };

    try {
      const result = await generateAgronomicAnalysis(evaluation, stats);
      setAiAnalysis(result);
    } catch (error: any) {
      setIsAnalyzing(false);
      if (error.message === 'MISSING_KEY' || error.message === 'INVALID_KEY') {
         setShowAiModal(false);
         setShowKeyInput(true); // Open key input modal
      } else {
         setAiAnalysis(`Error: ${error.message || "No se pudo generar el análisis."}`);
      }
    } finally {
      if (!showKeyInput) setIsAnalyzing(false);
    }
  };

  const saveKeyAndRetry = () => {
     if (tempApiKey.length > 10) {
        saveApiKey(tempApiKey);
        setShowKeyInput(false);
        handleAiAnalysis(); // Retry immediately
     } else {
        alert("Llave inválida");
     }
  };

  // --- ECONOMICS ---
  const calculateLoss = () => {
    const lossPercentage = infestationPercentRaw / 100;
    // Assuming price is per unit entered.
    // Loss = Total Value * % Infestation (Simplified model: assuming infested beans are total loss or significant discount)
    const totalValue = harvestEst * coffeePrice;
    return totalValue * lossPercentage;
  };

  const estimatedLoss = calculateLoss();

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 relative">
      
      {/* 
        ================================================================
        1. VISTA DE APLICACIÓN (Oculta al imprimir)
        ================================================================ 
      */}
      <div className="print:hidden h-full flex flex-col">
        {/* Toast Notification */}
        <div 
          className={`fixed top-20 mt-[env(safe-area-inset-top)] left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm z-50 transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
        >
          {toast && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border ${
              toast.type === 'success' ? 'bg-green-100 border-green-200 text-green-900 dark:bg-green-900/90 dark:text-green-100 dark:border-green-800' :
              toast.type === 'error' ? 'bg-red-100 border-red-200 text-red-900 dark:bg-red-900/90 dark:text-red-100 dark:border-red-800' :
              'bg-blue-100 border-blue-200 text-blue-900 dark:bg-blue-900/90 dark:text-blue-100 dark:border-blue-800'
            }`}>
              {toast.type === 'success' && <CheckCircle2 size={20} />}
              {toast.type === 'error' && <AlertCircle size={20} />}
              {toast.type === 'info' && <FileDown size={20} />}
              <p className="text-sm font-bold">{toast.msg}</p>
            </div>
          )}
        </div>

        <header className="bg-white dark:bg-gray-800 p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-sm flex items-center justify-between z-10">
          <button onClick={onExit} className="text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1">
            <ArrowLeft size={18} /> Inicio
          </button>
          <h1 className="font-bold text-lg text-gray-900 dark:text-white">Resumen del Lote</h1>
          <button onClick={onBackToEdit} className="text-green-600 dark:text-green-400 font-bold text-sm flex items-center gap-1">
            <Edit2 size={16} /> Editar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Info Card */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between">
              <div>
                  <h2 className="font-bold text-xl mb-1 text-gray-900 dark:text-white">{evaluation.nombreLote}</h2>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{evaluation.caficultor}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{evaluation.fechaVisita}</p>
              </div>
              {evaluation.location && (
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-blue-600 dark:text-blue-400">
                      <MapPin size={16} />
                      <span className="text-xs font-bold">GPS</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{evaluation.location.lat.toFixed(4)}</p>
                    <p className="text-[10px] text-gray-500">{evaluation.location.lng.toFixed(4)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Stats with Alerts */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              label="% Infestación Broca" 
              value={`${infestationPercent}%`} 
              variant="success"
              alertLevel={brocaLevel}
            />
            <StatCard 
              label="% Incidencia Roya" 
              value={`${royaPercent}%`} 
              variant="warning"
              alertLevel={royaLevel}
            />
            <StatCard 
              label="Total Frutos" 
              value={totalFruits} 
              subValue={`A: ${totals.fa} | S: ${totals.fs}`}
            />
            <StatCard 
              label="Total Árboles" 
              value={totalTrees}
            />
          </div>

          {/* Action Buttons for Tools */}
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setShowHistory(true)}
              className="flex flex-col items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400 mb-1" />
              <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 text-center">Ver Tendencia</span>
            </button>
            
            <button 
              onClick={() => setShowCalculator(true)}
              className="flex flex-col items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400 mb-1" />
              <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 text-center">Calc. Pérdidas</span>
            </button>

            <button 
              onClick={handleAiAnalysis}
              className="flex flex-col items-center justify-center p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl hover:bg-purple-100 transition-colors relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent pointer-events-none"></div>
              <Sparkles size={20} className="text-purple-600 dark:text-purple-400 mb-1" />
              <span className="text-[10px] font-bold text-purple-900 dark:text-purple-300 text-center">Analizar con IA</span>
            </button>
          </div>

          {/* Recommendations Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">Diagnóstico Automático</h3>
              <ul className="space-y-2 text-sm">
                  {brocaLevel === 'green' && <li className="flex items-start gap-2 text-green-700 dark:text-green-400"><CheckCircle2 size={16} className="mt-0.5"/> Broca bajo control. Mantener monitoreo.</li>}
                  {brocaLevel === 'yellow' && <li className="flex items-start gap-2 text-amber-600 dark:text-amber-400"><AlertCircle size={16} className="mt-0.5"/> Alerta de Broca. Se recomienda RE-RE (Recolección de Repaso).</li>}
                  {brocaLevel === 'red' && <li className="flex items-start gap-2 text-red-600 dark:text-red-400"><AlertCircle size={16} className="mt-0.5"/> <strong>ALERTA CRÍTICA:</strong> Broca fuera de control. Evaluar control químico/biológico inmediato.</li>}
                  
                  {royaLevel === 'green' && <li className="flex items-start gap-2 text-green-700 dark:text-green-400"><CheckCircle2 size={16} className="mt-0.5"/> Roya bajo niveles de daño.</li>}
                  {royaLevel === 'red' && <li className="flex items-start gap-2 text-red-600 dark:text-red-400"><AlertCircle size={16} className="mt-0.5"/> Alta incidencia de Roya. Revisar plan de nutrición y fungicidas.</li>}
              </ul>
          </div>
        </div>

        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-lg z-10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
              <div>
                <button 
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-3 rounded-xl font-bold text-sm transition-all"
                >
                  <Printer size={18} /> Imprimir / PDF
                </button>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center">
                  (Seleccione 'Guardar como PDF' en el diálogo de impresión)
                </p>
              </div>
              <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all"
              >
              <FileDown size={18} /> Excel
              </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a 
              href="mailto:mateotabares7@gmail.com?subject=Consulta%20Técnica%20sobre%20Lote"
              className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 py-3 rounded-xl font-bold text-xs border border-blue-200 dark:border-blue-800 transition-all uppercase tracking-wide"
            >
              <Mail size={16} /> Contactar Ing.
            </a>
            
            <button 
              onClick={() => setShowDonation(true)}
              className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 py-3 rounded-xl font-bold text-xs border border-amber-200 dark:border-amber-800 transition-all uppercase tracking-wide"
            >
              <Heart size={16} fill="currentColor" className="opacity-50" /> Apoyar Proyecto
            </button>
          </div>
        </div>
      </div>

      {/* 
        ================================================================
        2. VISTA DE IMPRESIÓN (Visible SOLO al imprimir)
        ================================================================ 
      */}
      <div className="hidden print:block bg-white text-black p-8 font-serif">
        {/* Header */}
        <div className="border-b-4 border-green-700 pb-4 mb-6 flex justify-between items-end">
           <div>
              <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Informe Técnico</h1>
              <p className="text-green-800 text-sm font-semibold uppercase tracking-widest mt-1">Evaluación BrocaRoya</p>
           </div>
           <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-green-700 mb-1">
                 <Sprout size={24} />
                 <span className="font-bold text-lg">AgroData</span>
              </div>
              <p className="text-xs text-gray-500">Fecha de Generación: {new Date().toLocaleDateString()}</p>
           </div>
        </div>

        {/* General Info Grid */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded p-4">
           <h3 className="text-sm font-bold text-green-800 uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
              <User size={14}/> Información del Lote
           </h3>
           <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-200 border-dotted mr-4">
                 <span className="text-gray-500">Propietario:</span>
                 <span className="font-bold">{evaluation.caficultor}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 border-dotted">
                 <span className="text-gray-500">Lote:</span>
                 <span className="font-bold">{evaluation.nombreLote}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 border-dotted mr-4">
                 <span className="text-gray-500">Fecha Visita:</span>
                 <span className="font-bold">{evaluation.fechaVisita}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 border-dotted">
                 <span className="text-gray-500">Variedad:</span>
                 <span className="font-bold">{evaluation.variedad || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 border-dotted mr-4">
                 <span className="text-gray-500">Edad:</span>
                 <span className="font-bold">{evaluation.edadAnios ? `${evaluation.edadAnios} años` : 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 border-dotted">
                 <span className="text-gray-500">Densidad:</span>
                 <span className="font-bold">{evaluation.densidad ? `${evaluation.densidad} arb/ha` : 'N/A'}</span>
              </div>
           </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
           {/* Left: Stats */}
           <div>
              <h3 className="text-sm font-bold text-green-800 uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                 <Hash size={14}/> Resultados del Muestreo
              </h3>
              <table className="w-full text-sm">
                 <tbody>
                    <tr className="border-b border-gray-100">
                       <td className="py-2 text-gray-600">Árboles Evaluados</td>
                       <td className="py-2 text-right font-bold">{totalTrees}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-green-50">
                       <td className="py-2 text-green-900 font-bold pl-2">Infestación Broca</td>
                       <td className={`py-2 text-right font-bold pr-2 ${brocaLevel === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{infestationPercent}%</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                       <td className="py-2 text-gray-600 pl-2 text-xs italic">- Frutos en Árbol</td>
                       <td className="py-2 text-right text-gray-500">{totals.fba} brocados / {totals.fa} total</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                       <td className="py-2 text-gray-600 pl-2 text-xs italic">- Frutos en Suelo</td>
                       <td className="py-2 text-right text-gray-500">{totals.fbs} brocados / {totals.fs} total</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-amber-50">
                       <td className="py-2 text-amber-900 font-bold pl-2">Incidencia Roya</td>
                       <td className={`py-2 text-right font-bold pr-2 ${royaLevel === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{royaPercent}%</td>
                    </tr>
                 </tbody>
              </table>
           </div>
           
           {/* Right: Diagnosis & Chart */}
           <div>
              <h3 className="text-sm font-bold text-green-800 uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                 <TrendingUp size={14}/> Histórico y Diagnóstico
              </h3>
              <div className="border border-gray-200 rounded p-2 mb-3 bg-white">
                 <SimpleTrendChart history={historyData} />
              </div>
              <div className="text-xs bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                 <p className="font-bold text-gray-700 mb-1">Diagnóstico Automático:</p>
                 {brocaLevel === 'red' && <p className="text-red-700 font-bold">• ALERTA CRÍTICA: Niveles de Broca superiores al umbral económico.</p>}
                 {brocaLevel === 'yellow' && <p className="text-amber-700">• ALERTA: Se recomienda iniciar labores de repaso (Re-Re).</p>}
                 {brocaLevel === 'green' && <p className="text-green-700">• Niveles de Broca bajo control.</p>}
              </div>
           </div>
        </div>

        {/* Recommendations Area (Blank Lines for writing or auto-filled) */}
        <div className="mb-12">
           <h3 className="text-sm font-bold text-green-800 uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
              <CheckCircle2 size={14}/> Recomendaciones Técnicas
           </h3>
           <div className="border border-gray-200 rounded min-h-[150px] p-4 text-sm leading-relaxed">
              <p className="text-gray-400 italic mb-4">[Espacio reservado para observaciones adicionales del agrónomo]</p>
              <div className="border-b border-gray-100 h-8"></div>
              <div className="border-b border-gray-100 h-8"></div>
              <div className="border-b border-gray-100 h-8"></div>
           </div>
        </div>

        {/* Footer / Signature */}
        <div className="mt-auto pt-12 flex justify-between items-end">
           <div className="text-center w-64">
              <div className="border-b border-black mb-2"></div>
              <p className="font-bold text-sm">Firma del Profesional / Evaluador</p>
              <p className="text-xs text-gray-500">Ing. Lucas Mateo Tabares F.</p>
           </div>
           <div className="text-right text-[10px] text-gray-400">
              <p>Generado con Evaluación BrocaRoya</p>
              <p>Desarrollado por Ing. Lucas Mateo Tabares F.</p>
           </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* API Key Input Modal */}
      {showKeyInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowKeyInput(false)}>
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-2xl border-2 border-purple-500/50" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-start mb-4">
                   <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2">
                       <Key className="text-purple-500" /> Configurar IA (Gratis)
                   </h3>
                   <button onClick={() => setShowKeyInput(false)}><X size={24} className="text-gray-400"/></button>
               </div>
               
               <div className="space-y-4">
                   <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-purple-100 dark:border-purple-800">
                      <p className="font-bold text-purple-700 dark:text-purple-300 mb-1">¿Cómo funciona?</p>
                      Para usar la inteligencia artificial de Gemini gratis, necesitas tu propia llave (API Key). Esta se guarda solo en tu celular.
                   </div>

                   <ol className="list-decimal pl-5 text-sm space-y-2 text-gray-600 dark:text-gray-400">
                      <li>Ve a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 underline font-bold inline-flex items-center gap-1">Google AI Studio <ExternalLink size={12}/></a></li>
                      <li>Inicia sesión con tu cuenta Google.</li>
                      <li>Presiona <strong>"Create API Key"</strong>.</li>
                      <li>Copia la llave y pégala aquí abajo.</li>
                   </ol>

                   <div>
                      <input 
                        type="password" 
                        className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                        placeholder="Pegar API Key aquí (AIzaSy...)"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                      />
                   </div>

                   <button 
                      onClick={saveKeyAndRetry}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all active:scale-95"
                   >
                      Guardar y Analizar
                   </button>
               </div>
           </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowAiModal(false)}>
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl border dark:border-gray-700" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4 border-b dark:border-gray-800 pb-2">
                   <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                       <BrainCircuit className="text-purple-600" /> Diagnóstico IA
                   </h3>
                   <button onClick={() => setShowAiModal(false)}><X size={24} className="text-gray-400"/></button>
               </div>
               
               <div className="min-h-[150px] max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 size={32} className="animate-spin text-purple-600 mb-2" />
                      <p className="text-sm text-gray-500 animate-pulse">Analizando datos del lote...</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                       {aiAnalysis ? (
                         <div className="prose dark:prose-invert text-sm">
                           <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                         </div>
                       ) : (
                         <p className="text-red-500 text-center">No se pudo obtener el análisis.</p>
                       )}
                    </div>
                  )}
               </div>

               <div className="mt-4 pt-3 border-t dark:border-gray-800">
                  <p className="text-[10px] text-gray-400 text-center mb-2">
                    * Este análisis es generado por IA y debe ser validado por un profesional.
                  </p>
                  
                  <div className="flex gap-2">
                     <button 
                         onClick={() => {
                            if (confirm('¿Borrar llave API guardada?')) {
                               removeApiKey();
                               setShowAiModal(false);
                            }
                         }}
                         className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                         title="Borrar API Key"
                     >
                        <Trash2 size={18} />
                     </button>
                     <button 
                         onClick={() => setShowAiModal(false)} 
                         className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 font-bold rounded-lg text-gray-700 dark:text-gray-200 text-sm"
                     >
                         Cerrar
                     </button>
                  </div>
               </div>
           </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowHistory(false)}>
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-lg dark:text-white">Histórico: {evaluation.nombreLote}</h3>
                   <button onClick={() => setShowHistory(false)}><X size={24} className="text-gray-400"/></button>
               </div>
               <SimpleTrendChart history={historyData} />
           </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl border dark:border-gray-700" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                       <DollarSign className="text-emerald-600" /> Calculadora Pérdidas
                   </h3>
                   <button onClick={() => setShowCalculator(false)}><X size={24} className="text-gray-400"/></button>
               </div>
               
               <div className="space-y-4 mb-6">
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Actual del Café</label>
                       <div className="flex gap-2">
                           <input 
                              type="number" 
                              className="flex-1 p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                              placeholder="0"
                              value={coffeePrice || ''}
                              onChange={e => setCoffeePrice(parseFloat(e.target.value))}
                           />
                           <select 
                             className="p-2 border rounded bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600 text-sm"
                             value={priceUnit}
                             onChange={(e:any) => setPriceUnit(e.target.value)}
                           >
                               <option value="kilo">Por Kilo</option>
                               <option value="carga">Por Carga (125kg)</option>
                           </select>
                       </div>
                   </div>
                   
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cosecha Estimada ({priceUnit})</label>
                       <input 
                          type="number" 
                          className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                          placeholder="Cantidad Total del Lote"
                          value={harvestEst || ''}
                          onChange={e => setHarvestEst(parseFloat(e.target.value))}
                       />
                   </div>

                   <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800 text-center">
                       <p className="text-xs text-red-600 dark:text-red-300 font-bold uppercase mb-1">Pérdida Estimada por Broca</p>
                       <p className="text-2xl font-black text-red-700 dark:text-red-400">
                           $ {estimatedLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </p>
                       <p className="text-[10px] text-gray-500 mt-1">
                           Calculado con {infestationPercent}% de infestación.
                       </p>
                   </div>
               </div>

               <button 
                  onClick={() => setShowCalculator(false)} 
                  className="w-full py-3 bg-gray-200 dark:bg-gray-700 font-bold rounded-lg text-gray-700 dark:text-gray-200"
               >
                   Cerrar
               </button>
           </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
};

export default Summary;