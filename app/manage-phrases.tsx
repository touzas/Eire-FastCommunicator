import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { PhraseEditorModal } from '../src/components/PhraseEditorModal';
import { PhraseItem } from '../src/components/PhraseItem';
import { usePhrases } from '../src/context/PhrasesContext';
import { Phrase, Pictogram } from '../src/types';

export default function ManagePhrasesScreen() {
    const { phrases, addPhrase, updatePhrase, deletePhrase } = usePhrases();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);

    const filteredPhrases = useMemo(() => {
        let result = phrases;
        if (searchQuery) {
            const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            result = result.filter((phrase) => {
                const phraseText = phrase.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return phraseText.includes(query);
            });
        }
        // Sort by usage count descending
        return result.sort((a, b) => b.usage_count - a.usage_count);
    }, [phrases, searchQuery]);

    const handleAddPhrase = () => {
        setEditingPhrase(null);
        setIsModalVisible(true);
    };

    const handleEditPhrase = (phrase: Phrase) => {
        setEditingPhrase(phrase);
        setIsModalVisible(true);
    };

    const handleDeletePhrase = (phrase: Phrase) => {
        Alert.alert(
            'Eliminar Frase',
            `¿Estás seguro de que quieres eliminar "${phrase.text}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => deletePhrase(phrase.id),
                },
            ]
        );
    };

    const handleSavePhrase = (text: string, pictograms: Pictogram[]) => {
        if (editingPhrase) {
            updatePhrase(editingPhrase.id, text, pictograms);
        } else {
            addPhrase(text, pictograms);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar frases..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={filteredPhrases}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PhraseItem
                        phrase={item}
                        showManageControls
                        onEdit={() => handleEditPhrase(item)}
                        onDelete={() => handleDeletePhrase(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No hay frases guardadas.</Text>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleAddPhrase}>
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            <PhraseEditorModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSave={handleSavePhrase}
                initialPhrase={editingPhrase}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#4A90E2',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.3)',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 40,
        fontSize: 16,
    },
});
