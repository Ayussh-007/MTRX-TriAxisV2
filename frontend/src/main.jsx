import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './styles/index.css'

/*
 * GOOGLE_CLIENT_ID is read from the VITE_GOOGLE_CLIENT_ID env variable.
 * Set it in frontend/.env  →  VITE_GOOGLE_CLIENT_ID=your_client_id_here
 * If not set, Google login button is hidden and email/password auth is used.
 * We always provide the GoogleOAuthProvider (even with empty clientId)
 * so the useGoogleLogin hook doesn't crash.
 */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
