import AsyncStorage from '@react-native-async-storage/async-storage';
import { Persistence } from 'firebase/auth';

export const ReactNativePersistence: Persistence = {
    type: 'LOCAL',
    _isAvailable: async () => {
        return true;
    },
    _set: async (key: string, value: any) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error setting persistence:', error);
        }
    },
    _get: async (key: string) => {
        try {
            const json = await AsyncStorage.getItem(key);
            return json ? JSON.parse(json) : null;
        } catch (error) {
            console.error('Error getting persistence:', error);
            return null;
        }
    },
    _remove: async (key: string) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing persistence:', error);
        }
    },
    _addListener: () => { },
    _removeListener: () => { },
} as unknown as Persistence;
