import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import RaceShell from './RaceShell.jsx';
import ResultEnhancements from './ResultEnhancements.jsx';
import './race-design.css';
import './race-accents.css';

createRoot(document.getElementById('root')).render(<StrictMode><RaceShell><App /><ResultEnhancements /></RaceShell></StrictMode>);
