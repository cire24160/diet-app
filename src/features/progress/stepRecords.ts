import type { DailyStepRecord, StepRecordSummary } from './types.ts'

export function isValidDateKey(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false
  }

  const [year, month, day] = date.split('-').map(Number)
  if (year < 1) {
    return false
  }
  const parsedDate = new Date(0)
  parsedDate.setUTCFullYear(year, month - 1, day)
  parsedDate.setUTCHours(0, 0, 0, 0)

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  )
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isValidRecord(record: unknown): record is DailyStepRecord {
  if (typeof record !== 'object' || record === null) {
    return false
  }

  const candidate = record as Partial<DailyStepRecord>

  return (
    isValidDateKey(candidate.date) &&
    typeof candidate.steps === 'number' &&
    Number.isSafeInteger(candidate.steps) &&
    candidate.steps >= 0
  )
}

export function aggregateStepRecords(
  records: readonly DailyStepRecord[],
): StepRecordSummary {
  const stepsByDate = new Map<string, number>()
  let ignoredRecordCount = 0
  let duplicateDateCount = 0

  for (const record of records) {
    if (!isValidRecord(record)) {
      ignoredRecordCount += 1
      continue
    }

    const existingSteps = stepsByDate.get(record.date)
    if (existingSteps !== undefined) {
      duplicateDateCount += 1
      stepsByDate.set(record.date, Math.max(existingSteps, record.steps))
    } else {
      stepsByDate.set(record.date, record.steps)
    }
  }

  const dailyRecords = [...stepsByDate.entries()]
    .map(([date, steps]) => ({ date, steps }))
    .sort((left, right) => left.date.localeCompare(right.date))
  const totalSteps = dailyRecords.reduce((total, record) => total + record.steps, 0)

  if (!Number.isSafeInteger(totalSteps)) {
    throw new RangeError('累計歩数が安全な数値範囲を超えています。')
  }

  return { dailyRecords, totalSteps, ignoredRecordCount, duplicateDateCount }
}

export function addDays(date: string, amount: number): string {
  if (!isValidDateKey(date)) {
    throw new RangeError(`日付の形式が正しくありません: ${date}`)
  }

  const [year, month, day] = date.split('-').map(Number)
  const result = new Date(0)
  result.setUTCFullYear(year, month - 1, day + amount)
  result.setUTCHours(0, 0, 0, 0)

  return result.toISOString().slice(0, 10)
}
