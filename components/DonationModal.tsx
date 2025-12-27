import React, { useState } from 'react';
import { X, Heart, Loader2, CheckCircle2, Award, Shield } from 'lucide-react';
import { PRODUCTS, purchaseProduct } from '../services/billing';

interface Props {
  onClose: () => void;
}

const DonationModal: React.FC<Props> = ({ onClose }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePurchase = async (productId: string) => {
    setLoadingId(productId);
    try {
      const result = await purchaseProduct(productId);
      if (result) {
        setSuccess(true);
      }
    } catch (error) {
      console.error("Purchase failed", error);
    } finally {
      setLoadingId(null);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-green-500/30 transform scale-100 animate-in zoom-in-95 duration-200">
           <div className="bg-green-100 dark:bg-green-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
           </div>
           <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">¡Contribución Recibida!</h3>
           <p className="text-gray-600 dark:text-gray-300 mb-6">
             Gracias por contribuir a la sostenibilidad y mejora continua de esta herramienta técnica.
           </p>
           <button 
             onClick={onClose}
             className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
           >
             Continuar
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white flex justify-between items-center relative overflow-hidden border-b border-gray-700">
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-gray-700 p-2 rounded-full">
              <Award className="text-amber-400" size={24} />
            </div>
            <div>
               <h3 className="font-bold text-lg leading-tight">Sostenibilidad del Software</h3>
               <p className="text-[10px] text-gray-300 opacity-90">Contribución al desarrollo técnico</p>
            </div>
          </div>
          <button onClick={onClose} className="relative z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-950">
           <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-justify leading-relaxed">
             <strong>Evaluación de Broca y Roya</strong> es una herramienta desarrollada para potenciar la eficiencia del profesional del campo. Si esta aplicación aporta valor a su gestión técnica, considere realizar un aporte voluntario para garantizar el mantenimiento de los servidores, actualizaciones de seguridad y nuevas funciones.
           </p>

           <div className="space-y-3">
             {PRODUCTS.map((product) => (
               <button
                 key={product.id}
                 onClick={() => handlePurchase(product.id)}
                 disabled={loadingId !== null}
                 className={`w-full group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                   ${product.recommended 
                      ? 'bg-white dark:bg-gray-800 border-green-500 dark:border-green-600 shadow-md ring-1 ring-green-500/20' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                   }
                   ${loadingId !== null && loadingId !== product.id ? 'opacity-50' : 'opacity-100'}
                 `}
               >
                 {product.recommended && (
                   <div className="absolute -top-2.5 right-4 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wider">
                     RECOMENDADO
                   </div>
                 )}

                 <div className="text-3xl filter drop-shadow-sm">
                    {product.icon}
                 </div>
                 
                 <div className="flex-1">
                   <h4 className="font-bold text-gray-900 dark:text-white flex justify-between items-center text-sm">
                     {product.title}
                     <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded font-bold border border-gray-200 dark:border-gray-600">
                        {product.price}
                     </span>
                   </h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                     {product.description}
                   </p>
                 </div>

                 {loadingId === product.id && (
                   <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center rounded-xl">
                      <Loader2 className="animate-spin text-green-600" size={24} />
                   </div>
                 )}
               </button>
             ))}
           </div>
           
           <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400">
             <Shield size={10} />
             <span>Transacción segura vía Google Play Store</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;