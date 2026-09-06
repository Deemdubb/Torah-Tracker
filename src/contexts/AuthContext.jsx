import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { db, isLocalMode } from '@/lib/db';

const AuthContext = createContext(null);

// True when both describe the same signed-in user (or both are "nobody"). While we are still
// checking (prev === undefined) nothing counts as "the same", so the first answer always lands.
const sameUser = (prev, next) => prev !== undefined
  && (prev?.id ?? null) === (next?.id ?? null)
  && (prev?.email ?? null) === (next?.email ?? null)
  && (prev?.role ?? null) === (next?.role ?? null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still checking

  useEffect(() => {
    let alive = true;
    // Supabase reports the session again on every token refresh. Keeping the old object when
    // nothing changed stops the whole app from reloading (and flashing a spinner) each time.
    const apply = (u) => { if (alive) setUser((prev) => (sameUser(prev, u) ? prev : u)); };
    db.auth.getUser().then(apply).catch(() => apply(null));
    const off = db.auth.onChange(apply);
    return () => { alive = false; off && off(); };
  }, []);

  const value = useMemo(() => ({
    user: user || null,
    loading: user === undefined,
    isAdmin: user?.role === 'admin',
    isLocalMode,
    signInWithEmail: (email) => db.auth.signInWithEmail(email),
    signInWithPassword: (email, password) => db.auth.signInWithPassword(email, password),
    signUpWithPassword: (email, password) => db.auth.signUpWithPassword(email, password),
    updatePassword: (password) => db.auth.updatePassword(password),
    resendConfirmation: (email) => db.auth.resendConfirmation(email),
    signInWithGoogle: () => db.auth.signInWithGoogle(),
    signOut: async () => { await db.auth.signOut(); setUser(null); },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
