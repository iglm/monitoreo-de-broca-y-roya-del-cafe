import { GoogleGenAI } from "@google/genai";
import { Evaluation } from "../types";

const STORAGE_KEY_API = 'gemini_api_key_v1';

export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_API) || (process.env.API_KEY as string) || null;
};

export const saveApiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY_API, key.trim());
};

export const removeApiKey = () => {
  localStorage.removeItem(STORAGE_KEY_API);
};

/**
 * Uses Gemini 2.5 Flash (optimized for speed/cost) to analyze the phytosanitary data.
 */
export const generateAgronomicAnalysis = async (evaluation: Evaluation, stats: any) => {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    throw new Error("MISSING_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Actúa como un Ingeniero Agrónomo experto en café. Analiza los siguientes datos recolectados en campo de la app "Evaluación BrocaRoya":
    
    DATOS DEL LOTE:
    - Nombre: ${evaluation.nombreLote}
    - Variedad: ${evaluation.variedad || 'No especificada'}
    - Edad: ${evaluation.edadAnios || 'No especificada'} años
    - Densidad: ${evaluation.densidad || 'No especificada'} arb/ha
    
    RESULTADOS DEL MUESTREO:
    - Infestación Broca: ${stats.infestationPercent}% (Umbral daño económico aprox 2-5%)
    - Incidencia Roya: ${stats.royaPercent}% (Umbral crítico >5-10%)
    - Total Árboles Evaluados: ${stats.totalTrees}
    
    TAREA:
    Genera un diagnóstico técnico corto y conciso (máximo 150 palabras) en formato texto plano (sin markdown complejo).
    1. Dictamina el estado sanitario (Bajo control / Alerta / Crítico).
    2. Recomienda una acción inmediata (ej: Re-Re, control químico focalizado, nutrición).
    3. Si la roya es alta, sugiere revisión de plan de fertilización.
    
    Tono: Profesional, técnico y directo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Fast and efficient model
      contents: prompt,
    });
    
    return response.text;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    // If permission denied or invalid key, throw specific error to prompt user again
    if (error.toString().includes('403') || error.toString().includes('400')) {
        throw new Error("INVALID_KEY");
    }
    throw new Error("No se pudo conectar con el servicio de IA. Verifique su conexión.");
  }
};