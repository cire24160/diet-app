import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StepHistory } from './StepHistory.tsx'
import '../../index.css'

const rootElement = document.getElementById('progress-preview-root')

if (!rootElement) {
  throw new Error('歩数記録プレビューの表示場所が見つかりません。')
}

createRoot(rootElement).render(
  <StrictMode>
    <StepHistory />
  </StrictMode>,
)
