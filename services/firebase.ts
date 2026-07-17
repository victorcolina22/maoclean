import { initializeApp, getApps } from 'firebase/app'
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
}

const isNewApp = getApps().length === 0
const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0]

// Persist the session per-device via AsyncStorage — required for the
// multi-account role model (each device stays logged in as its own
// owner/employee account across restarts, instead of everyone sharing one
// auto-logged-in admin session).
// TODO(cleanup): temporary diagnostic try/catch — remove once persistence
// is confirmed working across a real app restart.
let persistedAuth
try {
  persistedAuth = isNewApp
    ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
    : getAuth(app)
  console.log('[firebase] initializeAuth with getReactNativePersistence succeeded, isNewApp=', isNewApp)
} catch (e) {
  console.error('[firebase] initializeAuth with getReactNativePersistence THREW:', e)
  persistedAuth = getAuth(app)
}
export const auth = persistedAuth

export const db = getFirestore(app)
