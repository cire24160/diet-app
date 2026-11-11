
import { useState } from 'react'

type RecordProps = {
  steps: number
  onSaveSteps: (steps: number) => void
  onBack: () => void
}

function Record({
  steps,
  onSaveSteps,
  onBack,
}: RecordProps) {
  const [inputSteps, setInputSteps] = useState('')

  const handleSave = () => {
    if (inputSteps.trim() === '') {
      alert('歩数を入力してください')
      return
    }

    const newSteps = Number(inputSteps)

    if (!Number.isSafeInteger(newSteps) || newSteps < 0) {
      alert('0以上の整数を入力してください')
      return
    }

    onSaveSteps(newSteps)
    setInputSteps('')
    alert('歩数を記録しました！')
  }

  return (
    <>
      <div className="card">
        <h2>📝 運動記録</h2>

        <p>今日の歩数：{steps.toLocaleString()}歩</p>

        <p>歩数を入力してください</p>

        <input
          type="number"
          min="0"
          step="1"
          placeholder="例：8000"
          value={inputSteps}
          onChange={(e) => setInputSteps(e.target.value)}
        />

        <div style={{ marginTop: '20px' }}>
          <button onClick={handleSave}>
            記録を保存する
          </button>
        </div>
      </div>

      <button onClick={onBack}>
        ホームに戻る
      </button>
    </>
  )
}

export default Record