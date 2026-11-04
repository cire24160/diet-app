import type { StepData } from '../types/health';

// 端末がヘルスケア機能（HealthKit等）に対応しているか確認する関数
export const isHealthKitAvailable = (): boolean => {
  // 現時点のPC/Webブラウザ環境では対応外とする
  // 後で Capacitor プラグイン等を導入した際にスマホ判定ロジックを入れる
  return false;
};

// 今日の歩数データを取得する関数
export const getTodaySteps = async (): Promise<StepData> => {
  const today = new Date().toISOString().split('T')[0];

  if (isHealthKitAvailable()) {
    // TODO: スマホヘルスケアからの自動取得処理（将来の実装用）
    return {
      date: today,
      steps: 8000,
      source: 'device',
    };
  } else {
    // PCブラウザや非対応環境用の初期データ（またはローカル保存データ）
    const savedSteps = localStorage.getItem(`steps_${today}`);
    return {
      date: today,
      steps: savedSteps ? parseInt(savedSteps, 10) : 5000, // 保存されていなければ仮で5000歩
      source: 'manual',
    };
  }
};

// 手入力で歩数を更新・保存する関数
export const updateStepsManually = (steps: number): StepData => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`steps_${today}`, steps.toString());
  
  return {
    date: today,
    steps: steps,
    source: 'manual',
  };
};