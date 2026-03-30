import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode removed — it double-invokes effects which kills WebSocket connections
// before they're established (Supabase Realtime). Safe to remove for this use case.
createRoot(document.getElementById('root')!).render(<App />)
