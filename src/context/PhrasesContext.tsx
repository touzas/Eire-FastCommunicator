import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Phrase, Pictogram } from '../types';
import { urlToBase64 } from '../utils/imageUtils';

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

// TODO: Replace with your actual GitHub raw JSON URL
// Example: 'https://raw.githubusercontent.com/user/repo/main/phrases.json'
const REMOTE_JSON_URL = '';

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

    const processPhrasesImages = async (phrasesList: Phrase[]): Promise<Phrase[]> => {
        return await Promise.all(phrasesList.map(async (phrase) => {
            const updatedPictograms = await Promise.all(phrase.pictograms.map(async (pic) => {
                if (!pic.base64) {
                    const base64 = await urlToBase64(pic.url);
                    return { ...pic, base64: base64 || undefined };
                }
                return pic;
            }));
            return { ...phrase, pictograms: updatedPictograms };
        }));
    };

    const fetchRemotePhrases = async (): Promise<Phrase[] | null> => {
        if (!REMOTE_JSON_URL) return null;
        try {
            console.log('[PhrasesContext] Fetching remote phrases from:', REMOTE_JSON_URL);
            const response = await fetch(REMOTE_JSON_URL);
            if (!response.ok) throw new Error('Failed to fetch remote JSON');
            const data = await response.json();
            return data as Phrase[];
        } catch (error) {
            console.error('[PhrasesContext] Error fetching remote phrases:', error);
            return null;
        }
    };

    useEffect(() => {
        const initPhrases = async () => {
            setLoading(true);
            try {
                // 1. Try to load from Local Storage
                const storedData = await AsyncStorage.getItem(STORAGE_KEY);
                let currentPhrases: Phrase[] = storedData ? JSON.parse(storedData) : [];

                // 2. Try to fetch from Remote (GitHub) and merge if available
                const remotePhrases = await fetchRemotePhrases();
                if (remotePhrases) {
                    console.log('[PhrasesContext] Merging remote phrases');
                    // Simple merge strategy: use remote as base, keep local ones if they don't exist in remote
                    const phraseMap = new Map<string, Phrase>();
                    remotePhrases.forEach(p => phraseMap.set(p.id, p));
                    currentPhrases.forEach(p => {
                        if (!phraseMap.has(p.id)) {
                            phraseMap.set(p.id, p);
                        }
                    });
                    currentPhrases = Array.from(phraseMap.values());
                }

                // 3. Fallback to dummy data if empty
                if (currentPhrases.length === 0) {
                    currentPhrases = DUMMY_DATA;
                }

                // 4. Process images (Base64) for offline use
                const processed = await processPhrasesImages(currentPhrases);
                setPhrases(processed);

                // 5. Save back to AsyncStorage
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(processed));

            } catch (error) {
                console.error('[PhrasesContext] Initialization error:', error);
                setPhrases(DUMMY_DATA);
            } finally {
                setLoading(false);
            }
        };

        initPhrases();
    }, []);

    const addPhrase = async (text: string, pictograms: Pictogram[]) => {
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

        const updatedPhrases = [...phrases, newPhrase];
        setPhrases(updatedPhrases);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhrases));
    };

    const updatePhrase = async (id: string, text: string, pictograms: Pictogram[]) => {
        const phraseToUpdate = phrases.find(p => p.id === id);
        if (!phraseToUpdate) return;

        const processedPictograms = await Promise.all(pictograms.map(async (pic) => {
            if (!pic.base64) {
                const base64 = await urlToBase64(pic.url);
                return { ...pic, base64: base64 || undefined };
            }
            return pic;
        }));

        const updatedPhrase = { ...phraseToUpdate, text, pictograms: processedPictograms };
        const updatedPhrases = phrases.map(p => p.id === id ? updatedPhrase : p);

        setPhrases(updatedPhrases);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhrases));
    };

    const deletePhrase = async (id: string) => {
        const updatedPhrases = phrases.filter(p => p.id !== id);
        setPhrases(updatedPhrases);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhrases));
    };

    const updatePhraseUsage = async (id: string) => {
        const updatedPhrases = phrases.map(p =>
            p.id === id ? { ...p, usage_count: p.usage_count + 1 } : p
        );
        setPhrases(updatedPhrases);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhrases));
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
