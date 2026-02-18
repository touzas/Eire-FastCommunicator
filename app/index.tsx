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
import { usePhrases } from '../src/context/PhrasesContext';
import { Phrase, Pictogram } from '../src/types';
import { moderateScale, scale } from '../src/utils/responsive';

export default function MainScreen() {
    const router = useRouter();
    const { phrases, updatePhraseUsage, addPhrase } = usePhrases();
    const [searchQuery, setSearchQuery] = useState('');
    const [builtPhrase, setBuiltPhrase] = useState<{ text: string; pictograms: Pictogram[] }>({
        text: '',
        pictograms: [],
    });
    const searchInputRef = React.useRef<TextInput>(null);
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const [showPictograms, setShowPictograms] = useState(false);
    const [language, setLanguage] = useState<'en' | 'es'>('es');
    const [layoutMode, setLayoutMode] = useState<'top' | 'bottom'>('top');

    // Translations
    const translations = {
        en: {
            placeholder: 'Type what you want to say...',
            noResults: 'No phrases found.',
            addPhrase: 'Add as Phrase',
            addWord: 'Add as Word',
            mostUsed: 'Most used',
        },
        es: {
            placeholder: 'Escribe lo que quieras decir...',
            noResults: 'No se encontraron frases.',
            addPhrase: 'Añadir como Frase',
            addWord: 'Añadir como Palabra',
            mostUsed: 'Más usados',
        },
    };


    const mostUsedPhrases = useMemo(() => {
        return phrases
            .filter(p => p.usage_count > 0)
            .sort((a, b) => b.usage_count - a.usage_count)
            .slice(0, 12);
    }, [phrases]);

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
    };

    const addToBuilder = (phrase: Phrase) => {
        const isWord = phrase.type === 'word';

        if (isWord && builtPhrase.text) {
            // Append word with space
            setBuiltPhrase({
                text: builtPhrase.text + ' ' + phrase.text,
                pictograms: [...builtPhrase.pictograms, ...phrase.pictograms],
            });
        } else {
            // Replace (phrase or first word)
            setBuiltPhrase({
                text: phrase.text,
                pictograms: phrase.pictograms,
            });
        }

        updatePhraseUsage(phrase.id);
        setSearchQuery('');

        // Auto-play if pictograms are hidden
        if (!showPictograms) {
            const textToSpeak = isWord && builtPhrase.text
                ? builtPhrase.text + ' ' + phrase.text
                : phrase.text;
            Speech.speak(textToSpeak, { language: language === 'en' ? 'en-US' : 'es-ES' });
        }

        // Return focus to search input
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const handlePlay = () => {
        if (builtPhrase.text) {
            Speech.speak(builtPhrase.text, { language: language === 'en' ? 'en-US' : 'es-ES' });
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

    const handleQuickAdd = async (text: string, type: 'word' | 'phrase') => {
        const newPhrase = await addPhrase(text, [], type);
        addToBuilder(newPhrase);
    };

    const handleSearchSubmit = () => {
        if (!searchQuery.trim()) return;

        const query = searchQuery.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const exactMatch = filteredPhrases.find(p =>
            p.text.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === query
        );

        if (exactMatch) {
            addToBuilder(exactMatch);
        } else {
            handleQuickAdd(searchQuery.trim(), 'phrase');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Eire Fast Conversation</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/manage-phrases')}>
                        <Ionicons name="settings-outline" size={scale(20)} color="#9333EA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => setLayoutMode(layoutMode === 'top' ? 'bottom' : 'top')}
                    >
                        <Ionicons name="swap-vertical-outline" size={scale(20)} color="#FF6B6B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.settingsButton, showPictograms && styles.activeButton]}
                        onPress={() => setShowPictograms(!showPictograms)}
                    >
                        <Ionicons
                            name={showPictograms ? "images" : "images-outline"}
                            size={scale(20)}
                            color={showPictograms ? "#FFFFFF" : "#4A90E2"}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            {builtPhrase.pictograms.length > 0 && showPictograms && (
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


            {/* Layout Mode: TOP (default) - Built phrase at top, search in middle, results at bottom */}
            {layoutMode === 'top' && (
                <>
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <TextInput
                                ref={searchInputRef}
                                style={styles.searchInput}
                                placeholder={translations[language].placeholder}
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                onSubmitEditing={handleSearchSubmit}
                                blurOnSubmit={false}
                                autoCapitalize="characters"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearchChange('')}>
                                    <Ionicons name="close-circle" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {!searchQuery && mostUsedPhrases.length > 0 && (
                        <View style={styles.mostUsedContainer}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="stats-chart" size={scale(16)} color="#FFFFFF" />
                                <Text style={styles.sectionTitle}>{translations[language].mostUsed}</Text>
                            </View>
                            <View style={styles.mostUsedGrid}>
                                {mostUsedPhrases.map((phrase) => (
                                    <TouchableOpacity
                                        key={phrase.id}
                                        style={styles.mostUsedButton}
                                        onPress={() => addToBuilder(phrase)}
                                    >
                                        <Text style={styles.mostUsedButtonText} numberOfLines={1}>
                                            {phrase.text}
                                        </Text>
                                        {showPictograms && phrase.pictograms.length > 0 && (
                                            <Image
                                                source={{ uri: phrase.pictograms[0].base64 || phrase.pictograms[0].url }}
                                                style={styles.mostUsedImage}
                                            />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

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
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
                                            <Text style={styles.suggestionText}>{item.text}</Text>
                                            {item.type === 'word' && (
                                                <View style={styles.wordBadge}>
                                                    <Text style={styles.wordBadgeText}>+</Text>
                                                </View>
                                            )}
                                        </View>
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
                                    <Ionicons
                                        name={item.type === 'word' ? "add-circle-outline" : "arrow-forward-circle-outline"}
                                        size={24}
                                        color="#4A90E2"
                                    />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                searchQuery ? (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>{translations[language].noResults}</Text>
                                        <View style={styles.quickAddContainer}>
                                            <TouchableOpacity
                                                style={[styles.addPhraseButton, { backgroundColor: '#EDE9FE' }]}
                                                onPress={() => handleQuickAdd(searchQuery, 'phrase')}
                                            >
                                                <Ionicons name="arrow-forward-circle" size={20} color="#4A90E2" />
                                                <Text style={styles.addPhraseText}>
                                                    {translations[language].addPhrase}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.addPhraseButton, { backgroundColor: '#E0F2FE' }]}
                                                onPress={() => handleQuickAdd(searchQuery, 'word')}
                                            >
                                                <Ionicons name="add-circle" size={20} color="#0891B2" />
                                                <Text style={[styles.addPhraseText, { color: '#0891B2' }]}>
                                                    {translations[language].addWord}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null
                            }
                            contentContainerStyle={styles.listContent}
                        />
                    </View>
                </>
            )}

            {/* Layout Mode: BOTTOM - Results at top, search at bottom, built phrase at very bottom */}
            {layoutMode === 'bottom' && (
                <>
                    <View style={[styles.resultsContainer, { flex: 1 }]}>
                        <FlatList
                            data={filteredPhrases}
                            keyExtractor={(item) => item.id}
                            scrollEventThrottle={16}
                            inverted
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
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
                                            <Text style={styles.suggestionText}>{item.text}</Text>
                                            {item.type === 'word' && (
                                                <View style={styles.wordBadge}>
                                                    <Text style={styles.wordBadgeText}>+</Text>
                                                </View>
                                            )}
                                        </View>
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
                                    <Ionicons
                                        name={item.type === 'word' ? "add-circle-outline" : "arrow-forward-circle-outline"}
                                        size={24}
                                        color="#4A90E2"
                                    />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                searchQuery ? (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>{translations[language].noResults}</Text>
                                        <View style={styles.quickAddContainer}>
                                            <TouchableOpacity
                                                style={[styles.addPhraseButton, { backgroundColor: '#EDE9FE' }]}
                                                onPress={() => handleQuickAdd(searchQuery, 'phrase')}
                                            >
                                                <Ionicons name="arrow-forward-circle" size={20} color="#4A90E2" />
                                                <Text style={styles.addPhraseText}>
                                                    {translations[language].addPhrase}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.addPhraseButton, { backgroundColor: '#E0F2FE' }]}
                                                onPress={() => handleQuickAdd(searchQuery, 'word')}
                                            >
                                                <Ionicons name="add-circle" size={20} color="#0891B2" />
                                                <Text style={[styles.addPhraseText, { color: '#0891B2' }]}>
                                                    {translations[language].addWord}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null
                            }
                            contentContainerStyle={styles.listContent}
                        />
                    </View>
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <TextInput
                                ref={searchInputRef}
                                style={styles.searchInput}
                                placeholder={translations[language].placeholder}
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                onSubmitEditing={handleSearchSubmit}
                                blurOnSubmit={false}
                                autoCapitalize="characters"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearchChange('')}>
                                    <Ionicons name="close-circle" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {!searchQuery && mostUsedPhrases.length > 0 && (
                        <View style={styles.mostUsedContainer}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="stats-chart" size={scale(16)} color="#FFFFFF" />
                                <Text style={styles.sectionTitle}>{translations[language].mostUsed}</Text>
                            </View>
                            <View style={styles.mostUsedGrid}>
                                {mostUsedPhrases.map((phrase) => (
                                    <TouchableOpacity
                                        key={phrase.id}
                                        style={styles.mostUsedButton}
                                        onPress={() => addToBuilder(phrase)}
                                    >
                                        <Text style={styles.mostUsedButtonText} numberOfLines={1}>
                                            {phrase.text}
                                        </Text>
                                        {showPictograms && phrase.pictograms.length > 0 && (
                                            <Image
                                                source={{ uri: phrase.pictograms[0].base64 || phrase.pictograms[0].url }}
                                                style={styles.mostUsedImage}
                                            />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </>
            )}

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
        paddingHorizontal: scale(16),
        paddingVertical: scale(8),
        backgroundColor: 'transparent',
    },
    compactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(12),
        paddingVertical: scale(8),
        backgroundColor: 'rgba(117, 56, 109, 0.41)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
    },
    compactButton: {
        padding: scale(8),
        backgroundColor: '#F0F4F8',
        borderRadius: scale(8),
    },
    headerTitle: {
        fontSize: moderateScale(18),
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    settingsButton: {
        padding: scale(3),
        backgroundColor: 'white',
        borderRadius: scale(4),
    },
    languageText: {
        fontSize: moderateScale(14),
        fontWeight: '700',
        color: '#4A90E2',
    },
    builderContainer: {
        backgroundColor: '#FEF3C7',
        padding: scale(24),
        margin: scale(20),
        marginBottom: 0,
        borderRadius: scale(24),
        boxShadow: '0 4px 12px rgba(147, 51, 234, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(147, 51, 234, 0.15)',
    },
    builtTextRow: {
        backgroundColor: 'purple',
        paddingHorizontal: scale(5),
        paddingVertical: scale(5),
        marginHorizontal: scale(20),
        marginTop: scale(2),
        marginBottom: scale(5),
        borderRadius: scale(5),
        borderWidth: 1,
        borderColor: '#ffffffff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    builtText: {
        fontSize: moderateScale(22),
        color: '#ffffffff',
        lineHeight: moderateScale(32),
        fontWeight: '500',
    },
    controlButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: scale(12),
        paddingHorizontal: scale(20),
        paddingBottom: scale(10),
    },
    pictogramsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(16),
    },
    textControls: {
        flexDirection: 'row',
        gap: scale(12),
    },
    iconButton: {
        padding: scale(4),
    },
    pictogramsScroll: {
        flex: 1,
    },
    pictogramsContent: {
        alignItems: 'center',
        paddingVertical: scale(8),
    },
    builtPictogram: {
        alignItems: 'center',
        marginRight: scale(16),
        position: 'relative',
    },
    removePictogramButton: {
        position: 'absolute',
        bottom: scale(-8),
        left: 0,
        backgroundColor: '#FF6B6B',
        borderRadius: scale(12),
        width: scale(24),
        height: scale(24),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    builtImage: {
        width: scale(80),
        height: scale(80),
        resizeMode: 'contain',
    },
    searchContainer: {
        paddingHorizontal: scale(20),
        marginBottom: scale(16),
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: scale(5),
        paddingHorizontal: scale(5),
        paddingVertical: scale(5),
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        borderColor: '#F0F4F8',
    },
    searchInput: {
        flex: 1,
        fontSize: moderateScale(24),
        fontWeight: 'bold',
        color: 'purple',
        padding: scale(10),
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: scale(20),
    },
    listContent: {
        paddingBottom: scale(20),
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: scale(5),
        marginBottom: scale(5),
        borderRadius: scale(5),
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        borderWidth: 1,
        borderColor: '#F0F4F8',
    },
    suggestionItemHovered: {
        backgroundColor: '#EDE9FE'
    },
    suggestionText: {
        fontSize: moderateScale(18),
        color: 'purple',
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: scale(20),
        fontSize: moderateScale(16),
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: scale(20),
    },
    addPhraseButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: scale(8),
        paddingVertical: scale(10),
        paddingHorizontal: scale(12),
        borderRadius: scale(10),
        borderWidth: 1,
        borderColor: 'transparent',
    },
    addPhraseText: {
        fontSize: moderateScale(13),
        color: '#4A90E2',
        fontWeight: '600',
    },
    quickAddContainer: {
        flexDirection: 'row',
        gap: scale(10),
        width: '100%',
        marginTop: scale(10),
    },
    headerButtons: {
        flexDirection: 'row',
        gap: scale(10),
    },
    activeButton: {
        backgroundColor: '#4A90E2',
    },
    suggestionPictograms: {
        flexDirection: 'row',
        marginTop: scale(8),
        gap: scale(8),
    },
    suggestionImage: {
        width: scale(40),
        height: scale(40),
        resizeMode: 'contain',
    },
    wordBadge: {
        backgroundColor: '#4A90E2',
        borderRadius: scale(8),
        paddingHorizontal: scale(6),
        paddingVertical: scale(2),
    },
    wordBadgeText: {
        fontSize: moderateScale(10),
        color: '#FFFFFF',
        fontWeight: '700',
    },
    mostUsedContainer: {
        marginHorizontal: scale(20),
        marginBottom: scale(16),
        padding: scale(12),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: scale(12),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(6),
        marginBottom: scale(10),
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: moderateScale(14),
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mostUsedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scale(8),
    },
    mostUsedButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: scale(12),
        paddingVertical: scale(8),
        borderRadius: scale(8),
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(6),
        minWidth: '22%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    mostUsedButtonText: {
        color: 'purple',
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    mostUsedImage: {
        width: scale(20),
        height: scale(20),
        resizeMode: 'contain',
    },
});
