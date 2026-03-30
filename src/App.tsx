import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './screens/Home'
import Lobby from './screens/Lobby'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:code" element={<Lobby />} />
        {/* Phase 3 will add: /game/:code/play */}
        {/* Phase 4 will add: /game/:code/end  */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
