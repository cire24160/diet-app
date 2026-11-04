import { StepTracker } from './components/StepTracker';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>ダイエットアプリ</h1>
      {/* 歩数表示・操作コンポーネント */}
      <StepTracker />
    </div>
  );
}

export default App;