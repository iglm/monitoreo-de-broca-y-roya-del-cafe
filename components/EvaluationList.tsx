import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit, Calendar, Moon, Sun, Info, X, AlertTriangle } from 'lucide-react';
import { Evaluation } from '../types';

interface Props {
  evaluations: Evaluation[];
  onNew: () => void;
  onSelect: (evalData: Evaluation) => void;
  onDelete: (id: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const EvaluationList: React.FC<Props> = ({ evaluations, onNew, onSelect, onDelete, toggleTheme, isDark }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filtered = evaluations.filter(
    (e) =>
      e.nombreLote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.caficultor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort by last modified (newest first)
  const sorted = [...filtered].sort((a, b) => b.lastModified - a.lastModified);

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 transition-colors duration-200 relative">
      {/* pt-[env(safe-area-inset-top)] ensures content isn't hidden behind the notch on iOS/Android */}
      <header className="bg-green-700 dark:bg-emerald-900 text-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-md sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Evaluaciones</h1>
          <div className="flex gap-2">
            <button 
               onClick={() => setShowInfo(true)}
               className="p-2 bg-green-600 dark:bg-emerald-800 rounded-full hover:bg-green-500 transition-colors"
             >
               <Info size={20} />
             </button>
            <button 
              onClick={toggleTheme}
              className="p-2 bg-green-600 dark:bg-emerald-800 rounded-full hover:bg-green-500 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Buscar lote o caficultor..."
            className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-400 outline-none placeholder-gray-400 dark:placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {sorted.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
            <p className="text-lg">No hay evaluaciones encontradas.</p>
            <p className="text-sm mt-2">Presiona el botón + para iniciar.</p>
          </div>
        ) : (
          sorted.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 active:bg-green-50 dark:active:bg-slate-700 transition-colors relative group"
            >
              <div className="flex justify-between items-start">
                <div onClick={() => onSelect(item)} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{item.nombreLote || 'Sin Nombre'}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                        item.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-emerald-900 dark:text-emerald-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {item.status === 'completed' ? 'Completo' : 'En Progreso'}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Calendar size={14} />
                    <span className="text-sm font-medium">{item.fechaVisita}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 font-medium">{item.caficultor || 'Caficultor no registrado'}</p>
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(item.id);
                  }}
                  className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors z-10"
                  aria-label="Eliminar evaluación"
                >
                  <Trash2 size={22} />
                </button>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                   onClick={() => onSelect(item)}
                   className="flex items-center gap-1 text-green-700 dark:text-emerald-300 font-bold px-3 py-1.5 bg-green-50 dark:bg-emerald-900/40 rounded hover:bg-green-100 dark:hover:bg-emerald-900/60"
                >
                  <Edit size={16} />
                  {item.status === 'completed' ? 'Ver / Exportar' : 'Continuar'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onNew}
        className="fixed bottom-6 right-6 mb-[env(safe-area-inset-bottom)] bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-emerald-800 transition-transform active:scale-95 z-20"
      >
        <Plus size={32} />
      </button>
      
      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={() => setItemToDelete(null)}>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl border dark:border-gray-700 transform scale-100" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h3 className="font-black text-xl text-center text-gray-900 dark:text-white mb-2">¿Eliminar Evaluación?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-6">
                 Esta acción no se puede deshacer. Se borrarán todos los datos de este lote permanentemente.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => setItemToDelete(null)}
                    className="py-3 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-colors"
                 >
                    Cancelar
                 </button>
                 <button 
                    onClick={handleDeleteConfirm}
                    className="py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                 >
                    Sí, Eliminar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Small Info Modal for Contact */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowInfo(false)}>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl border dark:border-gray-700" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg dark:text-white mb-2">Contacto Profesional</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                 Ing. Lucas Mateo Tabares Franco<br/>
                 <span className="text-xs opacity-70">Desarrollador & Consultor Agrícola</span>
              </p>
              <a 
                 href="mailto:mateotabares7@gmail.com" 
                 className="block w-full py-3 bg-blue-600 text-white font-bold text-center rounded-xl"
              >
                 Enviar Correo
              </a>
              <button onClick={() => setShowInfo(false)} className="block w-full py-3 mt-2 text-gray-500 font-bold text-sm">Cerrar</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationList;