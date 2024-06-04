 import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
 
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: "tosho-web",
  storageBucket: "tosho-web.appspot.com",
  messagingSenderId: "857281222669",
  appId: "1:857281222669:web:1d2f0b2cfc99d434b41d44"
};

export const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)
 
export default auth;