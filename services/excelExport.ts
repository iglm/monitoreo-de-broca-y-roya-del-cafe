import * as XLSX from 'xlsx';
import { Evaluation } from '../types';

const createWorkbook = (data: Evaluation) => {
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: ALL TREES (1-100) ---
  const ws1 = createMainSheet(data, 1, 100);
  XLSX.utils.book_append_sheet(wb, ws1, "Evaluación de Campo");

  return wb;
};

export const exportEvaluationToExcel = (evalData: Evaluation) => {
  const wb = createWorkbook(evalData);
  
  // Sanitization: Remove characters that are invalid in filenames
  const safeLoteName = (evalData.nombreLote || 'Lote').replace(/[^a-z0-9\-_ñáéíóúü ]/gi, '_');
  const fileName = `EVALUACION_${safeLoteName}_${evalData.fechaVisita}.xlsx`;
  
  XLSX.writeFile(wb, fileName);
};

const createMainSheet = (data: Evaluation, startTree: number, endTree: number) => {
  // Construct Header Rows
  const gpsInfo = data.location 
    ? `GPS: ${data.location.lat.toFixed(5)}, ${data.location.lng.toFixed(5)}` 
    : "GPS: No registrado";

  const header = [
    ["EVALUACIÓN FITOSANITARIA Y PRODUCCIÓN EN CAMPO"],
    ["VARIEDAD", data.variedad, "", "LUMINOSIDAD", "", "", ""],
    ["ÁREA LOTE (HAS)", data.areaLote, "", "TIPO RENOVACIÓN", data.tipoRenovacion, "", ""],
    ["NOMBRE LOTE", data.nombreLote, "", "EDAD (AÑOS)", data.edadAnios, "", ""],
    ["CAFICULTOR", data.caficultor, "", "DENSIDAD", data.densidad, "", "FECHA VISITA", data.fechaVisita],
    ["UBICACIÓN", gpsInfo, "", "", "", "", "", ""],
    [], // Spacer
    // Table Header
    [
      "Arbol", 
      "# F A", "# F B A (BROCA)", 
      "# F S", "# F B S", 
      "N H (TOTALES)", 
      "H R (ROYA)", "Grado (0-9)", 
      "DEFICIENCIA (0-4)"
    ]
  ];

  const rows = [];
  const subset = data.trees.filter(t => t.id >= startTree && t.id <= endTree);

  subset.forEach(t => {
    rows.push([
      t.id,
      t.fa, t.fba,
      t.fs, t.fbs,
      t.nh,
      t.hr, t.grado,
      t.deficiencia
    ]);
  });

  // Convert to sheet
  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  
  // Basic column widths
  ws['!cols'] = [
    { wch: 6 }, // Tree ID
    { wch: 8 }, { wch: 10 }, // FA, FBA
    { wch: 8 }, { wch: 10 }, // FS, FBS
    { wch: 12 }, // NH
    { wch: 10 }, { wch: 10 }, // Roya
    { wch: 15 } // Deficiencia
  ];

  return ws;
};