import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import './index.css';

const savedTheme = localStorage.getItem('ketchup-theme');
const startDark = savedTheme ? savedTheme === 'dark' : true;
document.documentElement.classList.toggle('dark', startDark);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('root element not found');
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
