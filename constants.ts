import { TreeRecord, Evaluation } from './types';

export const TOTAL_TREES = 100;

export const DEFAULT_TREE_RECORD: TreeRecord = {
  id: 0,
  fa: 0,
  fba: 0,
  fs: 0,
  fbs: 0,
  nh: 0,
  hr: 0,
  grado: 0,
  deficiencia: 0,
  touched: false,
};

export const createNewEvaluation = (): Evaluation => {
  const trees: TreeRecord[] = [];
  for (let i = 1; i <= TOTAL_TREES; i++) {
    trees.push({ ...DEFAULT_TREE_RECORD, id: i });
  }

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    lastModified: Date.now(),
    tipoRenovacion: '',
    nombreLote: '',
    caficultor: '',
    fechaVisita: new Date().toISOString().split('T')[0],
    variedad: '',
    areaLote: 0,
    edadAnios: 0,
    densidad: 0,
    trees,
    currentTreeIndex: 0,
    status: 'in_progress',
  };
};

export const DEFICIENCY_OPTIONS = [
  { value: 0, label: '0: No' },
  { value: 1, label: '1: Nitrógeno (N)' },
  { value: 2, label: '2: Fósforo (P)' },
  { value: 3, label: '3: Potasio (K)' },
  { value: 4, label: '4: Magnesio (Mg)' },
];