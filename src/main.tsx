import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { cleanExpiredSessions } from './lib/sessions'

// Best-effort cleanup of expired Firestore sessions on app start
cleanExpiredSessions()

createRoot(document.getElementById('root')!).render(<App />)
