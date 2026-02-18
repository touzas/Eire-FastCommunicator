import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhraseEditorModal } from '../src/components/PhraseEditorModal';
import { PhraseItem } from '../src/components/PhraseItem';
import { usePhrases } from '../src/context/PhrasesContext';
import { Phrase, Pictogram } from '../src/types';

import { exportToJson } from '../src/utils/exportUtils';
import { isTablet, moderateScale, scale } from '../src/utils/responsive';

export default function ManagePhrasesScreen() {
    const router = useRouter();
    const { phrases, addPhrase, updatePhrase, deletePhrase } = usePhrases();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [phraseToDelete, setPhraseToDelete] = useState<Phrase | null>(null);

    const filteredPhrases = useMemo(() => {
        let result = phrases;
        if (searchQuery) {
            const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            result = result.filter((phrase) => {
                const phraseText = phrase.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return phraseText.includes(query);
            });
        }
        // Create a new array before sorting to avoid mutating the original phrases state
        return [...result].sort((a, b) => b.usage_count - a.usage_count);
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
        setPhraseToDelete(phrase);
        setIsDeleteModalVisible(true);
    };

    const confirmDelete = () => {
        if (phraseToDelete) {
            deletePhrase(phraseToDelete.id);
            setIsDeleteModalVisible(false);
            setPhraseToDelete(null);
        }
    };

    const handleSavePhrase = (text: string, pictograms: Pictogram[], type: 'word' | 'phrase') => {
        if (editingPhrase) {
            updatePhrase(editingPhrase.id, text, pictograms, type);
        } else {
            addPhrase(text, pictograms, type);
        }
    };

    const handleClearCache = () => {
        Alert.alert(
            'Limpiar Caché',
            'Esto recargará las frases desde el archivo base. Los cambios no guardados se perderán. ¿Continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpiar',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('phrases_data');
                        Alert.alert('Éxito', 'Caché limpiado. Por favor, reinicia la aplicación para cargar los datos frescos.');
                    },
                },
            ]
        );
    };

    const handleExport = async () => {
        try {
            await exportToJson(phrases, 'phrases.json');
            if (Platform.OS === 'web') {
                Alert.alert('Éxito', 'Las frases se han exportado correctamente.');
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo exportar el archivo.');
        }
    };

    const numColumns = isTablet() ? 3 : 2;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={scale(24)} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestionar Frases</Text>
                <View style={styles.headerRightButtons}>
                    <TouchableOpacity onPress={handleExport} style={styles.headerButton}>
                        <Ionicons name="download-outline" size={scale(24)} color="#4A90E2" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClearCache} style={styles.headerButton}>
                        <Ionicons name="refresh" size={scale(24)} color="#4A90E2" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={scale(20)} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar frases..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={scale(20)} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                key={isTablet() ? 'tablet-grid' : 'mobile-grid'}
                data={filteredPhrases}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                columnWrapperStyle={styles.row}
                renderItem={({ item }) => (
                    <View style={[styles.gridItem, { width: `${96 / numColumns}%` }]}>
                        <PhraseItem
                            phrase={item}
                            showManageControls
                            onEdit={() => handleEditPhrase(item)}
                            onDelete={() => handleDeletePhrase(item)}
                            compact
                        />
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No hay frases guardadas.</Text>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleAddPhrase}>
                <Ionicons name="add" size={scale(30)} color="white" />
            </TouchableOpacity>

            <PhraseEditorModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSave={handleSavePhrase}
                initialPhrase={editingPhrase}
            />

            {/* Custom Delete Confirmation Modal */}
            <Modal
                transparent
                visible={isDeleteModalVisible}
                animationType="fade"
                onRequestClose={() => setIsDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <Ionicons name="trash-outline" size={scale(48)} color="#E25C5C" style={styles.modalIcon} />
                        <Text style={styles.modalTitle}>¿Eliminar frase?</Text>
                        <Text style={styles.modalMessage}>
                            Estás a punto de eliminar "{phraseToDelete?.text}". Esta acción no se puede deshacer.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsDeleteModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteConfirmButton]}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.deleteButtonText}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(16),
        paddingVertical: scale(12),
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    backButton: {
        padding: scale(8),
    },
    headerRightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: scale(8),
        marginLeft: scale(4),
    },
    searchContainer: {
        padding: scale(16),
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: scale(10),
        borderRadius: scale(10),
    },
    searchInput: {
        flex: 1,
        marginLeft: scale(8),
        fontSize: moderateScale(16),
    },
    listContent: {
        padding: scale(10),
        paddingBottom: scale(80),
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: scale(8),
    },
    gridItem: {
        marginBottom: scale(12),
    },
    fab: {
        position: 'absolute',
        bottom: scale(24),
        right: scale(24),
        backgroundColor: '#4A90E2',
        width: scale(56),
        height: scale(56),
        borderRadius: scale(28),
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.3)',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: scale(40),
        fontSize: moderateScale(16),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: scale(20),
    },
    confirmModal: {
        backgroundColor: 'white',
        borderRadius: scale(24),
        padding: scale(24),
        width: '85%',
        maxWidth: scale(340),
        alignItems: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    },
    modalIcon: {
        marginBottom: scale(12),
    },
    modalTitle: {
        fontSize: moderateScale(20),
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: scale(8),
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: moderateScale(15),
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: scale(24),
        lineHeight: moderateScale(22),
    },
    modalButtons: {
        flexDirection: 'row',
        gap: scale(12),
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: scale(12),
        borderRadius: scale(14),
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    deleteConfirmButton: {
        backgroundColor: '#EF4444',
    },
    cancelButtonText: {
        color: '#4B5563',
        fontSize: moderateScale(15),
        fontWeight: '700',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: moderateScale(15),
        fontWeight: '700',
    },
});
