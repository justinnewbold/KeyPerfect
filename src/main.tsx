import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components'
import { registerServiceWorker } from './utils/serviceWorker'
import './styles/globals.css'

// Register service worker for offline support
registerServiceWorker({
  onUpdate: () => {
    console.log('New version available! Refresh to update.');
  },
  onSuccess: () => {
    console.log('App is ready for offline use.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
