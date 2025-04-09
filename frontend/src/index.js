import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App';
import './index.css';

// Configure React Router to use the future flags
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <BrowserRouter {...routerOptions}>
    <App />
  </BrowserRouter>
);
