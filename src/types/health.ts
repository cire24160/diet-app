// 日ごとの歩数データ型
export interface StepData {
  date: string;         // 日付 (例: "2026-10-21")
  steps: number;        // 歩数
  source: 'device' | 'manual'; // データ元 ('device': ヘルスケア連携, 'manual': 手入力)
}

// ユーザーの運動・健康データ全体（拡張用）
export interface HealthSummary {
  todaySteps: StepData;
  targetSteps: number;  // 目標歩数
}