import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePhrases } from '../src/context/PhrasesContext';
import { Phrase, Pictogram } from '../src/types';

export default function MainScreen() {
    const router = useRouter();
    const { phrases, updatePhraseUsage } = usePhrases();
    const [searchQuery, setSearchQuery] = useState('');
    const [builtPhrase, setBuiltPhrase] = useState<{ text: string; pictograms: Pictogram[] }>({
        text: '',
        pictograms: [],
    });
    const searchInputRef = React.useRef<TextInput>(null);
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);


    const filteredPhrases = useMemo(() => {
        if (!searchQuery) return [];
        const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return phrases
            .filter((phrase) => {
                const phraseText = phrase.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return phraseText.includes(query);
            })
            .sort((a, b) => {
                // Sort by length first (shorter first)
                if (a.text.length !== b.text.length) {
                    return a.text.length - b.text.length;
                }
                // Then alphabetically
                return a.text.localeCompare(b.text);
            });
    }, [phrases, searchQuery]);

    const addToBuilder = (phrase: Phrase) => {
        setBuiltPhrase((prev) => {
            // If the new phrase starts with the current text, just use the new phrase
            if (prev.text && phrase.text.toLowerCase().startsWith(prev.text.toLowerCase())) {
                return {
                    text: phrase.text,
                    pictograms: phrase.pictograms,
                };
            }

            // Otherwise, append as normal
            return {
                text: prev.text ? `${prev.text} ${phrase.text}` : phrase.text,
                pictograms: [...prev.pictograms, ...phrase.pictograms],
            };
        });
        updatePhraseUsage(phrase.id);
        setSearchQuery('');
        // Return focus to search input
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const handlePlay = () => {
        if (builtPhrase.text) {
            Speech.speak(builtPhrase.text, { language: 'es-ES' });
        }
    };

    const handleClear = () => {
        setBuiltPhrase({ text: '', pictograms: [] });
    };

    const removePictogram = (indexToRemove: number) => {
        const newPictograms = builtPhrase.pictograms.filter((_, index) => index !== indexToRemove);
        // Keep the text unchanged when removing pictograms
        setBuiltPhrase({ text: builtPhrase.text, pictograms: newPictograms });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header: Title Left, Settings Right */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Eire Fast Conversation</Text>
                <TouchableOpacity
                    onPress={() => router.push('/manage-phrases')}
                    style={styles.settingsButton}
                >
                    <Ionicons name="settings-outline" size={26} color="#9333EA" />
                </TouchableOpacity>
            </View>

            {/* Built Text - Outside yellow container */}
            {builtPhrase.text && (
                <View style={styles.builtTextRow}>
                    <Text style={styles.builtText}>
                        {builtPhrase.text}
                    </Text>
                </View>
            )}

            {/* Yellow Container - Pictograms and Buttons in same row */}
            {builtPhrase.pictograms.length > 0 && (
                <View style={styles.builderContainer}>
                    <View style={styles.pictogramsRow}>
                        {/* Pictograms on the left */}
                        <ScrollView
                            horizontal
                            style={styles.pictogramsScroll}
                            contentContainerStyle={styles.pictogramsContent}
                            showsHorizontalScrollIndicator={false}
                        >
                            {builtPhrase.pictograms.map((pic, index) => (
                                <View key={index} style={styles.builtPictogram}>
                                    <TouchableOpacity
                                        style={styles.removePictogramButton}
                                        onPress={() => removePictogram(index)}
                                    >
                                        <Ionicons name="close" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <Image source={{ uri: pic.url }} style={styles.builtImage} />
                                </View>
                            ))}
                        </ScrollView>

                        {/* Buttons on the right */}
                        <View style={styles.textControls}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={handlePlay}
                                disabled={!builtPhrase.text}
                            >
                                <Ionicons name="play-outline" size={20} color="#4A90E2" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={handleClear}
                                disabled={!builtPhrase.text}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Escribe lo que quieras decir..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="characters"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Suggestions List (Text Only) */}
            <View style={styles.resultsContainer}>
                <FlatList
                    data={filteredPhrases}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={[
                                styles.suggestionItem,
                                hoveredIndex === index && styles.suggestionItemHovered
                            ]}
                            onPress={() => addToBuilder(item)}
                            onPressIn={() => setHoveredIndex(index)}
                            onPressOut={() => setHoveredIndex(null)}
                            // @ts-ignore - Web-specific hover events
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <Text style={styles.suggestionText}>{item.text}</Text>
                            <Ionicons name="add-circle-outline" size={24} color="#4A90E2" />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        searchQuery ? (
                            <Text style={styles.emptyText}>No se encontraron frases.</Text>
                        ) : null
                    }
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    settingsButton: {
        padding: 10,
        backgroundColor: '#F0F4F8',
        borderRadius: 12,
    },
    builderContainer: {
        backgroundColor: '#FEF3C7',
        padding: 24,
        margin: 20,
        borderRadius: 24,
        boxShadow: '0 4px 12px rgba(147, 51, 234, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(147, 51, 234, 0.15)',
    },
    builtTextRow: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginHorizontal: 20,
        marginTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8ECEF',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    builtText: {
        fontSize: 22,
        color: '#1A1A1A',
        lineHeight: 32,
        fontWeight: '500',
    },
    pictogramsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    textControls: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        padding: 4,
    },
    pictogramsLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    pictogramsHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 12,
    },
    pictogramsStripContainer: {
        marginBottom: 20,
        paddingVertical: 12,
        borderTopWidth: 2,
        borderTopColor: '#F0F4F8',
    },
    pictogramsScroll: {
        flex: 1,
    },
    pictogramsContent: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    builtPictogram: {
        alignItems: 'center',
        marginRight: 16,
        position: 'relative',
    },
    removePictogramButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        zIndex: 10,
        backgroundColor: '#EC4899',
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(236, 72, 153, 0.3)',
    },
    builtImage: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    pictogramWord: {
        fontSize: 12,
        color: '#333',
        marginTop: 6,
        fontWeight: '500',
    },
    builderControls: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 12,
    },
    controlButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 10,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    playButton: {
        backgroundColor: '#9333EA',
    },
    clearButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#EC4899',
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.3,
    },
    clearText: {
        color: '#EC4899',
    },
    disabledButton: {
        opacity: 0.4,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E8ECEF',
        boxShadow: '0 2px 8px rgba(147, 51, 234, 0.08)',
    },
    searchInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
        padding: 10,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    listContent: {
        paddingBottom: 24,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        marginBottom: 3,
        borderWidth: 1,
        borderColor: '#E8ECEF',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
    },
    suggestionItemHovered: {
        backgroundColor: '#EDE9FE',
        borderColor: '#9333EA',
        borderWidth: 2,
        boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
    },
    suggestionText: {
        fontSize: 17,
        color: '#333333',
        flex: 1,
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 32,
        fontSize: 17,
        fontWeight: '500',
    },
});
