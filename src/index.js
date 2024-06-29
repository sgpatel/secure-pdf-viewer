// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Disable right-click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Disable keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'c')) {
    e.preventDefault();
  }
});

// Disable print
window.addEventListener('beforeprint', (e) => {
  e.preventDefault();
  return false;
});

// Backup method to prevent printing
const mediaQueryList = window.matchMedia('print');
mediaQueryList.addListener((mql) => {
  if (mql.matches) {
    document.body.innerHTML = '';
  }
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);