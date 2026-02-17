import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext } from 'react';

interface StorageContextType {
    saveData: (key: string, value: any) => Promise<void>;
    loadData: <T>(key: string) => Promise<T | null>;
    removeData: (key: string) => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider = ({ children }: { children: React.ReactNode }) => {

    const saveData = useCallback(async (key: string, value: any) => {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
        } catch (error) {
            console.error(`[StorageContext] Error saving ${key}:`, error);
            throw error;
        }
    }, []);

    const loadData = useCallback(async <T,>(key: string): Promise<T | null> => {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (error) {
            console.error(`[StorageContext] Error loading ${key}:`, error);
            return null;
        }
    }, []);

    const removeData = useCallback(async (key: string) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`[StorageContext] Error removing ${key}:`, error);
            throw error;
        }
    }, []);

    return (
        <StorageContext.Provider value={{ saveData, loadData, removeData }}>
            {children}
        </StorageContext.Provider>
    );
};

export const useStorage = () => {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error('useStorage must be used within a StorageProvider');
    }
    return context;
};
