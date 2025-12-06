'use client';

// config/firebase.ts - Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Validate Firebase config
const isValidFirebaseConfig = () => {
    return (
        firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId &&
        firebaseConfig.appId
    );
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== 'undefined') {
    if (isValidFirebaseConfig()) {
        if (!getApps().length) {
            try {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);
                
                // Use session persistence only - user logs out when browser is closed
                setPersistence(auth, browserSessionPersistence).catch(error => {
                    console.warn('Could not set persistence:', error);
                });
            } catch (error) {
                console.error('Firebase initialization error:', error);
            }
        } else {
            app = getApps()[0];
            auth = getAuth(app);
            db = getFirestore(app);
            
            // Ensure session persistence is set
            if (auth) {
                setPersistence(auth, browserSessionPersistence).catch(error => {
                    console.warn('Could not set persistence:', error);
                });
            }
        }
    } else {
        console.warn('Firebase config is incomplete. Please check your environment variables.');
    }
}

export { app, auth, db };
