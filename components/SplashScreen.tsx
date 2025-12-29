import React, { useState } from 'react';
import { Shield, Smartphone, FileText, Check, UserCheck, BarChart3, Sprout, Leaf, ClipboardCheck, ChevronRight, Briefcase, Mail, Lock, Copyright } from 'lucide-react';

interface Props {
  onFinish: () => void;
}

const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 to-green-950 flex flex-col items-center justify-between text-white p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center overflow-hidden overflow-y-auto custom-scrollbar">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md relative z-10 pt-4 pb-2">
        
        {/* App Header */}
        <div className="flex flex-col items-center mb-4">
          <div className="bg-white/10 p-3 rounded-2xl mb-2 backdrop-blur-md border border-white/20 shadow-xl ring-1 ring-green-500/30">
             <Smartphone size={28} className="text-green-400 drop-shadow-md" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Evaluación BrocaRoya
          </h1>
          <p className="text-gray-400 text-[10px] font-medium tracking-widest uppercase">
            Herramienta Técnica de Campo
          </p>
        </div>

        {/* PROFESSIONAL CARD */}
        <div className="w-full bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden mb-4">
          
          {/* Header Card */}
          <div className="p-4 border-b border-gray-700 bg-black/20 relative">
             <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-green-500 to-green-700 p-0.5 rounded-full shadow-lg">
                   <div className="bg-gray-900 p-2 rounded-full">
                      <UserCheck size={24} className="text-green-400" />
                   </div>
                </div>
                <div className="text-left flex-1">
                   <h2 className="text-base font-bold text-white leading-tight">Lucas Mateo Tabares F.</h2>
                   <div className="flex flex-wrap gap-1 mt-1">
                      <span className="bg-green-500/20 text-green-300 text-[9px] px-2 py-0.5 rounded border border-green-500/30 font-bold uppercase">Ingeniero Agrónomo</span>
                      <span className="bg-blue-500/20 text-blue-300 text-[9px] px-2 py-0.5 rounded border border-blue-500/30 font-bold uppercase">Desarrollador</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Services Grid */}
          <div className="p-4">
            <h3 className="text-left text-[10px] font-bold text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <Briefcase size={12} className="text-amber-400" />
              Servicios Profesionales
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
               <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 flex flex-col items-center text-center gap-1 hover:bg-gray-750 transition-colors">
                  <Sprout size={16} className="text-green-400" />
                  <span className="text-[9px] font-medium text-gray-200 leading-tight">Nutrición<br/>Vegetal</span>
               </div>
               <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 flex flex-col items-center text-center gap-1 hover:bg-gray-750 transition-colors">
                  <Leaf size={16} className="text-emerald-400" />
                  <span className="text-[9px] font-medium text-gray-200 leading-tight">Estrategias<br/>Sostenibilidad</span>
               </div>
               <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 flex flex-col items-center text-center gap-1 hover:bg-gray-750 transition-colors">
                  <ClipboardCheck size={16} className="text-blue-400" />
                  <span className="text-[9px] font-medium text-gray-200 leading-tight">Planificación<br/>Proyectos</span>
               </div>
               <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 flex flex-col items-center text-center gap-1 hover:bg-gray-750 transition-colors">
                  <BarChart3 size={16} className="text-indigo-400" />
                  <span className="text-[9px] font-medium text-gray-200 leading-tight">Análisis<br/>Empresarial</span>
               </div>
            </div>

            <a 
              href="mailto:mateotabares7@gmail.com?subject=Solicitud%20Asesoría%20Profesional"
              className="group flex items-center justify-center gap-2 w-full bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-all shadow-lg active:scale-[0.98] border-t border-blue-500"
            >
              <Mail size={14} />
              <span>Contactar / Solicitar Asesoría</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer / Legal / Main Action */}
      <div className="w-full max-w-sm space-y-3 mb-2 relative z-10 flex-shrink-0">
        
        {/* Visible Legal Disclaimer */}
        <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-gray-800 text-left">
           <div className="flex items-start gap-2">
              <Lock size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-gray-300 leading-relaxed">
                 <strong className="text-white">Privacidad y Seguridad:</strong> Esta aplicación opera <strong>100% Offline</strong>. Sus datos permanecen exclusivamente en su dispositivo. Cumplimos con la Ley de Habeas Data y políticas de Google Play.
              </p>
           </div>
           <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-700/50">
              <Copyright size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[9px] text-gray-400 leading-relaxed">
                 Software protegido por Derechos de Autor. Prohibida su copia, ingeniería inversa o distribución no autorizada.
              </p>
           </div>
        </div>

        <button
          onClick={onFinish}
          className="w-full bg-green-500 hover:bg-green-400 text-green-950 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
        >
          <span>INGRESAR A LA APP</span> <Check size={24} strokeWidth={3} />
        </button>

        <button 
          onClick={() => setShowPrivacy(true)}
          className="text-[10px] text-gray-500 underline flex items-center justify-center gap-1 w-full hover:text-white transition-colors py-1"
        >
          <Shield size={10} /> Leer Política de Privacidad Completa
        </button>
        
        <p className="text-[9px] text-gray-600 font-mono">© 2025 Ing. Lucas Mateo Tabares F.</p>
      </div>

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="absolute inset-0 z-60 bg-black/95 backdrop-blur-xl p-4 flex items-center justify-center animate-fade-in pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="bg-gray-900 border border-gray-700 text-gray-100 p-5 rounded-2xl w-full max-w-md h-[90vh] flex flex-col shadow-2xl relative">
            <div className="flex-shrink-0 border-b border-gray-800 pb-3 mb-2">
                <h2 className="font-bold text-lg flex items-center gap-2 text-green-400">
                <FileText size={20} /> Términos y Privacidad
                </h2>
                <p className="text-[10px] text-gray-500">Actualizado: Enero 2025</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 text-xs space-y-5 text-gray-300 text-justify custom-scrollbar">
              
              <section>
                <h3 className="font-bold text-white text-sm mb-1 text-green-400">1. Almacenamiento Local (Offline First)</h3>
                <p>
                  Esta aplicación está diseñada bajo el principio de privacidad por diseño. <strong>NO recopilamos, transmitimos ni almacenamos sus datos en servidores externos.</strong> Toda la información agronómica, nombres de lotes y caficultores reside única y exclusivamente en la base de datos interna de su dispositivo móvil.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-white text-sm mb-1 text-green-400">2. Cumplimiento Google Play</h3>
                <p>
                  En conformidad con las Políticas de Datos de Usuario de Google Play:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-gray-400 mt-1">
                   <li>La aplicación no solicita permisos sensibles de ubicación en segundo plano.</li>
                   <li>No se accede a la lista de contactos ni al micrófono.</li>
                   <li>El permiso de almacenamiento se solicita únicamente en el momento explícito de exportar el reporte Excel generado por el usuario.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-white text-sm mb-1 text-green-400">3. Habeas Data (Colombia)</h3>
                <p>
                  En cumplimiento de la <strong>Ley 1581 de 2012</strong> y el Decreto 1377 de 2013:
                  Al no existir una base de datos centralizada gestionada por el Desarrollador, usted (el usuario) actúa como el único Responsable del Tratamiento de los datos ingresados en su dispositivo. El ejercicio de derechos de supresión o rectificación se realiza directamente a través de las herramientas de edición y eliminación provistas dentro de la aplicación.
                </p>
              </section>

              <section className="bg-red-900/20 p-3 rounded border border-red-900/50">
                <h3 className="font-bold text-red-400 text-sm mb-1 flex items-center gap-1"><Copyright size={12}/> Propiedad Intelectual y Anti-Piratería</h3>
                <p>
                  El código fuente, diseño gráfico, logotipos y lógica de negocio de "Evaluación BrocaRoya" son propiedad intelectual exclusiva de <strong>Lucas Mateo Tabares Franco</strong>, protegidos por la Ley 23 de 1982 sobre Derechos de Autor.
                </p>
                <p className="mt-2 font-bold text-white">Queda estrictamente prohibido:</p>
                <ul className="list-disc pl-4 space-y-1 text-gray-400 mt-1">
                   <li>La ingeniería inversa, descompilación o desensamblaje del software.</li>
                   <li>La distribución no autorizada de copias o modificaciones (APKs modificados).</li>
                   <li>El uso de la marca o identidad visual para fines comerciales sin autorización escrita.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-white text-sm mb-1 text-green-400">5. Exención de Responsabilidad</h3>
                <p>
                  Esta herramienta facilita la captura de datos y cálculos matemáticos. La interpretación técnica de los resultados y las decisiones de manejo agronómico son responsabilidad exclusiva del profesional usuario. El desarrollador no se hace responsable por decisiones tomadas basadas en los datos ingresados.
                </p>
              </section>

              <section className="bg-gray-800 p-3 rounded border border-gray-700">
                <h3 className="font-bold text-green-400 text-sm mb-1">Contacto Legal y Soporte</h3>
                <p>
                  Para notificaciones legales o soporte técnico:
                </p>
                <p className="font-mono text-white mt-1 select-all font-bold">Ing. Lucas Mateo Tabares Franco</p>
                <a href="mailto:mateotabares7@gmail.com" className="text-blue-300 underline">mateotabares7@gmail.com</a>
              </section>
            </div>

            <div className="flex-shrink-0 pt-4 mt-2 border-t border-gray-800">
                <button 
                onClick={() => setShowPrivacy(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors text-sm"
                >
                He leído y acepto los términos
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;