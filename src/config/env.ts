/**
 * SSOT for environment-derived configuration.
 * Do not read import.meta.env outside this module.
 */

function readEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// #region agent log
fetch('http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7dae'},body:JSON.stringify({sessionId:'ea7dae',runId:'pre-fix',hypothesisId:'J',location:'env.ts:module',message:'env module evaluating',data:{hasApiKey:typeof import.meta.env.VITE_FIREBASE_API_KEY==='string'&&import.meta.env.VITE_FIREBASE_API_KEY.trim()!==''},timestamp:Date.now()})}).catch(()=>{});
// #endregion

export const env = {
  firebase: {
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
  },
} as const;
