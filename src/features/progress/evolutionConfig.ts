import type { EvolutionRoute } from './types.ts'

interface EvolutionStage {
  stage: number
  label: string
  requirement: number
}

interface EvolutionRouteDefinition {
  label: string
  criterion: 'totalSteps' | 'streakDays'
  stages: readonly EvolutionStage[]
}

export const DEFAULT_DAILY_STEP_GOAL = 8_000

export const EVOLUTION_ROUTES: Record<EvolutionRoute, EvolutionRouteDefinition> = {
  distance: {
    label: 'たくさん歩くルート',
    criterion: 'totalSteps',
    stages: [
      { stage: 1, label: 'たまご', requirement: 0 },
      { stage: 2, label: '若葉', requirement: 100_000 },
      { stage: 3, label: '大樹', requirement: 500_000 },
    ],
  },
  consistency: {
    label: '継続チャレンジルート',
    criterion: 'streakDays',
    stages: [
      { stage: 1, label: 'たまご', requirement: 0 },
      { stage: 2, label: 'がんばり屋', requirement: 7 },
      { stage: 3, label: '継続の達人', requirement: 30 },
    ],
  },
}
