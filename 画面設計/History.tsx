import type { StepRecord } from '../types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type HistoryProps = {
  stepHistory: StepRecord[]
  goalSteps: number
}

function History({ stepHistory, goalSteps }: HistoryProps) {
  // 日付の新しい順に並べる
  const sortedHistory = [...stepHistory].sort(
    (a, b) => b.date.localeCompare(a.date)
  )

  // 今日を含む直近7日間の開始日
  const today = new Date()
  const startDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 6
  )

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return ${year}-${month}-${day}
  }

  const startDateString = formatDate(startDate)
  const todayString = formatDate(today)

  // 直近7日間の記録を取り出す
  const recentHistory = sortedHistory.filter(
    (record) =>
      record.date >= startDateString &&
      record.date <= todayString
  )

  // グラフ用のデータ
  const chartData = [...recentHistory]
    .reverse()
    .map((record) => ({
      date: record.date.slice(5).replace('-', '/'),
      steps: record.steps,
    }))

  // 平均歩数を計算
  const totalSteps = recentHistory.reduce(
    (total, record) => total + record.steps,
    0
  )

  const averageSteps =
    recentHistory.length > 0
      ? Math.round(totalSteps / recentHistory.length)
      : 0

  // 目標を達成した日数を計算
  const achievedDays = recentHistory.filter(
    (record) => record.steps >= goalSteps
  ).length

  return (
    <div className="card">
      <h2>📊 運動履歴</h2>
      <p>これまでの歩数記録</p>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        {/* 平均歩数 */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#fff3e4',
            padding: '15px',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <p>🚶 平均歩数</p>
          <h2 style={{ color: '#f59b45' }}>
            {averageSteps.toLocaleString()}歩
          </h2>
          <small>直近7日間の記録がある日</small>
        </div>

        {/* 目標達成日数 */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#fff3e4',
            padding: '15px',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <p>🏆 目標達成日数</p>
          <h2 style={{ color: '#f59b45' }}>
            {achievedDays}日
          </h2>
          <small>直近7日間</small>
        </div>
      </div>

      <p>
        🎯 現在の目標：
        {goalSteps.toLocaleString()}歩
      </p>

      {recentHistory.length === 0 ? (
        <p>直近7日間の運動記録がありません。</p>
      ) : (
        <>
          <h3>📈 直近7日間の歩数グラフ</h3>

          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="steps"
                  fill="#f59b45"
                  name="歩数"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <h3>📅 日付ごとの記録</h3>

      {sortedHistory.length === 0 ? (
        <p>まだ運動記録がありません。</p>
      ) : (
        sortedHistory.map((record) => {
          const isAchieved = record.steps >= goalSteps

          return (
            <div
              key={record.date}
              style={{
                backgroundColor: isAchieved
                  ? '#e8f7e8'
                  : '#fff3e4',
                padding: '15px',
                marginBottom: '10px',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span>📅 {record.date}</span>

              <div>
                <strong>
                  🚶 {record.steps.toLocaleString()}歩
                </strong>

                {isAchieved && (
                  <span
                    style={{
                      color: '#2e8b57',
                      marginLeft: '10px',
                      fontWeight: 'bold',
                    }}
                  >
                    🏆 達成！
                  </span>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export default History