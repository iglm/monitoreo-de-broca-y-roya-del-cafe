import React, { useEffect, useRef, useState } from 'react';
import { Evaluation, TreeRecord } from '../types';
import { DEFICIENCY_OPTIONS } from '../constants';
import { ChevronLeft, ChevronRight, CheckCircle2, Moon, Sun, Flag, X, Grid, Wand2, Calculator, Sigma } from 'lucide-react';

interface Props {
  evaluation: Evaluation;
  onUpdateTree: (treeId: number, data: Partial<TreeRecord>) => void;
  onNavigate: (newIndex: number) => void;
  onFinish: (finalTrees?: TreeRecord[]) => void;
  onBack: () => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const InputField = ({ label, value, onChange, type = "number", max = 9999 }: any) => (
  <div className="flex flex-col">
    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">{label}</label>
    <input
      type={type}
      min="0"
      max={max}
      inputMode="numeric"
      value={value === 0 ? '' : value}
      placeholder="0"
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        let val = parseInt(e.target.value);
        
        // Handle empty input or NaN
        if (isNaN(val)) val = 0;
        
        // Enforce boundaries
        if (val < 0) val = 0;
        if (max !== undefined && val > max) val = max;
        
        onChange(val);
      }}
      className="w-full p-3 border rounded-lg text-xl font-bold text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900 outline-none transition-all"
    />
  </div>
);

// --- STATISTICAL HELPERS ---

// Box-Muller transform to generate normally distributed random numbers
const randomNormal = (mean: number, stdDev: number): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); 
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + (z * stdDev);
};

// Calculate mean and standard deviation of an array
const getStats = (numbers: number[]) => {
  if (numbers.length === 0) return { mean: 0, std: 0 };
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
  return { mean, std: Math.sqrt(variance) };
};

// Pick a random item from array based on frequency/probability in source
const pickWeightedRandom = (sourceArray: number[]): number => {
  if (sourceArray.length === 0) return 0;
  const randomIndex = Math.floor(Math.random() * sourceArray.length);
  return sourceArray[randomIndex];
};

// ---------------------------

const TreeEvaluation: React.FC<Props> = ({ evaluation, onUpdateTree, onNavigate, onFinish, onBack, toggleTheme, isDark }) => {
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
  const currentTree = evaluation.trees[evaluation.currentTreeIndex];
  const totalTrees = evaluation.trees.length;
  // Calculate real progress based on touched trees or data presence
  const validTreesCount = evaluation.trees.filter(t => t.touched || t.fa > 0 || t.nh > 0).length;
  const progress = Math.round((validTreesCount / totalTrees) * 100);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [evaluation.currentTreeIndex]);

  // Mark tree as touched when updating
  const update = (field: keyof TreeRecord, value: any) => {
    onUpdateTree(currentTree.id, { [field]: value, touched: true });
  };
  
  const handleNext = () => {
    // Ensure current tree is marked touched when moving forward
    if (!currentTree.touched) {
       onUpdateTree(currentTree.id, { touched: true });
    }

    if (evaluation.currentTreeIndex < totalTrees - 1) {
      onNavigate(evaluation.currentTreeIndex + 1);
    } else {
      setShowFinishModal(true);
    }
  };

  const handlePrev = () => {
    if (evaluation.currentTreeIndex > 0) {
      onNavigate(evaluation.currentTreeIndex - 1);
    } else {
      onBack();
    }
  };

  const handleStatisticalProjection = () => {
    // 1. Get the source population (only trees with data)
    const sourceTrees = evaluation.trees.filter(t => t.touched || t.fa > 0 || t.nh > 0);
    
    if (sourceTrees.length < 2) {
        alert("Se necesitan al menos 2 árboles evaluados para calcular estadísticas.");
        return; 
    }

    // 2. Analyze Distributions of EACH COLUMN Independently
    const statsFA = getStats(sourceTrees.map(t => t.fa));
    const statsFBA = getStats(sourceTrees.map(t => t.fba));
    
    const statsFS = getStats(sourceTrees.map(t => t.fs));
    const statsFBS = getStats(sourceTrees.map(t => t.fbs));
    
    const statsNH = getStats(sourceTrees.map(t => t.nh));
    const statsHR = getStats(sourceTrees.map(t => t.hr));

    // Categorical/Discrete variables: Keep raw array for weighted picking
    const sourceGrados = sourceTrees.map(t => t.grado);
    const sourceDeficiencias = sourceTrees.map(t => t.deficiencia);

    // 3. Generate Data for Missing Trees
    const newTrees = [...evaluation.trees];

    for (let i = 0; i < newTrees.length; i++) {
        const tree = newTrees[i];
        
        // Only fill if empty/untouched
        if (!tree.touched && tree.fa === 0 && tree.nh === 0) {
            
            // A. Generate Totals using Normal Distribution (Gaussian) based strictly on OWN column stats
            const newFA = Math.round(Math.max(0, randomNormal(statsFA.mean, statsFA.std)));
            
            // Generate Broca Arbol independently, but clamp to logical limit (can't have more broca than fruits)
            let newFBA = Math.round(Math.max(0, randomNormal(statsFBA.mean, statsFBA.std)));
            if (newFBA > newFA) newFBA = newFA;

            const newFS = Math.round(Math.max(0, randomNormal(statsFS.mean, statsFS.std)));
            
            // Generate Broca Suelo independently
            let newFBS = Math.round(Math.max(0, randomNormal(statsFBS.mean, statsFBS.std)));
            if (newFBS > newFS) newFBS = newFS;

            const newNH = Math.round(Math.max(0, randomNormal(statsNH.mean, statsNH.std)));
            
            // Generate Roya independently
            let newHR = Math.round(Math.max(0, randomNormal(statsHR.mean, statsHR.std)));
            if (newHR > newNH) newHR = newNH;

            // B. Pick Categorical values based on frequency in sample
            const newGrado = pickWeightedRandom(sourceGrados);
            const newDeficiencia = pickWeightedRandom(sourceDeficiencias);

            newTrees[i] = {
                id: tree.id,
                fa: newFA,
                fba: newFBA,
                fs: newFS,
                fbs: newFBS,
                nh: newNH,
                hr: newHR,
                grado: newGrado,
                deficiencia: newDeficiencia,
                touched: true // Mark as filled
            };
        }
    }

    // 4. Finish with the statistically generated data
    onFinish(newTrees);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-950 transition-colors duration-200 relative">
      {/* Header with Safe Area Padding */}
      <div className="bg-gray-800 dark:bg-black shadow-sm z-20 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between p-2 px-4 text-white">
          <button onClick={onBack} className="text-gray-300 text-sm font-bold p-2 hover:text-white">Salir</button>
          
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setShowGrid(true)}
               className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg border border-gray-600 active:bg-gray-500 transition-colors"
             >
                <Grid size={16} className="text-gray-300" />
                <span className="font-bold text-sm">Árbol {currentTree.id}</span>
             </button>

             <button onClick={toggleTheme} className="text-gray-300 p-1.5 hover:text-white transition-colors">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>

          <button 
            type="button"
            onClick={() => setShowFinishModal(true)}
            className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-green-600 transition-all active:scale-95"
          >
            <Flag size={14} fill="currentColor" /> FINALIZAR
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100">Evaluación</h2>
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-green-600 dark:bg-green-500 h-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
        
        {/* Section 1: Frutos */}
        <section className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-800">
          <h3 className="text-green-800 dark:text-green-400 font-bold border-b border-green-100 dark:border-gray-700 pb-2 mb-3 flex items-center gap-2">
            <span className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 px-2 py-0.5 rounded text-sm">1</span> Conteo de Frutos
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
             <InputField label="# FA (Frutos Arbol)" value={currentTree.fa} onChange={(v: number) => update('fa', v)} max={300} />
             <InputField label="# FBA (Broca Arbol)" value={currentTree.fba} onChange={(v: number) => update('fba', v)} max={300} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <InputField label="# FS (Frutos Suelo)" value={currentTree.fs} onChange={(v: number) => update('fs', v)} max={300} />
             <InputField label="# FBS (Broca Suelo)" value={currentTree.fbs} onChange={(v: number) => update('fbs', v)} max={300} />
          </div>
        </section>

        {/* Section 2: Hojas & Roya */}
        <section className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-800">
          <h3 className="text-green-800 dark:text-green-400 font-bold border-b border-green-100 dark:border-gray-700 pb-2 mb-3 flex items-center gap-2">
            <span className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 px-2 py-0.5 rounded text-sm">2</span> Hojas y Roya
          </h3>
          <div className="mb-4">
             <InputField label="NH (Total Hojas)" value={currentTree.nh} onChange={(v: number) => update('nh', v)} max={50} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <InputField label="HR (Hojas Roya)" value={currentTree.hr} onChange={(v: number) => update('hr', v)} max={50} />
             <div className="flex flex-col">
               <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Grado (0-9)</label>
               <select 
                  className="w-full p-3 border rounded-lg text-xl font-bold text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 outline-none"
                  value={currentTree.grado}
                  onChange={(e) => update('grado', parseInt(e.target.value))}
               >
                 {[0,1,2,3,4,5,6,7,8,9].map(g => (
                   <option key={g} value={g}>{g}</option>
                 ))}
               </select>
             </div>
          </div>
        </section>

        {/* Section 3: Deficiencia */}
        <section className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-800">
           <h3 className="text-green-800 dark:text-green-400 font-bold border-b border-green-100 dark:border-gray-700 pb-2 mb-3 flex items-center gap-2">
            <span className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 px-2 py-0.5 rounded text-sm">3</span> Deficiencia Nutricional
          </h3>
          <select 
             className="w-full p-3 border rounded-lg text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 outline-none"
             value={currentTree.deficiencia}
             onChange={(e) => update('deficiencia', parseInt(e.target.value))}
          >
            {DEFICIENCY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </section>

      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex gap-4 z-30">
        <button 
          onClick={handlePrev}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:bg-gray-300 dark:active:bg-gray-700 transition-colors"
        >
          <ChevronLeft /> Anterior
        </button>
        <button 
           onClick={handleNext}
           className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white shadow-lg active:scale-[0.98] transition-all"
        >
          {evaluation.currentTreeIndex === totalTrees - 1 ? (
             <>Finalizar <CheckCircle2 /></>
          ) : (
             <>Guardar y Sig. <ChevronRight /></>
          )}
        </button>
      </div>

      {/* GRID Modal */}
      {showGrid && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in pt-[env(safe-area-inset-top)]">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm h-[80vh] flex flex-col shadow-2xl">
               <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
                  <h3 className="font-bold text-lg dark:text-white">Navegar a Árbol</h3>
                  <button onClick={() => setShowGrid(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                     <X size={20} className="text-gray-500" />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-5 gap-2">
                     {evaluation.trees.map((tree, idx) => {
                        // Determine status
                        const isCurrent = idx === evaluation.currentTreeIndex;
                        // Evaluated if touched flag is true OR has data (backward compatibility)
                        const hasData = tree.fa > 0 || tree.fs > 0 || tree.nh > 0;
                        const isEvaluated = tree.touched || hasData;
                        
                        return (
                           <button
                              key={tree.id}
                              onClick={() => {
                                 onNavigate(idx);
                                 setShowGrid(false);
                              }}
                              className={`
                                 h-12 rounded-lg font-bold text-sm border-2 transition-all
                                 ${isCurrent 
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' 
                                    : isEvaluated 
                                       ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                                       : 'border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                                 }
                              `}
                           >
                              {tree.id}
                           </button>
                        )
                     })}
                  </div>
               </div>
               <div className="p-4 border-t dark:border-gray-800 flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-200 border-2 border-gray-300 rounded"></div> Pendiente</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded"></div> Evaluado</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded"></div> Actual</div>
               </div>
            </div>
         </div>
      )}

      {/* Custom Finish Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-700 transform scale-100">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full">
                    <Flag className="text-green-600 dark:text-green-400" size={24} />
                 </div>
                 <button onClick={() => setShowFinishModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={24} />
                 </button>
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                ¿Finalizar Evaluación?
              </h3>

              {validTreesCount < totalTrees && validTreesCount > 0 ? (
                <div className="mb-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800 mb-3">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <Calculator size={16} />
                            Faltan {totalTrees - validTreesCount} árboles por evaluar.
                        </p>
                    </div>
                    
                    <button
                        onClick={handleStatisticalProjection}
                        className="w-full flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors group mb-3"
                    >
                        <span className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
                            <Sigma size={18} /> Relleno Estadístico (Columnas Independientes)
                        </span>
                        <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-medium mt-1 text-center px-2">
                            Genera datos nuevos calculando promedio y desviación estándar de cada columna por separado.
                        </span>
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center">O</p>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                    Se guardará el progreso actual (<strong>{progress}%</strong>) y se generará el informe final. Podrá revisar los datos antes de exportar.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mt-3">
                 <button 
                   onClick={() => setShowFinishModal(false)}
                   className="py-3 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={() => {
                     setShowFinishModal(false);
                     onFinish(); // Standard finish (leaves remaining blank)
                   }}
                   className="py-3 px-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20"
                 >
                   {validTreesCount < totalTrees ? 'Guardar Parcial' : 'Confirmar'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TreeEvaluation;