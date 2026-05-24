import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { Result, ok, err } from "@/utils/result";

export async function login(
  email: string,
  password: string,
): Promise<Result<FirebaseUser>> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return ok(credential.user);
  } catch {
    return err("Correo o contraseña incorrectos. Intenta de nuevo.");
  }
}
export async function autoLogin(): Promise<void> {
  if (auth.currentUser) return;
  const email = process.env.EXPO_PUBLIC_ADMIN_EMAIL;
  const password = process.env.EXPO_PUBLIC_ADMIN_PASSWORD;
  if (!email || !password) return;
  await signInWithEmailAndPassword(auth, email, password).catch(() => {});
}

export async function logout(): Promise<Result<void>> {
  try {
    await signOut(auth);
    return ok(undefined);
  } catch {
    return err("No se pudo cerrar sesión. Intenta de nuevo.");
  }
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}
