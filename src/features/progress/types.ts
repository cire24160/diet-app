export interface DailyStepRecord {
  date: string
  steps: number
}

export type EvolutionRoute = 'distance' | 'consistency'

export interface StepRecordSummary {
  dailyRecords: DailyStepRecord[]
  totalSteps: number
  ignoredRecordCount: number
  duplicateDateCount: number
}

export interface EvolutionResult {
  stage: number
  stageLabel: string
  route: EvolutionRoute
  routeLabel: string
  totalSteps: number
  streakDays: number
}

export interface WeeklyStepDay {
  date: string
  weekday: string
  steps: number
  achieved: boolean
}

export interface WeeklyStepSummary {
  weekStart: string
  weekEnd: string
  days: WeeklyStepDay[]
  totalSteps: number
  achievedDays: number
  ignoredRecordCount: number
  duplicateDateCount: number
}
