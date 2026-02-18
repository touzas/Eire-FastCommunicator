import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Exports data as a JSON file.
 * Handles both Web (using Blob/download) and Native (using FileSystem/Sharing).
 * 
 * @param data The data to export
 * @param filename The name of the file (e.g., 'phrases.json')
 */
export const exportToJson = async (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);

    if (Platform.OS === 'web') {
        try {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[exportUtils] Web export error:', error);
            throw error;
        }
    } else {
        try {
            const fileUri = `${FileSystem.documentDirectory}${filename}`;
            await FileSystem.writeAsStringAsync(fileUri, jsonString, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Exportar frases',
                    UTI: 'public.json',
                });
            } else {
                throw new Error('Compartir no está disponible en este dispositivo');
            }
        } catch (error) {
            console.error('[exportUtils] Native export error:', error);
            throw error;
        }
    }
};
