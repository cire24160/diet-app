import { addDays, getLocalDateKey } from './stepRecords.ts'
import type { DailyStepRecord } from './types.ts'

const SAMPLE_STEPS = [
  7_200, 8_400, 6_500, 10_200, 9_100, 7_800, 11_300, 8_600, 5_900, 9_700, 12_100,
  7_400, 10_500, 9_000,
]

export function createSampleStepRecords(
  today = getLocalDateKey(),
): DailyStepRecord[] {
  const records = SAMPLE_STEPS.map((steps, index) => ({
    date: addDays(today, index - SAMPLE_STEPS.length + 1),
    steps,
  }))

  records.push({ date: today, steps: 4_000 })
  return records
}
