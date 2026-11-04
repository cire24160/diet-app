import type { StepData } from '../types/health';
export const calculateCalories = (steps: number): number => {
  return Math.round(steps * 0.04);
};

const STORAGE_KEY = 'diet_app_step_data';

// デフォルトの初期データ
const defaultData: StepData = {
  date: new Date().toISOString().split('T')[0],
  steps: 5000,
  source: 'device',
};

// 今日の歩数データを取得（ローカルストレージから読み込み）
export const getTodaySteps = async (): Promise<StepData> => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as StepData;
    } catch {
      // エラー時は初期データを返す
    }
  }
  return defaultData;
};

// 歩数を手入力で更新（ローカルストレージに保存）
export const updateStepsManually = (newSteps: number): StepData => {
  const updatedData: StepData = {
    date: new Date().toISOString().split('T')[0],
    steps: newSteps,
    source: 'manual',
  };
  
  // ブラウザに保存
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  return updatedData;
};