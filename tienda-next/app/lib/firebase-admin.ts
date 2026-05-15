
import admin from "firebase-admin";

console.log("[Firebase Admin] 1. Module imported");
console.log("[Firebase Admin] 2. Checking env vars...");
console.log("[Firebase Admin] FIREBASE_PROJECT_ID exists:", !!process.env.FIREBASE_PROJECT_ID);
console.log("[Firebase Admin] FIREBASE_CLIENT_EMAIL exists:", !!process.env.FIREBASE_CLIENT_EMAIL);
console.log("[Firebase Admin] FIREBASE_PRIVATE_KEY exists:", !!process.env.FIREBASE_PRIVATE_KEY);

if (!admin.apps.length) {
  try {
    console.log("[Firebase Admin] 3. Apps not initialized, starting init...");
    
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log("[Firebase Admin] 4. Using env vars to init...");
      
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
      console.log("[Firebase Admin] 5. Private key length:", privateKey.length);
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log("[Firebase Admin] 6. ✅ Initialized with env vars");
    } else {
      console.log("[Firebase Admin] 4. Using default credentials...");
      admin.initializeApp();
      console.log("[Firebase Admin] 6. ✅ Initialized with default credentials");
    }
  } catch (err) {
    console.error("[Firebase Admin] ❌ Initialization error:", err);
    throw err;
  }
} else {
  console.log("[Firebase Admin] 3. Already initialized, skipping...");
}

console.log("[Firebase Admin] 7. Getting Firestore instance...");
export const adminAuth = admin.auth();
export const db = admin.firestore();
console.log("[Firebase Admin] 8. ✅ Firestore instance ready");

export default admin;
