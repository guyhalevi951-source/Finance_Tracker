// #region agent log
const DEBUG_ENDPOINT = 'http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d';

function paintDebug(line: string): void {
  try {
    let node = document.getElementById('agent-debug-overlay');
    if (!node) {
      node = document.createElement('pre');
      node.id = 'agent-debug-overlay';
      node.setAttribute(
        'style',
        'position:fixed;z-index:2147483647;left:0;bottom:0;max-height:30vh;overflow:auto;background:#111;color:#0f0;font:11px/1.3 monospace;padding:8px;margin:0;width:100%;box-sizing:border-box;white-space:pre-wrap;pointer-events:none;',
      );
      document.body.appendChild(node);
    }
    node.textContent += `${line}\n`;
  } catch {
    /* ignore overlay failures */
  }
}

function sendDebug(payload: Record<string, unknown>): void {
  const body = { sessionId: 'ea7dae', timestamp: Date.now(), ...payload };
  paintDebug(JSON.stringify(body));
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'ea7dae' },
    body: JSON.stringify(body),
  }).catch(() => {});
}

window.addEventListener('error', (event) => {
  sendDebug({
    runId: 'pre-fix',
    hypothesisId: 'A',
    location: 'debugBoot.ts:error',
    message: 'window error',
    data: {
      msg: String(event.message),
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      errorMessage: event.error instanceof Error ? event.error.message : undefined,
      stack: event.error instanceof Error ? event.error.stack?.slice(0, 800) : undefined,
    },
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as { name?: string; stack?: string } | undefined;
  sendDebug({
    runId: 'pre-fix',
    hypothesisId: 'A',
    location: 'debugBoot.ts:rejection',
    message: 'unhandled rejection',
    data: {
      reason: String(event.reason),
      name: reason?.name,
      stack: reason?.stack?.slice?.(0, 800),
    },
  });
});

sendDebug({
  runId: 'pre-fix',
  hypothesisId: 'F',
  location: 'debugBoot.ts:module',
  message: 'debugBoot evaluated before app imports',
  data: { readyState: document.readyState },
});
// #endregion
