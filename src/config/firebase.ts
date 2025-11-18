import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import Constants from "expo-constants";


const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra;

if (!extra || !extra.firebase) {
  throw new Error("Firebase configuration not found in Expo Constants.");
}


const firebaseConfig = extra.firebase;

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); 
export default app;