import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { Phrase, Pictogram } from '../types';
import { urlToBase64 } from '../utils/imageUtils';
import { useAuth } from './AuthContext';

interface PhrasesContextType {
    phrases: Phrase[];
    loading: boolean;
    addPhrase: (text: string, pictograms: Pictogram[]) => void;
    updatePhrase: (id: string, text: string, pictograms: Pictogram[]) => void;
    deletePhrase: (id: string) => void;
    updatePhraseUsage: (id: string) => void;
}

const PhrasesContext = createContext<PhrasesContextType | undefined>(undefined);

const STORAGE_KEY = 'phrases_data';

const DUMMY_DATA: Phrase[] = [
    {
        id: '1',
        text: 'Quiero agua',
        usage_count: 10,
        pictograms: [
            { word: 'Quiero', url: 'https://api.arasaac.org/api/pictograms/36994' },
            { word: 'agua', url: 'https://api.arasaac.org/api/pictograms/2349' },
        ],
    },
    {
        id: '2',
        text: 'Tengo hambre',
        usage_count: 5,
        pictograms: [
            { word: 'Tengo', url: 'https://api.arasaac.org/api/pictograms/36994' },
            { word: 'hambre', url: 'https://api.arasaac.org/api/pictograms/5486' },
        ],
    },
    {
        id: '3',
        text: 'Hola',
        usage_count: 15,
        pictograms: [
            { word: 'Hola', url: 'https://api.arasaac.org/api/pictograms/5510' },
        ],
    },
];

export const PhrasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [phrases, setPhrases] = useState<Phrase[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const initPhrases = async () => {
            setLoading(true);
            try {
                if (user && db) {
                    // Firestore Mode
                    const q = query(collection(db, 'users', user.uid, 'phrases'));
                    unsubscribe = onSnapshot(q, async (snapshot) => {
                        const remotePhrases: Phrase[] = [];
                        snapshot.forEach((doc) => {
                            remotePhrases.push(doc.data() as Phrase);
                        });

                        // Process images for offline storage (Base64)
                        const processedPhrases = await Promise.all(remotePhrases.map(async (phrase) => {
                            const updatedPictograms = await Promise.all(phrase.pictograms.map(async (pic) => {
                                if (!pic.base64) {
                                    const base64 = await urlToBase64(pic.url);
                                    return { ...pic, base64: base64 || undefined };
                                }
                                return pic;
                            }));
                            return { ...phrase, pictograms: updatedPictograms };
                        }));

                        setPhrases(processedPhrases);
                        setLoading(false);

                        // Sync to local storage for offline backup
                        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(processedPhrases)).catch(err => {
                            console.error('Error syncing to local storage:', err);
                        });
                    }, (error) => {
                        console.error("Firestore error:", error);
                        // Fallback to local storage on error
                        loadLocalPhrases();
                    });
                } else {
                    // Local Storage Mode
                    await loadLocalPhrases();
                }
            } catch (error) {
                console.error('Error initializing phrases:', error);
                await loadLocalPhrases();
            }
        };

        const loadLocalPhrases = async () => {
            try {
                const storedPhrases = await AsyncStorage.getItem(STORAGE_KEY);
                if (storedPhrases) {
                    setPhrases(JSON.parse(storedPhrases));
                } else {
                    setPhrases(DUMMY_DATA);
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_DATA));
                }
            } catch (error) {
                console.error('Error loading local phrases:', error);
                setPhrases(DUMMY_DATA);
            } finally {
                setLoading(false);
            }
        };

        initPhrases();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user]);

    const addPhrase = async (text: string, pictograms: Pictogram[]) => {
        // Convert images to Base64 first
        const processedPictograms = await Promise.all(pictograms.map(async (pic) => {
            const base64 = await urlToBase64(pic.url);
            return { ...pic, base64: base64 || undefined };
        }));

        const newPhrase: Phrase = {
            id: Date.now().toString(),
            text,
            pictograms: processedPictograms,
            usage_count: 0,
        };

        if (user && db) {
            // Save to Firestore
            const phraseRef = doc(db, 'users', user.uid, 'phrases', newPhrase.id);
            setDoc(phraseRef, newPhrase).catch(error => {
                console.error('Error adding phrase to Firestore:', error);
                // Fallback to local
                saveLocalPhrase(newPhrase);
            });
        } else {
            // Save to local storage
            saveLocalPhrase(newPhrase);
        }
    };

    const saveLocalPhrase = async (newPhrase: Phrase) => {
        try {
            const updatedPhrases = [...phrases, newPhrase];
            setPhrases(updatedPhrases);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhrases));
        } catch (error) {
            console.error('Error saving phrase locally:', error);
        }
    };

    const updatePhrase = async (id: string, text: string, pictograms: Pictogram[]) => {
        const updatedPhrase = phrases.find(p => p.id === id);
        if (!updatedPhrase) return;

        // Convert images if needed
        const processedPictograms = await Promise.all(pictograms.map(async (pic) => {
            if (!pic.base64) {
                const base64 = await urlToBase64(pic.url);
                return { ...pic, base64: base64 || undefined };
            }
            return pic;
        }));

        const newPhrase = { ...updatedPhrase, text, pictograms: processedPictograms };

        if (user && db) {
            // Update in Firestore
            const phraseRef = doc(db, 'users', user.uid, 'phrases', id);
            setDoc(phraseRef, newPhrase).catch(error => {
                console.error('Error updating phrase in Firestore:', error);
                updateLocalPhrase(id, newPhrase);
            });
        } else {
            // Update in local storage
            updateLocalPhrase(id, newPhrase);
        }
    };

    const updateLocalPhrase = async (id: string, newPhrase: Phrase) => {
        try {
            const updatedPhrases = phrases.map(p => p.id === id ? newPhrase : p);
            setPhrases(updatedPhrases);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhrases));
        } catch (error) {
            console.error('Error updating phrase locally:', error);
        }
    };

    const deletePhrase = (id: string) => {
        if (user && db) {
            // Delete from Firestore
            const phraseRef = doc(db, 'users', user.uid, 'phrases', id);
            deleteDoc(phraseRef).catch(error => {
                console.error('Error deleting phrase from Firestore:', error);
                deleteLocalPhrase(id);
            });
        } else {
            // Delete from local storage
            deleteLocalPhrase(id);
        }
    };

    const deleteLocalPhrase = async (id: string) => {
        try {
            const updatedPhrases = phrases.filter(p => p.id !== id);
            setPhrases(updatedPhrases);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhrases));
        } catch (error) {
            console.error('Error deleting phrase locally:', error);
        }
    };

    const updatePhraseUsage = (id: string) => {
        const phrase = phrases.find(p => p.id === id);
        if (!phrase) return;

        const updatedPhrase = { ...phrase, usage_count: phrase.usage_count + 1 };

        if (user && db) {
            // Update in Firestore
            const phraseRef = doc(db, 'users', user.uid, 'phrases', id);
            setDoc(phraseRef, updatedPhrase).catch(error => {
                console.error('Error updating usage in Firestore:', error);
            });
        } else {
            // Update in local storage
            updateLocalPhrase(id, updatedPhrase);
        }
    };

    return (
        <PhrasesContext.Provider value={{ phrases, loading, addPhrase, updatePhrase, deletePhrase, updatePhraseUsage }}>
            {children}
        </PhrasesContext.Provider>
    );
};

export const usePhrases = () => {
    const context = useContext(PhrasesContext);
    if (!context) {
        throw new Error('usePhrases must be used within a PhrasesProvider');
    }
    return context;
};
