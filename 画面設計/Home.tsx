import type { AppData } from '../types'

type HomeProps = {
  data: AppData
  onRecordClick: () => void
  onHistoryClick: () => void
  onSettingsClick: () => void
  onTestGrowth: () => void
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return ${year}-${month}-${day}
}

function getRecordedDates(
  stepHistory: AppData['stepHistory']
) {
  return new Set(
    stepHistory
      .filter((record) => record.steps > 0)
      .map((record) => record.date)
  )
}

function calculateStreak(
  stepHistory: AppData['stepHistory']
) {
  const recordedDates = getRecordedDates(stepHistory)
  const today = new Date()

  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  if (!recordedDates.has(formatDate(currentDate))) {
    currentDate.setDate(currentDate.getDate() - 1)
  }

  let streak = 0

  while (recordedDates.has(formatDate(currentDate))) {
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

function calculateLongestStreak(
  stepHistory: AppData['stepHistory']
) {
  const dates = [...getRecordedDates(stepHistory)].sort()

  if (dates.length === 0) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < dates.length; i++) {
    const previous = new Date(`${dates[i - 1]}T12:00:00`)
    const next = new Date(`${dates[i]}T12:00:00`)

    previous.setDate(previous.getDate() + 1)

    if (formatDate(previous) === formatDate(next)) {
      current++
    } else {
      current = 1
    }

    longest = Math.max(longest, current)
  }

  return longest
}

function createWeeklyCalendar(
  stepHistory: AppData['stepHistory']
) {
  const recordedDates = getRecordedDates(stepHistory)
  const today = new Date()
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']

  const calendar = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - i
    )

    const dateString = formatDate(date)

    calendar.push({
      date: dateString,
      day: weekdays[date.getDay()],
      dayNumber: date.getDate(),
      recorded: recordedDates.has(dateString),
    })
  }

  return calendar
}

function Home({
  data,
  onRecordClick,
  onHistoryClick,
  onSettingsClick,
  onTestGrowth,
}: HomeProps) {
  const character =
    data.level >= 10
      ? '🐥'
      : data.level >= 5
        ? '🐣'
        : '🥚'

  const characterName =
    data.level >= 10
      ? '成長したひよこ'
      : data.level >= 5
        ? 'ひよこ'
        : 'たまご'

  const todayString = formatDate(new Date())

  const todayRecord = data.stepHistory.find(
    (record) => record.date === todayString
  )

  const todaySteps = todayRecord?.steps ?? 0

  const achievementRate =
    data.goalSteps > 0
      ? Math.floor(
          (todaySteps / data.goalSteps) * 100
        )
      : 0

  const progressWidth = Math.min(achievementRate, 100)

  const remainingSteps = Math.max(
    data.goalSteps - todaySteps,
    0
  )

  const streak = calculateStreak(data.stepHistory)

  const longestStreak = calculateLongestStreak(
    data.stepHistory
  )

  const totalActiveDays = getRecordedDates(
    data.stepHistory
  ).size

  const weeklyCalendar = createWeeklyCalendar(
    data.stepHistory
  )

  const badges = [
    {
      emoji: '🌱',
      name: 'はじめの一歩',
      condition: '1日以上運動',
      unlocked: totalActiveDays >= 1,
    },
    {
      emoji: '🥉',
      name: '継続ビギナー',
      condition: '3日連続運動',
      unlocked: longestStreak >= 3,
    },
    {
      emoji: '🥈',
      name: '習慣マスター',
      condition: '7日連続運動',
      unlocked: longestStreak >= 7,
    },
    {
      emoji: '🥇',
      name: '運動の達人',
      condition: '30日連続運動',
      unlocked: longestStreak >= 30,
    },
  ]

  const unlockedCount = badges.filter(
    (badge) => badge.unlocked
  ).length

  const missions = [
    {
      id: 'steps5000',
      emoji: '🚶',
      name: '5,000歩チャレンジ',
      target: 5000,
      reward: 20,
    },
    {
      id: 'steps8000',
      emoji: '🏆',
      name: '8,000歩チャレンジ',
      target: 8000,
      reward: 50,
    },
  ]

  return (
    <div className="card">
      <h2>🏠 ホーム</h2>

      {/* キャラクター */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#fff3e4',
        borderRadius: '15px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '90px' }}>
          {character}
        </div>

        <h3>🌱 {characterName}</h3>
        <h2>Lv. {data.level}</h2>
        <p>経験値：{data.exp} / 100 EXP</p>

        <div style={{
          width: '100%',
          height: '15px',
          backgroundColor: '#ffe0b2',
          borderRadius: '10px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(data.exp, 100)}%`,
            height: '100%',
            backgroundColor: '#f59b45',
          }} />
        </div>
      </div>

      {/* 連続運動記録 */}
      <div style={{
        backgroundColor: '#fff3e4',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '20px',
        textAlign: 'center',
      }}>
        <h3>🔥 連続運動記録</h3>
        <h1 style={{ color: '#f59b45' }}>
          {streak}日連続！
        </h1>
        <p>🏆 最長記録：{longestStreak}日</p>

        {streak === 0 ? (
          <p>今日から運動を始めよう！</p>
        ) : streak >= 7 ? (
          <p>🏆 1週間以上継続！すごい！</p>
        ) : streak >= 3 ? (
          <p>✨ いい調子！このまま続けよう！</p>
        ) : (
          <p>🌱 明日も続けてみよう！</p>
        )}
      </div>

      {/* 7日間カレンダー */}
      <div style={{
        backgroundColor: '#fff8ef',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '20px',
      }}>
        <h3>📅 7日間の運動カレンダー</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '5px',
        }}>
          {weeklyCalendar.map((item) => (
            <div key={item.date} style={{
              backgroundColor: item.recorded
                ? '#f59b45'
                : '#eeeeee',
              borderRadius: '10px',
              padding: '10px 2px',
              textAlign: 'center',
              color: item.recorded ? '#fff' : '#666',
            }}>
              <div style={{ fontSize: '12px' }}>
                {item.day}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                margin: '5px 0',
              }}>
                {item.dayNumber}
              </div>
              <div style={{ fontSize: '18px' }}>
                {item.recorded ? '✓' : '−'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* デイリーミッション */}
      <div style={{
        backgroundColor: '#fff8ef',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '20px',
      }}>
        <h3>🎯 デイリーミッション</h3>
        <p>毎日チャレンジしてEXPを獲得しよう！</p>

        {missions.map((mission) => {
          const achieved = todaySteps >= mission.target

          const claimed = data.missionRewards.some(
            (record) =>
              record.date === todayString &&
              record.missionId === mission.id
          )

          const progress = Math.min(
            (todaySteps / mission.target) * 100,
            100
          )

          return (
            <div key={mission.id} style={{
              backgroundColor: '#fff3e4',
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '12px',
            }}>
              <h4>
                {mission.emoji} {mission.name}
              </h4>

              <p>
                {mission.target.toLocaleString()}歩で
                ＋{mission.reward}EXP
              </p>

              <div style={{
                width: '100%',
                height: '14px',
                backgroundColor: '#ffe0b2',
                borderRadius: '10px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#f59b45',
                }} />
              </div>

              <p>
                {todaySteps.toLocaleString()} /
                {mission.target.toLocaleString()}歩
              </p>

              {claimed ? (
                <p style={{ color: '#2e8b57' }}>
                  🎉 達成！報酬獲得済み
                </p>
              ) : achieved ? (
                <p>達成！歩数を保存して報酬を獲得しよう</p>
              ) : (
                <p>あと{(
                  mission.target - todaySteps
                ).toLocaleString()}歩！</p>
              )}
            </div>
          )
        })}
      </div>

      {/* 実績バッジ */}
      <div style={{
        backgroundColor: '#fff8ef',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '20px',
      }}>
        <h3>🏅 実績・称号コレクション</h3>
        <p>
          獲得済み：{unlockedCount} / {badges.length}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '10px',
        }}>
          {badges.map((badge) => (
            <div key={badge.name} style={{
              backgroundColor: badge.unlocked
                ? '#fff3e4'
                : '#eeeeee',
              padding: '15px 8px',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '40px' }}>
                {badge.unlocked ? badge.emoji : '🔒'}
              </div>
              <h4>{badge.name}</h4>
              <p>{badge.condition}</p>
              <p>
                {badge.unlocked ? '獲得済み！' : '未獲得'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 今日の歩数 */}
      <div style={{
        back