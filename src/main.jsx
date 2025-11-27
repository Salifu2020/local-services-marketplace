import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initSentry } from './sentry'
import { ErrorBoundaryWithRouter } from './components/ErrorBoundary'

// Initialize Sentry as early as possible in your application's lifecycle
initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundaryWithRouter>
      <App />
    </ErrorBoundaryWithRouter>
  </React.StrictMode>,
)

