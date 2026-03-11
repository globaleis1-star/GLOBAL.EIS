
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db,
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signOut,
  googleProvider,
  facebookProvider,
  appleProvider,
  microsoftProvider
} from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggingIn: boolean;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock user to bypass login requirement
  const [user, setUser] = useState<User | null>({
    uid: 'guest-user',
    displayName: 'زائر',
    email: 'guest@example.com',
    emailVerified: true,
    isAnonymous: true,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({})
  } as any);
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // We no longer need the Firebase auth listener for a "no-login" app
    setLoading(false);
  }, []);

  const loginWithGoogle = async () => {
    // Do nothing
  };

  const loginWithFacebook = async () => {
    // Do nothing
  };

  const loginWithApple = async () => {
    // Do nothing
  };

  const loginWithMicrosoft = async () => {
    // Do nothing
  };

  const logout = async () => {
    // Do nothing
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isLoggingIn,
      authError,
      setAuthError,
      loginWithGoogle, 
      loginWithFacebook, 
      loginWithApple, 
      loginWithMicrosoft, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
