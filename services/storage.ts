import { Evaluation } from '../types';

const STORAGE_KEY = 'cafe_evaluations_v1';

export const saveEvaluations = (evaluations: Evaluation[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
  } catch (e) {
    console.error('Error saving evaluations', e);
  }
};

export const getEvaluations = (): Evaluation[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading evaluations', e);
    return [];
  }
};

export const saveSingleEvaluation = (evaluation: Evaluation) => {
  const list = getEvaluations();
  const index = list.findIndex((e) => e.id === evaluation.id);
  
  if (index >= 0) {
    list[index] = evaluation;
  } else {
    list.push(evaluation);
  }
  
  saveEvaluations(list);
};

export const deleteEvaluation = (id: string) => {
  const list = getEvaluations();
  const newList = list.filter((e) => e.id !== id);
  saveEvaluations(newList);
  return newList;
};