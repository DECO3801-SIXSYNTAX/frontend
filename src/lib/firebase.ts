// Lightweight Firebase SDK bootstrapping for Auth + Firestore
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator, setPersistence, browserSessionPersistence, onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, collection, getDocs, doc, getDoc } from 'firebase/firestore'

const USE_FIREBASE = String(import.meta.env.VITE_USE_FIREBASE || 'false') === 'true'
const USE_EMULATOR = String(import.meta.env.VITE_FIREBASE_USE_EMULATOR || 'false') === 'true'

export function initFirebase() {
  if (!USE_FIREBASE) return null
  const apps = getApps()
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dev-key',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sipanit-dev',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || undefined,
  }
  const app = apps.length ? apps[0] : initializeApp(cfg)
  const auth = getAuth(app)
  const db = getFirestore(app)

  // Session-only persistence (no localStorage durable storage)
  setPersistence(auth, browserSessionPersistence).catch(() => {})

  if (USE_EMULATOR) {
    const authHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'
    const fsHost = import.meta.env.VITE_FIREBASE_FS_EMULATOR_HOST || '127.0.0.1:8080'
    try { connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true }) } catch {}
    try {
      const [host, portStr] = String(fsHost).split(':')
      connectFirestoreEmulator(db, host, Number(portStr || 8080))
    } catch {}
  }

  return { app, auth, db }
}

export async function firebaseSignIn(email: string, password: string) {
  const ctx = initFirebase()
  if (!ctx) throw new Error('Firebase not enabled')
  const { auth } = ctx
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export function firebaseOnAuth(cb: (user: any | null) => void) {
  const ctx = initFirebase()
  if (!ctx) return () => {}
  const { auth } = ctx
  return onAuthStateChanged(auth, cb)
}

export async function firebaseSignOut() {
  const ctx = initFirebase()
  if (!ctx) return
  await fbSignOut(ctx.auth)
}

// Firestore helpers
export async function fsList(collectionPath: string) {
  const ctx = initFirebase(); if (!ctx) throw new Error('Firebase not enabled')
  const { db } = ctx
  const snap = await getDocs(collection(db, collectionPath))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function fsGet(docPath: string) {
  const ctx = initFirebase(); if (!ctx) throw new Error('Firebase not enabled')
  const { db } = ctx
  const ref = doc(db, docPath)
  const s = await getDoc(ref)
  return s.exists() ? { id: s.id, ...s.data() } : null
}
