import React, { createContext, useContext, useEffect, useState } from 'react';
import { Phrase, Pictogram } from '../types';
import { urlToBase64 } from '../utils/imageUtils';
import { useStorage } from './StorageContext';

interface PhrasesContextType {
    phrases: Phrase[];
    loading: boolean;
    addPhrase: (text: string, pictograms: Pictogram[], type?: 'word' | 'phrase') => Promise<Phrase>;
    updatePhrase: (id: string, text: string, pictograms: Pictogram[], type?: 'word' | 'phrase') => void;
    deletePhrase: (id: string) => void;
    updatePhraseUsage: (id: string) => void;
    resetPhrases: () => Promise<void>;
}

const PhrasesContext = createContext<PhrasesContextType | undefined>(undefined);

const STORAGE_KEY = 'phrases_data';

import localPhrases from '../../assets/data/phrases.json';
const DUMMY_DATA: Phrase[] = localPhrases as Phrase[];

export const PhrasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { saveData, loadData, removeData } = useStorage();
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

    const savePhrases = async (updatedPhrases: Phrase[]) => {
        await saveData(STORAGE_KEY, updatedPhrases);
    };

    const resetPhrases = async () => {
        setLoading(true);
        // Reset to ONLY defaults
        const processed = await processPhrasesImages(DUMMY_DATA);
        setPhrases(processed);
        await saveData(STORAGE_KEY, processed);
        setLoading(false);
    };

    useEffect(() => {
        const initPhrases = async () => {
            setLoading(true);
            try {
                const storedPhrases = await loadData<Phrase[]>(STORAGE_KEY) || [];

                // Merge logic:
                // 1. Keep everything from local storage (including user modifications to default phrases)
                // 2. Add phrases from DUMMY_DATA that are NOT already in local storage by ID
                const storedIds = new Set(storedPhrases.map(p => p.id));
                const newFromDefaults = DUMMY_DATA.filter(p => !storedIds.has(p.id));

                const mergedPhrases = [...storedPhrases, ...newFromDefaults];

                const processed = await processPhrasesImages(mergedPhrases);
                setPhrases(processed);

                // If we found new phrases in defaults, update storage
                if (newFromDefaults.length > 0) {
                    await saveData(STORAGE_KEY, processed);
                }

            } catch (error) {
                console.error('[PhrasesContext] Initialization error:', error);
                setPhrases(DUMMY_DATA);
            } finally {
                setLoading(false);
            }
        };

        initPhrases();
    }, [loadData, saveData]);

    const addPhrase = async (text: string, pictograms: Pictogram[], type: 'word' | 'phrase' = 'phrase'): Promise<Phrase> => {
        const processedPictograms = await Promise.all(pictograms.map(async (pic) => {
            const base64 = await urlToBase64(pic.url);
            return { ...pic, base64: base64 || undefined };
        }));

        const newPhrase: Phrase = {
            id: Date.now().toString(),
            text,
            pictograms: processedPictograms,
            usage_count: 0,
            type,
        };

        return new Promise((resolve) => {
            setPhrases(prev => {
                const updated = [...prev, newPhrase];
                savePhrases(updated);
                setTimeout(() => resolve(newPhrase), 0);
                return updated;
            });
        });
    };

    const updatePhrase = async (id: string, text: string, pictograms: Pictogram[], type: 'word' | 'phrase' = 'phrase') => {
        const processedPictograms = await Promise.all(pictograms.map(async (pic) => {
            if (!pic.base64) {
                const base64 = await urlToBase64(pic.url);
                return { ...pic, base64: base64 || undefined };
            }
            return pic;
        }));

        setPhrases(prev => {
            const updated = prev.map(p => p.id === id ? { ...p, text, pictograms: processedPictograms, type } : p);
            savePhrases(updated);
            return updated;
        });
    };

    const deletePhrase = async (id: string) => {
        setPhrases(prev => {
            const updated = prev.filter(p => p.id !== id);
            savePhrases(updated);
            return updated;
        });
    };

    const updatePhraseUsage = async (id: string) => {
        setPhrases(prev => {
            const updated = prev.map(p =>
                p.id === id ? { ...p, usage_count: p.usage_count + 1 } : p
            );
            savePhrases(updated);
            return updated;
        });
    };

    return (
        <PhrasesContext.Provider value={{ phrases, loading, addPhrase, updatePhrase, deletePhrase, updatePhraseUsage, resetPhrases }}>
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
