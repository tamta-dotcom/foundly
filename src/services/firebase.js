
import { initializeApp, getApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDwKHCGHG7oKbvqeHAUN48b9hWfWccqaqw",
  authDomain: "foundly-f8cdb.firebaseapp.com",
  projectId: "foundly-f8cdb",
  storageBucket: "foundly-f8cdb.firebasestorage.app",
  messagingSenderId: "422835928659",
  appId: "1:422835928659:web:c7fa0711d9a2365e3a10a6",
  measurementId: "G-DS13BQ5JBR",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  if (error.code === "auth/already-initialized") {
    const { getAuth } = require("firebase/auth");
    auth = getAuth(app);
  } else {
    throw error;
  }
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
