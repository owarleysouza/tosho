 import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APPLICATION_ID
};

const firebaseApp = initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
// Optional fields (e.g. Product.quantity/description) are only ever
// omitted by leaving them `undefined` in JS — Firestore's set()/addDoc()
// throw on that by default. This makes it write those fields as simply
// absent instead, matching what "optional" is supposed to mean.
export const db = initializeFirestore(firebaseApp, {
  ignoreUndefinedProperties: true,
})