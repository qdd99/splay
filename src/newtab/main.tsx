import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { OverlayProvider } from './components/ContextMenu';
import { DragProvider } from './components/DragProvider';
import './styles/tokens.css';
import './styles/app.css';

const container = document.getElementById('root');
if (!container) throw new Error('Splay: #root element not found');

createRoot(container).render(
  <StrictMode>
    <OverlayProvider>
      <DragProvider>
        <App />
      </DragProvider>
    </OverlayProvider>
  </StrictMode>,
);
