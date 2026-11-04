import assert from 'node:assert/strict'
import test from 'node:test'
import { determineEvolution } from './evolution.ts'
import { calculateStreakDays } from './streak.ts'
import { aggregateStepRecords } from './stepRecords.ts'
import { summarizeWeek } from './weeklySummary.ts'

test('aggregates unique dates, using the largest duplicate and skipping invalid entries', () => {
  const summary = aggregateStepRecords([
    { date: '2026-10-28', steps: 3_000 },
    { date: '2026-10-28', steps: 8_000 },
    { date: '2026-10-29', steps: -1 },
    { date: '2026-02-30', steps: 2_000 },
    { date: '2026-10-27', steps: 4_000 },
  ])

  assert.equal(summary.totalSteps, 12_000)
  assert.equal(summary.duplicateDateCount, 1)
  assert.equal(summary.ignoredRecordCount, 2)
  assert.deepEqual(
    summary.dailyRecords.map(({ date }) => date),
    ['2026-10-27', '2026-10-28'],
  )
})

test('counts only a streak that includes today and crosses month boundaries correctly', () => {
  const records = [
    { date: '2026-10-31', steps: 8_000 },
    { date: '2026-11-01', steps: 9_000 },
    { date: '2026-11-02', steps: 8_000 },
  ]

  assert.equal(calculateStreakDays(records, 8_000, '2026-11-02'), 3)
  assert.equal(calculateStreakDays(records, 8_000, '2026-11-03'), 0)
})

test('summarizes Monday through Sunday across a month boundary with missing days as zero', () => {
  const summary = summarizeWeek(
    [
      { date: '2026-10-26', steps: 8_000 },
      { date: '2026-10-31', steps: 9_000 },
      { date: '2026-11-01', steps: 7_000 },
    ],
    8_000,
    '2026-10-31',
  )

  assert.equal(summary.weekStart, '2026-10-26')
  assert.equal(summary.weekEnd, '2026-11-01')
  assert.equal(summary.days.length, 7)
  assert.equal(summary.totalSteps, 24_000)
  assert.equal(summary.achievedDays, 2)
  assert.equal(summary.days[1].steps, 0)
})

test('returns seven zero-step days when there are no records', () => {
  const summary = summarizeWeek([], 8_000, '2026-10-28')

  assert.equal(summary.totalSteps, 0)
  assert.equal(summary.achievedDays, 0)
  assert.equal(summary.days.length, 7)
  assert.ok(summary.days.every((day) => day.steps === 0 && !day.achieved))
})

test('recalculates evolution from corrected records and selects the best qualified route', () => {
  const records = Array.from({ length: 7 }, (_, index) => ({
    date: `2026-10-${String(index + 22).padStart(2, '0')}`,
    steps: 8_000,
  }))

  const result = determineEvolution(records, 8_000, '2026-10-28')
  assert.equal(result.route, 'consistency')
  assert.equal(result.stage, 2)
  assert.equal(result.totalSteps, 56_000)
  assert.equal(result.streakDays, 7)
  assert.equal(determineEvolution([], 8_000, '2026-10-28').stage, 1)

  const distanceRoute = determineEvolution(
    [{ date: '2026-10-28', steps: 500_000 }],
    8_000,
    '2026-10-28',
  )
  assert.equal(distanceRoute.route, 'distance')
  assert.equal(distanceRoute.stage, 3)
})
