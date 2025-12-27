import { GoogleGenAI } from "@google/genai";
import { Evaluation } from "../types";

// Initialize AI Client
// Note: In a production client-side app, you would proxy this or require user input key.
// For this environment, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini 3 Pro with Thinking Mode to analyze the phytosanitary data.
 * Requirement: "Think more when needed"
 */
export const generateAgronomicReport = async (evaluation: Evaluation, stats: any) => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const prompt = `
    Actúa como un Ingeniero Agrónomo experto en café. Analiza los siguientes datos recolectados en campo:
    
    Lote: ${evaluation.nombreLote}
    Variedad: ${evaluation.variedad}
    Edad: ${evaluation.edadAnios} años
    
    ESTADÍSTICAS RECOLECTADAS:
    - Infestación Broca: ${stats.infestationPercent}%
    - Incidencia Roya: ${stats.royaPercent}%
    - Total Árboles Evaluados: ${stats.totalTrees}
    
    Tarea:
    Genera un plan de recomendación técnica detallado.
    1. Evalúa si los niveles de infestación superan el umbral económico de daño.
    2. Recomienda acciones de control cultural (Re-Re).
    3. Recomienda control químico o biológico específico si es necesario.
    4. Da una recomendación sobre nutrición basada en la edad del cultivo.
    
    Usa formato Markdown. Sé conciso pero técnico.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget for deep analysis
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};

/**
 * Uses Gemini 2.5 Flash with Google Maps Tool to find supplies.
 * Requirement: "Use Google Maps data"
 */
export const findNearbySupplies = async (latitude: number, longitude: number) => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Encuentra almacenes agrícolas o comités de cafeteros cercanos a mi ubicación actual para comprar insumos.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude,
              longitude
            }
          }
        }
      },
    });

    // Check for grounding chunks to extract maps data specifically if needed, 
    // but returning the text (which Gemini formats nicely with maps tool) is usually sufficient.
    return response.text;
  } catch (error) {
    console.error("Maps Error:", error);
    throw error;
  }
};