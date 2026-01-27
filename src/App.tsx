import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GamesList from '@/components/GamesList'
import GameDetail from '@/components/GameDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GamesList />} />
        <Route path="/game/:id" element={<GameDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App