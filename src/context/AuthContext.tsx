import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signOut as firebaseSignOut, GoogleAuthProvider, signInWithCredential, signInWithPopup, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { auth } from '../firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '857373501480-p6g6g6g6g6g6g6g6g6g6g6g6g6g6g6g6.apps.googleusercontent.com',
    });

    useEffect(() => {
        if (!auth) {
            console.error('Firebase auth not initialized');
            setLoading(false);
            return;
        }

        try {
            const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
                setUser(user);
                setLoading(false);
            });
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up auth listener:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential).catch((error: any) => {
                console.error('Error signing in with credential:', error);
            });
        }
    }, [response]);

    const signInWithGoogle = async () => {
        try {
            if (Platform.OS === 'web') {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
            } else {
                if (request) {
                    await promptAsync();
                } else {
                    console.warn("Google Auth request not ready");
                }
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
