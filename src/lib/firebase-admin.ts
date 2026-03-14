import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app;
try {
  if (getApps().length === 0) {
    const firebaseAdminConfig = {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "placeholder",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "placeholder@placeholder.iam.gserviceaccount.com",
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "placeholder").replace(/\\n/g, "\n"),
      }),
    };
    app = initializeApp(firebaseAdminConfig, "admin");
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.warn("Firebase Admin Initialization Error (ok during build):", error);
}

export const adminApp = app as any;
export const adminDb = (app ? getFirestore(app) : null) as any;

