import React, { useState, useEffect } from 'react';
import type { StepData } from '../types/health';
import { getTodaySteps, updateStepsManually, calculateCalories } from '../services/healthService';

export const StepTracker: React.FC = () => {
  const [stepData, setStepData] = useState<StepData | null>(null);
  const [inputSteps, setInputSteps] = useState<string>('');

  // 初回読み込み時に歩数データを取得
  useEffect(() => {
    const fetchSteps = async () => {
      const data = await getTodaySteps();
      setStepData(data);
      setInputSteps(data.steps.toString());
    };
    fetchSteps();
  }, []);

  // 手入力更新の処理
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const newSteps = parseInt(inputSteps, 10);
    if (!isNaN(newSteps)) {
      const updated = updateStepsManually(newSteps);
      setStepData(updated);
      alert('歩数を更新しました！');
    }
  };

  // データ読み込み前の表示
  if (!stepData) return <div>読み込み中...</div>;

  // 画面の描画（returnの中にカロリー表示を移動）
  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', maxWidth: '400px' }}>
      <h3>今日の歩数</h3>
      <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
        {stepData.steps.toLocaleString()} 歩
      </p>

      {/* 🔥 ここに消費カロリーの表示を追加！ */}
      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6b6b', marginTop: '8px' }}>
        🔥 消費カロリー: {calculateCalories(stepData.steps).toLocaleString()} kcal
      </p>

      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        取得元: {stepData.source === 'device' ? 'ヘルスケア連携' : '手入力/PC'}
      </p>

      <form onSubmit={handleUpdate} style={{ marginTop: '12px' }}>
        <input
          type="number"
          value={inputSteps}
          onChange={(e) => setInputSteps(e.target.value)}
          style={{ padding: '6px', marginRight: '8px', width: '100px' }}
        />
        <button type="submit" style={{ padding: '6px 12px' }}>
          手入力で更新
        </button>
      </form>
    </div>
  );
};