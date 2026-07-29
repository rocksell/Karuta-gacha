import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PlayerDataProvider } from './context/PlayerDataContext.jsx'

createRoot(document.getElementById('root')).render(
  <PlayerDataProvider>
    <App />
  </PlayerDataProvider>,
)
