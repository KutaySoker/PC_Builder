import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PartProvider } from './context/PartContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PartProvider>
      <App />
    </PartProvider>
  </React.StrictMode>
);