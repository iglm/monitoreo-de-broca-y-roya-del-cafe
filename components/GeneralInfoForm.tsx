import React, { useState } from 'react';
import { Evaluation } from '../types';
import { Save, ArrowRight, MapPin, Loader2, Check } from 'lucide-react';

interface Props {
  data: Evaluation;
  onChange: (data: Evaluation) => void;
  onNext: () => void;
  onBack: () => void;
}

const InputField = ({ label, value, onChange, type = "text", required = false }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
      {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-3 border rounded-lg text-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
        !value && required 
          ? 'border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
          : 'border-gray-300 dark:border-slate-600 focus:border-green-500 dark:focus:border-emerald-400'
      } focus:ring-2 focus:ring-green-200 dark:focus:ring-emerald-900 outline-none transition-colors`}
    />
  </div>
);

const GeneralInfoForm: React.FC<Props> = ({ data, onChange, onNext, onBack }) => {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const updateField = (field: keyof Evaluation, value: any) => {
    onChange({
      ...data,
      [field]: value,
      lastModified: Date.now(),
    });
  };

  const handleCaptureGPS = () => {
    setGpsLoading(true);
    setGpsError(null);
    
    if (!navigator.geolocation) {
      setGpsError("GPS no soportado");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField('location', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setGpsLoading(false);
      },
      (error) => {
        console.error(error);
        setGpsError("Error al obtener ubicación. Verifique permisos.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-200">
      <header className="bg-green-700 dark:bg-emerald-900 text-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex justify-between items-center shadow sticky top-0 z-10">
        <button onClick={onBack} className="text-sm font-semibold underline hover:text-green-100">Cancelar</button>
        <h1 className="text-xl font-bold">Datos del Lote</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg mb-6 border border-blue-100 dark:border-slate-700">
          <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
            Complete la información general antes de iniciar.
            Los campos con borde naranja son obligatorios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <InputField label="Nombre del Lote" value={data.nombreLote} onChange={(v: string) => updateField('nombreLote', v)} required />
          <InputField label="Caficultor" value={data.caficultor} onChange={(v: string) => updateField('caficultor', v)} required />
          
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Ubicación (GPS)
            </label>
            {data.location ? (
               <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                    <Check size={18} className="text-green-600 dark:text-green-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-green-800 dark:text-green-300">Coordenadas Capturadas</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400">
                      Lat: {data.location.lat.toFixed(5)}, Lng: {data.location.lng.toFixed(5)}
                      <br/>(Precisión: {Math.round(data.location.accuracy)}m)
                    </p>
                  </div>
                  <button onClick={handleCaptureGPS} className="text-xs text-blue-600 underline p-2">Actualizar</button>
               </div>
            ) : (
              <button 
                onClick={handleCaptureGPS}
                disabled={gpsLoading}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {gpsLoading ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                <span>{gpsLoading ? "Obteniendo Satélites..." : "Capturar Ubicación Actual"}</span>
              </button>
            )}
            {gpsError && <p className="text-xs text-red-500 mt-1">{gpsError}</p>}
          </div>

          <InputField label="Fecha Visita" type="date" value={data.fechaVisita} onChange={(v: string) => updateField('fechaVisita', v)} required />
          
          <InputField label="Variedad" value={data.variedad} onChange={(v: string) => updateField('variedad', v)} />
          <InputField label="Tipo Renovación" value={data.tipoRenovacion} onChange={(v: string) => updateField('tipoRenovacion', v)} />
          
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Área (Has)" type="number" value={data.areaLote || ''} onChange={(v: string) => updateField('areaLote', parseFloat(v))} />
            <InputField label="Edad (Años)" type="number" value={data.edadAnios || ''} onChange={(v: string) => updateField('edadAnios', parseInt(v))} />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <InputField label="Densidad (Arb/Ha)" type="number" value={data.densidad || ''} onChange={(v: string) => updateField('densidad', parseInt(v))} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button
          onClick={onNext}
          disabled={!data.nombreLote}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-bold shadow-lg transition-all ${
            data.nombreLote 
              ? 'bg-green-600 dark:bg-emerald-600 text-white hover:bg-green-700 dark:hover:bg-emerald-500 active:scale-95' 
              : 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <Save size={20} />
          <span>Iniciar Evaluación</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default GeneralInfoForm;