import { DEFAULT_DAILY_STEP_GOAL } from './evolutionConfig.ts'
import { addDays, aggregateStepRecords, getLocalDateKey, isValidDateKey } from './stepRecords.ts'
import type { DailyStepRecord } from './types.ts'

export function calculateStreakDays(
  records: readonly DailyStepRecord[],
  goal = DEFAULT_DAILY_STEP_GOAL,
  today = getLocalDateKey(),
): number {
  if (!Number.isSafeInteger(goal) || goal <= 0) {
    throw new RangeError('目標歩数は1以上の整数にしてください。')
  }
  if (!isValidDateKey(today)) {
    throw new RangeError(`今日の日付の形式が正しくありません: ${today}`)
  }

  const stepsByDate = new Map<string, number>(
    aggregateStepRecords(records).dailyRecords.map(
      ({ date, steps }) => [date, steps] as const,
    ),
  )
  let streakDays = 0
  let date = today

  while ((stepsByDate.get(date) ?? 0) >= goal) {
    streakDays += 1
    date = addDays(date, -1)
  }

  return streakDays
}
