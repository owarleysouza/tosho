 import { initializeApp } from "firebase/app";
 
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: "tosho-web",
  storageBucket: "tosho-web.appspot.com",
  messagingSenderId: "857281222669",
  appId: "1:857281222669:web:1d2f0b2cfc99d434b41d44"
};
 
export const firebaseApp = initializeApp(firebaseConfig);