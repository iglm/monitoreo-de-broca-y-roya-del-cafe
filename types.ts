export interface TreeRecord {
  id: number; // 1 to 100
  // Frutos en Arbol
  fa: number; // Frutos Totales Arbol
  fba: number; // Frutos Broca Arbol
  // Frutos en Suelo
  fs: number; // Frutos Totales Suelo
  fbs: number; // Frutos Broca Suelo
  // Hojas
  nh: number; // Numero Hojas Totales
  // Roya
  hr: number; // Hojas con Roya
  grado: number; // 0-9
  // Otros
  deficiencia: number; // 0=No, 1=N, 2=P, 3=K, 4=Mg
  
  // UI State
  touched?: boolean; // Indicates if this tree has been evaluated/visited
}

export interface Evaluation {
  id: string;
  createdAt: number;
  lastModified: number;
  // General Info
  tipoRenovacion: string;
  nombreLote: string; 
  caficultor: string;
  fechaVisita: string;
  variedad: string;
  areaLote: number;
  edadAnios: number;
  densidad: number;
  
  // Geolocation
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  
  // Data
  trees: TreeRecord[];
  currentTreeIndex: number;
  status: 'in_progress' | 'completed';
}

export enum ViewState {
  HOME = 'HOME',
  NEW_EVALUATION = 'NEW_EVALUATION',
  TREE_EVALUATION = 'TREE_EVALUATION',
  SUMMARY = 'SUMMARY',
  USER_MANUAL = 'USER_MANUAL', // New state for user manual
}

export interface DonationProduct {
  id: string;
  title: string;
  price: string;
  description: string;
  icon: string; // emoji or icon name
  recommended?: boolean;
}