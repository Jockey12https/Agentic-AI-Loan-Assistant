// contexts/AuthContext.tsx - Authentication context provider
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email: string, password: string, name: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Generate customer ID in format: cust001, cust002, etc.
        const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
        const customerId = `cust${randomNum}`;

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            name,
            customerId,
            createdAt: new Date(),
            kycStatus: 'pending',
        });
    };

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);

        // Check if user profile exists, create if not
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists()) {
            // Generate customer ID in format: cust001, cust002, etc.
            const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
            const customerId = `cust${randomNum}`;

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: userCredential.user.email,
                name: userCredential.user.displayName || 'User',
                customerId,
                createdAt: new Date(),
                kycStatus: 'pending',
            });
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const value = {
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
