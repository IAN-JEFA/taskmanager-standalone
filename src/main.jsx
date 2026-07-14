import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { resetAllData } from './api/db.js';
import './styles/index.css';

// Convenience for testing/demoing: open devtools console and run
// `resetTaskOpsDemo()` to wipe all local data back to the seeded demo state.
window.resetTaskOpsDemo = () => {
  resetAllData();
  window.location.href = '/login';
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
