import './debugBoot';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './app/providers/ThemeProvider';
import { I18nProvider } from './app/providers/I18nProvider';
import { AppErrorBoundary } from './app/components/AppErrorBoundary';
import App from './App.tsx';
import './index.css';

// #region agent log
window.addEventListener('error', (event) => {
  fetch('http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7dae'},body:JSON.stringify({sessionId:'ea7dae',runId:'pre-fix',hypothesisId:'A',location:'main.tsx:window.error',message:'window error',data:{message:String(event.message),filename:event.filename,lineno:event.lineno,colno:event.colno,errorName:event.error?.name,errorMessage:event.error?.message,stack:event.error?.stack?.slice(0,800)},timestamp:Date.now()})}).catch(()=>{});
});
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  fetch('http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7dae'},body:JSON.stringify({sessionId:'ea7dae',runId:'pre-fix',hypothesisId:'A',location:'main.tsx:unhandledrejection',message:'unhandled rejection',data:{reason:String(reason),name:reason?.name,stack:reason?.stack?.slice?.(0,800)},timestamp:Date.now()})}).catch(()=>{});
});
fetch('http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7dae'},body:JSON.stringify({sessionId:'ea7dae',runId:'pre-fix',hypothesisId:'A',location:'main.tsx:boot',message:'main module reached createRoot',data:{hasRoot:Boolean(document.getElementById('root'))},timestamp:Date.now()})}).catch(()=>{});
// #endregion

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
