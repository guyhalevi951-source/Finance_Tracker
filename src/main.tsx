import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './app/providers/ThemeProvider';
import { I18nProvider } from './app/providers/I18nProvider';
import { AppErrorBoundary } from './app/components/AppErrorBoundary';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>
);
