import React, { useState, useEffect } from 'react';
import type { StepData } from '../types/health';
import { getTodaySteps, updateStepsManually } from '../services/healthService';

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

  if (!stepData) return <div>読み込み中...</div>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', maxWidth: '400px' }}>
      <h3>今日の歩数</h3>
      <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
        {stepData.steps.toLocaleString()} 歩
      </p>
      <p style={{ fontSize: '12px', color: '#666' }}>
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