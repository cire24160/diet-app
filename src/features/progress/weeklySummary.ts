import { DEFAULT_DAILY_STEP_GOAL } from './evolutionConfig.ts'
import { addDays, aggregateStepRecords, getLocalDateKey, isValidDateKey } from './stepRecords.ts'
import type { DailyStepRecord, WeeklyStepDay, WeeklyStepSummary } from './types.ts'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function getMondayDate(date: string): string {
  if (!isValidDateKey(date)) {
    throw new RangeError(`日付の形式が正しくありません: ${date}`)
  }

  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()

  return addDays(date, weekday === 0 ? -6 : 1 - weekday)
}

export function summarizeWeek(
  records: readonly DailyStepRecord[],
  goal = DEFAULT_DAILY_STEP_GOAL,
  dateInWeek = getLocalDateKey(),
): WeeklyStepSummary {
  if (!Number.isSafeInteger(goal) || goal <= 0) {
    throw new RangeError('目標歩数は1以上の整数にしてください。')
  }
  if (!isValidDateKey(dateInWeek)) {
    throw new RangeError(`日付の形式が正しくありません: ${dateInWeek}`)
  }

  const recordSummary = aggregateStepRecords(records)
  const stepsByDate = new Map<string, number>(
    recordSummary.dailyRecords.map(({ date, steps }) => [date, steps] as const),
  )
  const weekStart = getMondayDate(dateInWeek)
  const days: WeeklyStepDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)
    const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]
    const steps = stepsByDate.get(date) ?? 0

    return { date, weekday, steps, achieved: steps >= goal }
  })

  return {
    weekStart,
    weekEnd: days[6].date,
    days,
    totalSteps: days.reduce((total, day) => total + day.steps, 0),
    achievedDays: days.filter((day) => day.achieved).length,
    ignoredRecordCount: recordSummary.ignoredRecordCount,
    duplicateDateCount: recordSummary.duplicateDateCount,
  }
}
