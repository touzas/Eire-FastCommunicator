import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Phrase, Pictogram } from '../types';

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

    useEffect(() => {
        loadPhrases();
    }, []);

    const loadPhrases = async () => {
        try {
            setLoading(true);
            const storedPhrases = await AsyncStorage.getItem(STORAGE_KEY);
            if (storedPhrases) {
                setPhrases(JSON.parse(storedPhrases));
            } else {
                setPhrases(DUMMY_DATA);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_DATA));
            }
        } catch (error) {
            console.error('Error al cargar frases:', error);
            // Fallback to dummy data if storage fails
            setPhrases(DUMMY_DATA);
        } finally {
            setLoading(false);
        }
    };

    const savePhrases = async (newPhrases: Phrase[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPhrases));
            setPhrases(newPhrases);
        } catch (error) {
            console.error('Error al guardar frases:', error);
            // Still update state even if save fails
            setPhrases(newPhrases);
        }
    };

    const addPhrase = (text: string, pictograms: Pictogram[]) => {
        const newPhrase: Phrase = {
            id: Date.now().toString(),
            text,
            usage_count: 0,
            pictograms,
        };
        savePhrases([...phrases, newPhrase]);
    };

    const deletePhrase = (id: string) => {
        const newPhrases = phrases.filter((p) => p.id !== id);
        savePhrases(newPhrases);
    };

    const updatePhraseUsage = (id: string) => {
        const newPhrases = phrases.map((p) =>
            p.id === id ? { ...p, usage_count: p.usage_count + 1 } : p
        );
        savePhrases(newPhrases);
    };

    const updatePhrase = (id: string, text: string, pictograms: Pictogram[]) => {
        const newPhrases = phrases.map((p) =>
            p.id === id ? { ...p, text, pictograms } : p
        );
        savePhrases(newPhrases);
    };

    return (
        <PhrasesContext.Provider
            value={{ phrases, loading, addPhrase, updatePhrase, deletePhrase, updatePhraseUsage }}
        >
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
