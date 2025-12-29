import React, { useState, useRef } from 'react';
import { ArrowLeft, BookText, Home, Plus, Search, User, MapPin, Save, Flag, Calculator, TrendingUp, DollarSign, Printer, Mail, Heart, Mic, Sun, AlertTriangle, Copyright, Calendar, Grid, CheckCircle2, FileDown, Shield, Download, Sprout, Loader2, BrainCircuit, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Props {
  onBack: () => void;
}

const SectionTitle: React.FC<{ icon: React.ElementType, title: string, level?: 2 | 3 }> = ({ icon: Icon, title, level = 2 }) => {
  const HeadingTag = `h${level}` as 'h2' | 'h3';
  return (
    <HeadingTag className={`font-bold ${level === 2 ? 'text-xl mt-6 mb-3 text-green-700 dark:text-green-400 border-b border-green-200 dark:border-green-800 pb-2' : 'text-lg mt-4 mb-2 text-gray-800 dark:text-gray-200'}`}>
      <div className="flex items-center gap-2">
        <Icon size={level === 2 ? 24 : 18} className={`${level === 2 ? 'text-green-600 dark:text-green-500' : 'text-gray-600 dark:text-gray-400'}`} />
        {title}
      </div>
    </HeadingTag>
  );
};

const FeatureListItem: React.FC<{ icon: React.ElementType, title: string, description: string | React.ReactNode }> = ({ icon: Icon, title, description }) => (
  <li className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
    <Icon size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
    <div>
      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h4>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</div>
    </div>
  </li>
);

const UserManual: React.FC<Props> = ({ onBack }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // 1. Create a clone of the content to capture the FULL height, ignoring scroll
      const originalElement = contentRef.current;
      const clone = originalElement.cloneNode(true) as HTMLElement;
      
      // Style the clone to be print-ready (Light mode forced, full width/height)
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = '800px'; // Fixed A4-like width for consistency
      clone.style.height = 'auto';
      clone.style.overflow = 'visible';
      clone.style.background = '#ffffff';
      clone.style.color = '#000000';
      clone.classList.remove('dark'); // Ensure no dark mode classes active
      
      // Force text colors in clone children
      const allText = clone.querySelectorAll('*');
      allText.forEach((el: any) => {
         el.classList.remove('dark:text-gray-100', 'dark:text-gray-300', 'dark:text-gray-400', 'dark:bg-gray-900', 'dark:bg-gray-800', 'dark:border-gray-700', 'dark:text-green-400', 'dark:bg-purple-900/10', 'dark:border-purple-800', 'dark:text-purple-300');
         if (el.tagName === 'P' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4' || el.tagName === 'LI' || el.tagName === 'TD' || el.tagName === 'TH' || el.tagName === 'STRONG') {
             el.style.color = '#000000';
         }
      });

      document.body.appendChild(clone);

      // 2. Capture the clone
      const canvas = await html2canvas(clone, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 800
      });

      // 3. Remove clone
      document.body.removeChild(clone);

      // 4. Generate PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Subsequent pages if content is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save('Manual_Evaluacion_BrocaRoya.pdf');
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Lo sentimos, no se pudo generar el PDF. Por favor, intente de nuevo.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-200 relative">
      <header className="bg-green-700 dark:bg-emerald-900 text-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex justify-between items-center shadow-md sticky top-0 z-10 print:hidden">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold hover:text-green-100">
          <ArrowLeft size={18} /> Atrás
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookText size={20} /> Manual de Usuario
        </h1>
        <div className="flex flex-col items-end">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-white/30 disabled:opacity-50"
          >
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />}
            <span>{isGeneratingPdf ? 'GENERANDO...' : 'DESCARGAR PDF'}</span>
          </button>
        </div>
      </header>

      {/* Manual Content Container */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto p-6 custom-scrollbar text-gray-900 dark:text-gray-100 pb-24 bg-white dark:bg-gray-900"
      >
        <div className="text-center mb-8 border-b-2 border-green-500 pb-6">
            <div className="flex justify-center mb-4">
               <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                  <Sprout size={48} className="text-green-600 dark:text-green-400" />
               </div>
            </div>
            <h1 className="text-3xl font-black text-green-800 dark:text-green-400 uppercase tracking-wide">Evaluación BrocaRoya</h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mt-2 font-medium uppercase tracking-widest">Manual Oficial de Usuario</p>
            
            <div className="mt-4 inline-block text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400"><strong className="text-gray-900 dark:text-white">Versión:</strong> 2.0 – Actualizado 2025</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1"><strong className="text-gray-900 dark:text-white">Autor:</strong> Ing. Lucas Mateo Tabares F.</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1"><strong className="text-gray-900 dark:text-white">Documento:</strong> Manual de Usuario</p>
            </div>
        </div>

        <section className="mb-6">
          <SectionTitle icon={BookText} title="Introducción" />
          <p className="text-sm leading-relaxed dark:text-gray-300 text-justify mb-2">
            Bienvenido a <strong>Evaluación BrocaRoya</strong>, la herramienta definitiva para el monitoreo fitosanitario en cultivos de café.
          </p>
          <p className="text-sm leading-relaxed dark:text-gray-300 text-justify mb-2">
            Esta aplicación está diseñada para operar sin conexión a internet, permitiendo a agrónomos y caficultores tomar decisiones basadas en datos precisos sobre:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 mb-2 space-y-1">
             <li>Niveles de infestación de Broca del café.</li>
             <li>Incidencia de Roya en sus cultivos.</li>
          </ul>
          <p className="text-sm leading-relaxed dark:text-gray-300 text-justify">
            Con Evaluación BrocaRoya, dispone de un sistema completo para evaluaciones de campo, análisis de datos y generación de reportes técnicos.
          </p>
        </section>

        <section className="mb-6">
          <SectionTitle icon={Home} title="1. Gestión de Lotes" />
          <p className="text-sm leading-relaxed dark:text-gray-300 mb-3">
            Administre todas sus evaluaciones desde la pantalla principal. Este módulo le permite crear, buscar y organizar sus registros de evaluación de forma intuitiva.
          </p>
          <ul className="space-y-3">
            <FeatureListItem
              icon={Plus}
              title="Crear Nueva Evaluación"
              description={
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                   <li>Botón flotante (+) ubicado en la pantalla principal.</li>
                   <li>Inicia un nuevo registro de campo.</li>
                   <li>Permite capturar datos de un lote específico.</li>
                </ul>
              }
            />
            <FeatureListItem
              icon={Search}
              title="Búsqueda Inteligente"
              description={
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                   <li>Encuentre rápidamente lotes por nombre o caficultor.</li>
                   <li>Función de filtrado en tiempo real.</li>
                   <li>Acceso ágil a sus registros históricos.</li>
                </ul>
              }
            />
            <FeatureListItem
              icon={AlertTriangle}
              title="Eliminación Segura"
              description={
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                   <li>Disponible deslizando o manteniendo presionado el ítem de la lista.</li>
                   <li>Protección para evitar eliminaciones accidentales.</li>
                </ul>
              }
            />
          </ul>
        </section>

        <section className="mb-6">
          <SectionTitle icon={Flag} title="2. Metodología de Muestreo" />
          <p className="text-sm leading-relaxed dark:text-gray-300 mb-3">
            El sistema está diseñado con rigor estadístico para garantizar representatividad y confiabilidad en sus evaluaciones.
          </p>
          <ul className="space-y-3">
            <FeatureListItem
              icon={CheckCircle2}
              title="Estándar de Evaluación"
              description={
                 <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>100 sitios (árboles) por lote evaluados.</li>
                    <li>Garantiza representatividad estadística.</li>
                    <li>Cumple estándares fitosanitarios internacionales.</li>
                 </ul>
              }
            />
            <FeatureListItem
              icon={Grid}
              title="Navegación Rápida"
              description={
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Use la grilla superior para saltar entre árboles específicos.</li>
                  <li>Visualizar cuáles árboles faltan por evaluar.</li>
                  <li>Monitorear el progreso del muestreo.</li>
                </ul>
              }
            />
            <FeatureListItem
              icon={Save}
              title="Autoguardado Automático"
              description={
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>No pierda sus datos: La aplicación guarda cada cambio automáticamente.</li>
                  <li>Protección contra pérdidas por cierres inesperados.</li>
                  <li>Sincronización en tiempo real de registros.</li>
                </ul>
              }
            />
            <FeatureListItem
              icon={Calculator}
              title="Relleno Estadístico Avanzado"
              description={
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Función avanzada para proyectar datos faltantes.</li>
                  <li>Basado en la desviación estándar de la muestra recolectada.</li>
                  <li>Uso recomendado: Estimaciones rápidas y análisis preliminares.</li>
                </ul>
              }
            />
          </ul>
        </section>

        <section className="mb-6">
          <SectionTitle icon={TrendingUp} title="3. Análisis y Reportes" />
          <p className="text-sm leading-relaxed dark:text-gray-300 mb-3">
            Obtenga diagnósticos instantáneos que le permitan tomar decisiones agrícolas informadas.
          </p>
          
          <div className="space-y-4">
             {/* Gemini AI */}
             <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                <h4 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-2">
                   <BrainCircuit size={18} /> Análisis IA con Gemini
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Una innovación en tecnología agrícola:</p>
                <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                   <li>Utiliza Inteligencia Artificial (Free Tier) integrada.</li>
                   <li>Genera recomendaciones agronómicas personalizadas.</li>
                   <li>Basadas en los datos específicos de su evaluación.</li>
                   <li>Proporciona interpretación automática de resultados.</li>
                </ul>
             </div>

             {/* Traffic Lights Table */}
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
                   <AlertCircle size={18} /> Sistema de Semáforos de Alerta
                </h4>
                <p className="text-xs text-gray-500 mb-3">Indicadores visuales claros para decisiones rápidas:</p>
                
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 mb-2">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase text-xs font-bold">
                         <tr>
                            <th className="px-4 py-2">Color</th>
                            <th className="px-4 py-2">Significado</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                         <tr className="bg-white dark:bg-gray-800">
                            <td className="px-4 py-2 font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full bg-green-500"></div> Verde
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300">Infestación bajo control</td>
                         </tr>
                         <tr className="bg-white dark:bg-gray-800">
                            <td className="px-4 py-2 font-bold text-amber-500 dark:text-amber-400 flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full bg-amber-500"></div> Amarillo
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300">Alerta - monitoreo intensivo recomendado</td>
                         </tr>
                         <tr className="bg-white dark:bg-gray-800">
                            <td className="px-4 py-2 font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full bg-red-600"></div> Rojo
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-300">Alerta crítica - acción inmediata requerida</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
                <p className="text-xs text-gray-500 italic">Table 1: Umbrales económicos de alerta. Estos umbrales están calibrados según umbrales económicos para café.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FeatureListItem
                  icon={Printer}
                  title="Generación de Reportes"
                  description={
                     <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li><strong>Informe PDF:</strong> Reporte técnico profesional listo para imprimir. Incluye gráficos y análisis de datos. Apto para presentar a cooperativas o asesores.</li>
                     </ul>
                  }
                />
                <FeatureListItem
                  icon={FileDown}
                  title="Exportación Excel"
                  description={
                     <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>Descargue la base de datos completa (.xlsx).</li>
                        <li>Formato compatible con análisis externo.</li>
                        <li>Facilita auditorías y análisis longitudinales.</li>
                     </ul>
                  }
                />
             </div>
          </div>
        </section>

        <section className="mb-6">
          <SectionTitle icon={Shield} title="4. Legal y Privacidad" />
          <div className="space-y-4">
             <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-1">Almacenamiento Offline First</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">Su información es suya y permanece bajo su control:</p>
                <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                   <li>Los datos se almacenan localmente en su dispositivo.</li>
                   <li>No usamos la nube para guardar sus registros de lotes.</li>
                   <li>Máximo control y privacidad de datos sensibles.</li>
                   <li>Acceso inmediato sin dependencia de conexión.</li>
                   <li>Cumplimiento de normativas de protección de datos.</li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-1">Derechos de Autor</h4>
                <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                   <li>Software registrado y protegido.</li>
                   <li>© 2025 Todos los derechos reservados.</li>
                   <li>Prohibida su distribución no autorizada.</li>
                   <li>Propiedad intelectual del desarrollador.</li>
                </ul>
             </div>
          </div>
        </section>

        <section className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
           <h3 className="font-bold text-gray-900 dark:text-white mb-2">Contacto y Soporte</h3>
           <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Para consultas técnicas, mejoras sugeridas o reportes de problemas, contacte al equipo de desarrollo.
           </p>
           <a href="mailto:mateotabares7@gmail.com" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
              <Mail size={14} /> mateotabares7@gmail.com
           </a>
        </section>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-[10px] text-gray-400 uppercase tracking-widest">
           <p>Documento generado automáticamente por Evaluación BrocaRoya</p>
           <p>© 2025 Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default UserManual;