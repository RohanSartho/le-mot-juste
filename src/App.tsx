import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './screens/Home'
import Lobby from './screens/Lobby'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Lobby handles playing/finished state internally — renders GameScreen or EndGameScreen */}
        <Route path="/game/:code" element={<Lobby />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
