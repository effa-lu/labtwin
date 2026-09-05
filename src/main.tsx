import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/i18n';
import App from './App';

const style = document.createElement('style');
style.textContent = `
  * { box-sizing: border-box; }
  html, body, #root { margin: 0; height: 100%; background: #2d3133; color-scheme: dark; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: #4f5558; border-radius: 6px; border: 2px solid #3a3e40; }
  ::-webkit-scrollbar-track { background: transparent; }
  input[type='range'] { accent-color: #2aaabc; }
  input:focus, select:focus { border-color: #2aaabc !important; }
  select option { background: #454a4d; color: #eceeef; }
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
