import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { OverlayProvider } from './components/ContextMenu';
import { DragProvider } from './components/DragProvider';
import { CollapseProvider } from './components/CollapseProvider';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import './styles/tokens.css';
import './styles/app.css';

const container = document.getElementById('root');
if (!container) throw new Error('Splay: #root element not found');

createRoot(container).render(
  <StrictMode>
    <OverlayProvider>
      <CollapseProvider>
        <DragProvider>
          <App />
        </DragProvider>
      </CollapseProvider>
    </OverlayProvider>
  </StrictMode>,
);
