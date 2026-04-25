import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { ClassroomProvider } from './context/ClassroomContext'
import App from './App'
import './styles/index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ClassroomProvider>
          <App />
        </ClassroomProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
