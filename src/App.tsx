import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import GamesList from '@/components/GamesList'
import GameDetail from '@/components/GameDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GamesList />} />
        <Route path="/game/:id" element={<GameDetail />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App