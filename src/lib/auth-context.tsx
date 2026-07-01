import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  browserLocalPersistence,
  setPersistence,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebase, isFirebaseConfigured } from "./firebase";
import type { UserProfile } from "./types";

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: User) => {
    const { db } = getFirebase();
    if (!db) return;
    const snap = await getDoc(doc(db, "users", u.uid));
    setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
  };

  useEffect(() => {
    const { auth } = getFirebase();
    if (!auth) {
      setLoading(false);
      return;
    }
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await loadProfile(u);
      else setProfile(null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { auth } = getFirebase();
    if (!auth) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const { auth } = getFirebase();
    if (!auth) throw new Error("Firebase not configured");
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInGoogle = async () => {
    const { auth } = getFirebase();
    if (!auth) throw new Error("Firebase not configured");
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const signOut = async () => {
    const { auth } = getFirebase();
    if (!auth) return;
    await fbSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    const { auth } = getFirebase();
    if (!auth) throw new Error("Firebase not configured");
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        loading,
        configured: isFirebaseConfigured,
        signIn,
        signUp,
        signInGoogle,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
