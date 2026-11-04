import { EVOLUTION_ROUTES, DEFAULT_DAILY_STEP_GOAL } from './evolutionConfig.ts'
import { calculateStreakDays } from './streak.ts'
import { aggregateStepRecords, getLocalDateKey } from './stepRecords.ts'
import type { DailyStepRecord, EvolutionResult, EvolutionRoute } from './types.ts'

export function determineEvolution(
  records: readonly DailyStepRecord[],
  goal = DEFAULT_DAILY_STEP_GOAL,
  today = getLocalDateKey(),
): EvolutionResult {
  const { totalSteps } = aggregateStepRecords(records)
  const streakDays = calculateStreakDays(records, goal, today)
  const routes = Object.entries(EVOLUTION_ROUTES) as [
    EvolutionRoute,
    (typeof EVOLUTION_ROUTES)[EvolutionRoute],
  ][]

  const candidates = routes.map(([route, definition]) => {
    const progress =
      definition.criterion === 'totalSteps' ? totalSteps : streakDays
    const achievedStage = [...definition.stages]
      .reverse()
      .find((stage) => progress >= stage.requirement)

    if (!achievedStage) {
      throw new Error(`進化ルート「${route}」に初期段階が設定されていません。`)
    }

    return { route, routeLabel: definition.label, ...achievedStage }
  })

  candidates.sort((left, right) => right.stage - left.stage)
  const selected = candidates[0]

  return {
    stage: selected.stage,
    stageLabel: selected.label,
    route: selected.route,
    routeLabel: selected.routeLabel,
    totalSteps,
    streakDays,
  }
}
