import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  User,
  testConnection,
} from '../firebase/config';
import { isAuthorizedPartnerEmail, getPartnerInfo } from '../config/partners';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  partnerInfo: ReturnType<typeof getPartnerInfo>;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Test connection on boot per Firebase guidelines
    testConnection().catch((err) => {
      console.warn('Initial connection probe:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      if (!isAuthorizedPartnerEmail(email)) {
        // User is not in the two-partner allowlist
        setAuthError(
          `Access restricted. The account (${email || 'unknown'}) is not in the private two-partner allowlist for Our ShadowCore. Please sign in with an authorized partner account.`
        );
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.error('Sign-in error:', err);
        setAuthError(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAuthError(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
      setAuthError(err?.message || 'Failed to sign out.');
    }
  };

  const isAuthorized = !!user && isAuthorizedPartnerEmail(user.email);
  const partnerInfo = getPartnerInfo(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthorized,
        partnerInfo,
        authError,
        signInWithGoogle,
        signOut,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
