import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Phrase, Pictogram } from '../types';
import { COMMON_PICTOGRAMS, searchPictograms } from '../utils/arasaac';

interface PhraseEditorModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (text: string, pictograms: Pictogram[]) => void;
    initialPhrase?: Phrase | null;
}

export const PhraseEditorModal: React.FC<PhraseEditorModalProps> = ({
    visible,
    onClose,
    onSave,
    initialPhrase,
}) => {
    const [text, setText] = useState('');
    const [selectedPictograms, setSelectedPictograms] = useState<Pictogram[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Pictogram[]>(COMMON_PICTOGRAMS);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (initialPhrase) {
            setText(initialPhrase.text);
            setSelectedPictograms(initialPhrase.pictograms);
        } else {
            setText('');
            setSelectedPictograms([]);
        }
        setSearchQuery('');
        setSearchResults(COMMON_PICTOGRAMS);
    }, [initialPhrase, visible]);

    useEffect(() => {
        const searchTimeout = setTimeout(async () => {
            if (searchQuery.trim()) {
                setIsSearching(true);
                const results = await searchPictograms(searchQuery, 15);
                setSearchResults(results.length > 0 ? results : COMMON_PICTOGRAMS);
                setIsSearching(false);
            } else {
                setSearchResults(COMMON_PICTOGRAMS);
            }
        }, 500); // Debounce search

        return () => clearTimeout(searchTimeout);
    }, [searchQuery]);

    const handleSave = () => {
        if (text.trim()) {
            onSave(text, selectedPictograms);
            onClose();
        }
    };

    const addPictogram = (pic: Pictogram) => {
        // Avoid duplicates
        if (!selectedPictograms.find(p => p.url === pic.url)) {
            setSelectedPictograms([...selectedPictograms, pic]);
            // Auto-append text if needed
            if (!text.includes(pic.word)) {
                setText(prev => prev ? `${prev} ${pic.word}` : pic.word);
            }
        }
    };

    const removePictogram = (index: number) => {
        const newPics = [...selectedPictograms];
        newPics.splice(index, 1);
        setSelectedPictograms(newPics);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelButton}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {initialPhrase ? 'Editar Frase' : 'Nueva Frase'}
                    </Text>
                    <TouchableOpacity onPress={handleSave} disabled={!text.trim()}>
                        <Text style={[styles.saveButton, !text.trim() && styles.disabledButton]}>
                            Guardar
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={styles.label}>Frase:</Text>
                    <TextInput
                        style={styles.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="Escribe la frase aquí..."
                        autoFocus
                        multiline
                    />

                    <Text style={styles.label}>Pictogramas seleccionados:</Text>
                    <View style={styles.selectedPictograms}>
                        {selectedPictograms.map((pic, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => removePictogram(index)}
                                style={styles.selectedPictogramWrapper}
                            >
                                <Image source={{ uri: pic.url }} style={styles.pictogramImage} />
                                <Text style={styles.pictogramWord} numberOfLines={1}>{pic.word}</Text>
                                <View style={styles.removeBadge}>
                                    <Ionicons name="close" size={12} color="white" />
                                </View>
                            </TouchableOpacity>
                        ))}
                        {selectedPictograms.length === 0 && (
                            <Text style={styles.emptyHint}>Toca los pictogramas abajo para añadir</Text>
                        )}
                    </View>

                    <Text style={styles.label}>Buscar pictogramas:</Text>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar en ARASAAC..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {isSearching && <ActivityIndicator size="small" color="#4A90E2" />}
                    </View>

                    {isSearching ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4A90E2" />
                            <Text style={styles.loadingText}>Buscando pictogramas...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={searchResults}
                            numColumns={4}
                            key={'grid'}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(item, index) => `${item.url}-${index}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.pictogramOption}
                                    onPress={() => addPictogram(item)}
                                >
                                    <Image source={{ uri: item.url }} style={styles.pictogramImage} />
                                    <Text style={styles.pictogramWord} numberOfLines={2}>{item.word}</Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.pictogramGrid}
                            ListEmptyComponent={
                                <Text style={styles.emptyHint}>No se encontraron pictogramas</Text>
                            }
                        />
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: 'white',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        fontSize: 16,
        color: '#E25C5C',
    },
    saveButton: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    disabledButton: {
        color: '#ccc',
    },
    content: {
        padding: 16,
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
        color: '#333',
    },
    input: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        minHeight: 60,
        textAlignVertical: 'top',
    },
    selectedPictograms: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        minHeight: 80,
        alignItems: 'center',
    },
    selectedPictogramWrapper: {
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 8,
        position: 'relative',
        width: 60,
    },
    removeBadge: {
        position: 'absolute',
        top: -5,
        right: 0,
        backgroundColor: '#E25C5C',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyHint: {
        color: '#999',
        fontStyle: 'italic',
        fontSize: 14,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    pictogramGrid: {
        paddingVertical: 8,
    },
    pictogramOption: {
        width: '22%',
        margin: '1.5%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    pictogramImage: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    pictogramWord: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
    },
});
