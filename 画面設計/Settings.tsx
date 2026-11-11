import { useEffect, useState } from 'react'

type SettingsProps = {
  goalSteps: number
  onSaveGoal: (newGoal: number) => void
}

function Settings({ goalSteps, onSaveGoal }: SettingsProps) {
  const [inputGoal, setInputGoal] = useState<string>(
    String(goalSteps)
  )
  const [error, setError] = useState<string>('')

  useEffect(() => {
    setInputGoal(String(goalSteps))
  }, [goalSteps])

  const handleSave = () => {
    const newGoal = Number(inputGoal)

    if (inputGoal.trim() === '') {
      setError('目標歩数を入力してください')
      return
    }

    if (!Number.isSafeInteger(newGoal) || newGoal <= 0) {
      setError('1以上の整数を入力してください')
      return
    }

    setError('')
    onSaveGoal(newGoal)

    alert(
      目標歩数を${newGoal.toLocaleString()}歩に変更しました！
    )
  }

  return (
    <>
      <div className="card">
        <h2>⚙️ 設定</h2>

        <h3>🎯 1日の目標歩数</h3>

        <p>
          現在の目標：{goalSteps.toLocaleString()}歩
        </p>

        <input
          type="number"
          min="1"
          step="1"
          value={inputGoal}
          onChange={(e) => {
            setInputGoal(e.target.value)
            setError('')
          }}
        />

        {error && (
          <p style={{ color: 'red' }}>{error}</p>
        )}

        <div style={{ marginTop: '20px' }}>
          <button type="button" onClick={handleSave}>
            目標を変更する
          </button>
        </div>
      </div>

      <div className="card">
        <h3>🔔 通知設定</h3>
        <p>今後追加予定です。</p>
      </div>

      <div className="card">
        <h3>👤 プロフィール設定</h3>
        <p>今後追加予定です。</p>
      </div>
    </>
  )
}

export default Settings