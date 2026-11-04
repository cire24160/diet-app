import { useState } from 'react'
import { DEFAULT_DAILY_STEP_GOAL } from './evolutionConfig.ts'
import { determineEvolution } from './evolution.ts'
import { createSampleStepRecords } from './sampleStepRecords.ts'
import { aggregateStepRecords } from './stepRecords.ts'
import { summarizeWeek } from './weeklySummary.ts'
import './StepHistory.css'

const STEP_RECORDS = createSampleStepRecords()

function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  })
}

export function StepHistory() {
  const [goal, setGoal] = useState(DEFAULT_DAILY_STEP_GOAL)
  const recordSummary = aggregateStepRecords(STEP_RECORDS)
  const weeklySummary = summarizeWeek(STEP_RECORDS, goal)
  const evolution = determineEvolution(STEP_RECORDS, goal)
  const maxSteps = Math.max(goal, ...weeklySummary.days.map((day) => day.steps))

  return (
    <main className="progress-page">
      <header className="progress-header">
        <div>
          <p className="eyebrow">DAILY PROGRESS</p>
          <h1>歩みの記録</h1>
          <p className="header-description">
            毎日の一歩を記録して、これまでの成長を見てみましょう。
          </p>
        </div>
        <label className="goal-control">
          <span>1日の目標</span>
          <input
            type="number"
            min="1"
            max="1000000"
            step="500"
            value={goal}
            onChange={(event) => {
              const nextGoal = Number(event.currentTarget.value)
              if (Number.isSafeInteger(nextGoal) && nextGoal > 0) {
                setGoal(nextGoal)
              }
            }}
          />
          <span>歩</span>
        </label>
      </header>

      <section className="summary-grid" aria-label="歩数の概要">
        <article className="summary-card total-card">
          <span className="card-label">累計歩数</span>
          <strong>{recordSummary.totalSteps.toLocaleString('ja-JP')}</strong>
          <span className="card-caption">記録された全日分</span>
        </article>
        <article className="summary-card">
          <span className="card-label">今週の達成日</span>
          <strong>
            {weeklySummary.achievedDays}
            <small> / 7 日</small>
          </strong>
          <span className="card-caption">月曜日から日曜日</span>
        </article>
        <article className="summary-card">
          <span className="card-label">連続達成</span>
          <strong>
            {evolution.streakDays}
            <small> 日</small>
          </strong>
          <span className="card-caption">今日から続いている日数</span>
        </article>
        <article className="summary-card evolution-card">
          <span className="card-label">現在の進化</span>
          <strong>
            {evolution.stageLabel}
            <small> · 第{evolution.stage}段階</small>
          </strong>
          <span className="card-caption">{evolution.routeLabel}</span>
        </article>
      </section>

      <section className="panel weekly-panel" aria-labelledby="weekly-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">THIS WEEK</p>
            <h2 id="weekly-title">週間の歩数</h2>
          </div>
          <p className="week-range">
            {formatDate(weeklySummary.weekStart)} – {formatDate(weeklySummary.weekEnd)}
          </p>
        </div>
        <p className="weekly-total">
          週間合計 <strong>{weeklySummary.totalSteps.toLocaleString('ja-JP')}</strong> 歩
        </p>
        <ul className="weekly-chart" aria-label="今週の日別歩数グラフ">
          {weeklySummary.days.map((day) => (
            <li
              className={`chart-day${day.achieved ? ' achieved' : ''}`}
              key={day.date}
              aria-label={`${formatDate(day.date)} ${day.weekday曜日}: ${day.steps.toLocaleString('ja-JP')}歩${day.achieved ? '、目標達成' : ''}`}
            >
              <span className="bar-value">
                {day.steps > 0 ? (day.steps / 1000).toFixed(1) : '0'}
              </span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ height: `${(day.steps / maxSteps) * 100}%` }}
                />
                <div
                  className="goal-marker"
                  style={{ bottom: `${(goal / maxSteps) * 100}%` }}
                />
              </div>
              <span className="chart-weekday">{day.weekday}</span>
              <span className="chart-date">{formatDate(day.date)}</span>
            </li>
          ))}
        </ul>
        <div className="chart-legend">
          <span><i className="legend-bar achieved-legend" /> 目標達成</span>
          <span><i className="legend-bar" /> 目標未達成</span>
          <span><i className="legend-line" /> 目標ライン</span>
        </div>
      </section>

      <section className="panel history-panel" aria-labelledby="history-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">RECENT ACTIVITY</p>
            <h2 id="history-title">日別履歴</h2>
          </div>
          <span className="history-count">{recordSummary.dailyRecords.length} 日分</span>
        </div>
        {recordSummary.dailyRecords.length === 0 ? (
          <p className="empty-state">歩数の記録はまだありません。</p>
        ) : (
          <ul className="history-list">
            {[...recordSummary.dailyRecords].reverse().map((record) => {
              const achieved = record.steps >= goal

              return (
                <li className="history-row" key={record.date}>
                  <time dateTime={record.date}>{formatDate(record.date)}</time>
                  <div className="history-progress" aria-hidden="true">
                    <span
                      className={achieved ? 'history-progress-fill achieved' : 'history-progress-fill'}
                      style={{
                        width: `${Math.min((record.steps / goal) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <strong>{record.steps.toLocaleString('ja-JP')} 歩</strong>
                  <span className={achieved ? 'achievement-badge achieved' : 'achievement-badge'}>
                    {achieved ? '達成' : 'あと少し'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {recordSummary.duplicateDateCount > 0 && (
          <p className="data-note">
            同じ日付の記録が重複したため、その日の最大値を採用しました。
          </p>
        )}
        {recordSummary.ignoredRecordCount > 0 && (
          <p className="data-note">
            日付または歩数が不正な記録を {recordSummary.ignoredRecordCount} 件集計から除外しました。
          </p>
        )}
      </section>
      <p className="sample-note">
        現在は動作確認用のサンプル記録を表示しています。実データの連携は別途行います。
      </p>
    </main>
  )
}
