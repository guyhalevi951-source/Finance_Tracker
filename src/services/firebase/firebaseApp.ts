import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { env } from '../../config/env';

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { env } from '../../config/env';

function createFirebaseApp() {
  try {
    const app = initializeApp(env.firebase);
    // #region agent log
    fetch('http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7dae'},body:JSON.stringify({sessionId:'ea7dae',runId:'pre-fix',hypothesisId:'J',location:'firebaseApp.ts:init',message:'firebase initializeApp succeeded',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return app;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7dae'},body:JSON.stringify({sessionId:'ea7dae',runId:'pre-fix',hypothesisId:'J',location:'firebaseApp.ts:init',message:'firebase initializeApp threw',data:{errorName:error instanceof Error?error.name:'unknown',errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

const firebaseApp = createFirebaseApp();

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export { firebaseApp };
