import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone: string, accessibilityNeeds?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'phone' | 'profileImage' | 'accessibilityNeeds'>>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            profileImage: userData.profileImage,
            accessibilityNeeds: userData.accessibilityNeeds || [],
            createdAt: new Date(), // Will be overridden by Firestore data if available
            updatedAt: new Date(),
          });
        } else {
          // If no user data in Firestore, create basic user
          const basicUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            email: firebaseUser.email!,
            phone: '',
            accessibilityNeeds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setUser(basicUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (email: string, password: string, name: string, phone: string, accessibilityNeeds?: string[]) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save user data to Firestore
      await setDoc(doc(db, 'users', uid), {
        name,
        email,
        phone,
        accessibilityNeeds: accessibilityNeeds || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'phone' | 'profileImage' | 'accessibilityNeeds'>>) => {
    if (!user) throw new Error('No user logged in');

    try {
      setError(null);
      await setDoc(doc(db, 'users', user.id), {
        ...updates,
        updatedAt: new Date(),
      }, { merge: true });

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateProfile, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
