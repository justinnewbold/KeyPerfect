import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary, UpdateBanner } from './components'
import { registerServiceWorker } from './utils/serviceWorker'
import './styles/globals.css'

// Register service worker for offline support. onUpdate used to be a bare
// console.log, so a user with the app already open never learned a new build
// existed; UpdateBanner listens for this event and offers a reload.
registerServiceWorker({
  onUpdate: () => {
    window.dispatchEvent(new CustomEvent('keyperfect:update-ready'));
  },
  onSuccess: () => {
    console.log('App is ready for offline use.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <UpdateBanner />
    </ErrorBoundary>
  </React.StrictMode>,
)
