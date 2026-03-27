import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { enableAnalytics } from './utils/analytics'

// Meta / GTM só após consentimento — mas antes do React para o pixel aparecer cedo (Pixel Helper / diagnóstico).
if (typeof window !== 'undefined') {
  try {
    if (window.localStorage.getItem('cookie-consent') === 'accepted') {
      enableAnalytics()
    }
  } catch {
    /* private mode / storage blocked */
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
