import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db,storage } from '../services/firebase';

export async function registerUser(name, email, password) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  await updateProfile(credential.user, {
    displayName: name.trim(),
  });

  await setDoc(doc(db, 'users', credential.user.uid), {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}