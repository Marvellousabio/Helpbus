import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";


const extra = (Constants.expoConfig as any)?.extra ?? (Constants.manifest as any)?.extra;

if (!extra || !extra.firebase) {
  throw new Error("Firebase configuration not found in Expo Constants.");
}


const firebaseConfig = extra.firebase;

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// For React Native, persistence is set automatically, but we can set it if needed
// setPersistence(auth, browserLocalPersistence); // Adjust based on platform
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
export default app;