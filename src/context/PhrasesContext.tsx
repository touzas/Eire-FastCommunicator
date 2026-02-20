import React, { createContext, useContext, useEffect, useState } from 'react';
import { Phrase, Pictogram } from '../types';
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


    const savePhrases = async (updatedPhrases: Phrase[]) => {
        await saveData(STORAGE_KEY, updatedPhrases);
    };

    const resetPhrases = async () => {
        setLoading(true);
        // Reset to ONLY defaults
        setPhrases(DUMMY_DATA);
        await saveData(STORAGE_KEY, DUMMY_DATA);
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
                setPhrases(mergedPhrases);

                // If we found new phrases in defaults, update storage
                if (newFromDefaults.length > 0) {
                    await saveData(STORAGE_KEY, mergedPhrases);
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
        const newPhrase: Phrase = {
            id: Date.now().toString(),
            text,
            pictograms,
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
        setPhrases(prev => {
            const updated = prev.map(p => p.id === id ? { ...p, text, pictograms, type } : p);
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
