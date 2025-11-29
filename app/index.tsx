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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { usePhrases } from '../src/context/PhrasesContext';
import { Phrase, Pictogram } from '../src/types';

export default function MainScreen() {
    const router = useRouter();
    const { phrases, updatePhraseUsage } = usePhrases();
    const { user, signOut } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [builtPhrase, setBuiltPhrase] = useState<{ text: string; pictograms: Pictogram[] }>({
        text: '',
        pictograms: [],
    });
    const searchInputRef = React.useRef<TextInput>(null);
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const [showPictograms, setShowPictograms] = useState(false);
    const [showCompactHeader, setShowCompactHeader] = useState(false);


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

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        // Mostrar cabecera compacta cuando el usuario empieza a escribir
        if (text.length > 0) {
            setShowCompactHeader(true);
        } else {
            setShowCompactHeader(false);
        }
    };

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

    const handleLogout = async () => {
        await signOut();
        router.replace('/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {!showCompactHeader && (
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Eire Fast Conversation</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/manage-phrases')}>
                            <Ionicons name="settings-outline" size={24} color="#9333EA" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.settingsButton, showPictograms && styles.activeButton]}
                            onPress={() => setShowPictograms(!showPictograms)}
                        >
                            <Ionicons
                                name={showPictograms ? "images" : "images-outline"}
                                size={24}
                                color={showPictograms ? "#FFFFFF" : "#4A90E2"}
                            />
                        </TouchableOpacity>
                        {user ? (
                            <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
                                <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/login')}>
                                <Ionicons name="log-in-outline" size={24} color="#4A90E2" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
            {showCompactHeader && (
                <View style={styles.compactHeader}>
                    <TouchableOpacity
                        style={styles.compactButton}
                        onPress={() => setShowCompactHeader(false)}
                    >
                        <Ionicons name="menu" size={20} color="#4A90E2" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.compactButton} onPress={() => router.push('/manage-phrases')}>
                        <Ionicons name="settings-outline" size={20} color="#9333EA" />
                    </TouchableOpacity>
                </View>
            )}
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
                                    <Image source={{ uri: pic.base64 || pic.url }} style={styles.builtImage} />
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
                                <Ionicons name="play-outline" size={60} color="#4A90E2" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={handleClear}
                                disabled={!builtPhrase.text}
                            >
                                <Ionicons name="trash-outline" size={60} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
            {!!builtPhrase.text && (
                <View style={styles.builtTextRow}>
                    <Text style={styles.builtText}>
                        {builtPhrase.text}
                    </Text>
                </View>
            )}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Escribe lo que quieras decir..."
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        autoCapitalize="characters"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearchChange('')}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <View style={styles.resultsContainer}>
                <FlatList
                    data={filteredPhrases}
                    keyExtractor={(item) => item.id}
                    scrollEventThrottle={16}
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
                            <View style={{ flex: 1 }}>
                                <Text style={styles.suggestionText}>{item.text}</Text>
                                {showPictograms && item.pictograms && item.pictograms.length > 0 && (
                                    <View style={styles.suggestionPictograms}>
                                        {item.pictograms.map((pic, idx) => (
                                            <Image
                                                key={idx}
                                                source={{ uri: pic.base64 || pic.url }}
                                                style={styles.suggestionImage}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
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
        backgroundColor: 'purple',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '',
        borderBottomWidth: 0,
        boxShadow: '0 2px 8px rgba(117, 56, 109, 0.88)',
    },
    compactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(117, 56, 109, 0.41)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
    },
    compactButton: {
        padding: 8,
        backgroundColor: '#F0F4F8',
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
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
        marginBottom: 0,
        borderRadius: 24,
        boxShadow: '0 4px 12px rgba(147, 51, 234, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(147, 51, 234, 0.15)',
    },
    builtTextRow: {
        backgroundColor: '#ffffffff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginHorizontal: 20,
        marginTop: 2,
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'purple',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    builtText: {
        fontSize: 22,
        color: 'purple',
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
        bottom: -8,
        left: 0,
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
        flex: 1,
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    playButton: {
        backgroundColor: '#9333EA',
    },
    clearButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    clearText: {
        color: '#E25C5C',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        borderColor: '#F0F4F8',
    },
    searchInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: 'purple',
        padding: 10,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 12,
        borderRadius: 16,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        borderWidth: 1,
        borderColor: '#F0F4F8',
    },
    suggestionItemHovered: {
        backgroundColor: '#EDE9FE'
    },
    suggestionText: {
        fontSize: 18,
        color: 'purple',
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 20,
        fontSize: 16,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    activeButton: {
        backgroundColor: '#4A90E2',
    },
    suggestionPictograms: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    suggestionImage: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
});
