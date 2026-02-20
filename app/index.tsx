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
import { PhraseEditorModal } from '../src/components/PhraseEditorModal';
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
    const [isAutoClearEnabled, setIsAutoClearEnabled] = useState(true);
    const [isAddingPhrase, setIsAddingPhrase] = useState(false);

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
        const shouldConcatenate = (isWord || isAutoClearEnabled) && builtPhrase.text;

        if (shouldConcatenate) {
            // Append with space
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
            const textToSpeak = shouldConcatenate
                ? builtPhrase.text + ' ' + phrase.text
                : phrase.text;
            Speech.speak(textToSpeak, { language: language === 'en' ? 'en-US' : 'es-ES' });
        }

        // Return focus to search input
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const handlePlay = () => {
        if (builtPhrase.text) {
            Speech.speak(builtPhrase.text, {
                language: language === 'en' ? 'en-US' : 'es-ES',
                onDone: () => {
                    if (isAutoClearEnabled) {
                        setTimeout(handleClear, 1000);
                    }
                }
            });
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

    const handleAddBuiltPhrase = (text: string, pictograms: Pictogram[], type: 'word' | 'phrase') => {
        addPhrase(text, pictograms, type);
    };

    return (
        <>
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
                                name={showPictograms ? "eye" : "eye-outline"}
                                size={scale(20)}
                                color={showPictograms ? "#FFFFFF" : "#4A90E2"}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.settingsButton, isAutoClearEnabled && { backgroundColor: '#FF6B6B' }]}
                            onPress={() => setIsAutoClearEnabled(!isAutoClearEnabled)}
                        >
                            <Ionicons
                                name={isAutoClearEnabled ? "analytics" : "analytics-outline"}
                                size={scale(20)}
                                color={isAutoClearEnabled ? "#FFFFFF" : "#FF6B6B"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                {builtPhrase.pictograms.length > 0 && showPictograms && (
                    <View style={styles.builderContainer}>
                        <View style={styles.pictogramsRow}>
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
                        </View>
                    </View>
                )}

                <View style={styles.persistentActionBar}>
                    <View style={styles.builtTextContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <Text style={styles.builtTextPersistent}>
                                {builtPhrase.text || ""}
                            </Text>
                        </ScrollView>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.playButton]}
                            onPress={handlePlay}
                            disabled={!builtPhrase.text}
                        >
                            <Ionicons name="play" size={scale(24)} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.clearButton]}
                            onPress={handleClear}
                            disabled={!builtPhrase.text}
                        >
                            <Ionicons name="trash-outline" size={scale(24)} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

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
            </SafeAreaView>
            <PhraseEditorModal
                visible={isAddingPhrase}
                onClose={() => setIsAddingPhrase(false)}
                onSave={handleAddBuiltPhrase}
                initialPhrase={{
                    id: '',
                    text: builtPhrase.text,
                    pictograms: builtPhrase.pictograms,
                    usage_count: 0,
                    type: 'phrase'
                }}
            />
        </>
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
    headerButtons: {
        flexDirection: 'row',
        gap: scale(10),
    },
    headerTitle: {
        fontSize: moderateScale(18),
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    settingsButton: {
        padding: scale(8),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: scale(8),
        width: scale(40),
        height: scale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeButton: {
        backgroundColor: '#4A90E2',
    },
    builderContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: scale(16),
        marginHorizontal: scale(20),
        marginTop: scale(10),
        borderRadius: scale(16),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    pictogramsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pictogramsScroll: {
        flex: 1,
    },
    pictogramsContent: {
        alignItems: 'center',
        paddingVertical: scale(4),
    },
    builtPictogram: {
        alignItems: 'center',
        marginRight: scale(12),
        position: 'relative',
    },
    removePictogramButton: {
        position: 'absolute',
        top: scale(-4),
        right: scale(-4),
        backgroundColor: '#FF6B6B',
        borderRadius: scale(10),
        width: scale(20),
        height: scale(20),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    builtImage: {
        width: scale(60),
        height: scale(60),
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
        borderRadius: scale(8),
    },
    persistentActionBar: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(16),
        paddingVertical: scale(12),
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: scale(12),
    },
    builtTextContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: scale(8),
        paddingHorizontal: scale(12),
        paddingVertical: scale(8),
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: scale(48),
        justifyContent: 'center',
    },
    builtTextPersistent: {
        fontSize: moderateScale(18),
        color: '#1E293B',
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: scale(8),
    },
    actionButton: {
        width: scale(48),
        height: scale(48),
        borderRadius: scale(12),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    playButton: {
        backgroundColor: '#4A90E2',
    },
    addButton: {
        backgroundColor: '#10B981',
    },
    clearButton: {
        backgroundColor: '#FF6B6B',
    },
    searchContainer: {
        paddingHorizontal: scale(20),
        marginVertical: scale(16),
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: scale(12),
        paddingHorizontal: scale(12),
        paddingVertical: scale(4),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: moderateScale(16),
        color: '#1E293B',
        paddingVertical: scale(12),
        fontWeight: '500',
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
        padding: scale(12),
        marginBottom: scale(8),
        borderRadius: scale(12),
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    suggestionItemHovered: {
        backgroundColor: '#F8FAFC',
    },
    suggestionText: {
        fontSize: moderateScale(16),
        color: '#1E293B',
        fontWeight: '500',
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
        backgroundColor: '#F1F5F9',
        borderRadius: scale(4),
    },
    wordBadge: {
        backgroundColor: '#E0F2FE',
        borderRadius: scale(4),
        paddingHorizontal: scale(6),
        paddingVertical: scale(2),
    },
    wordBadgeText: {
        fontSize: moderateScale(12),
        color: '#0369A1',
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: scale(40),
    },
    emptyText: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: moderateScale(14),
        marginBottom: scale(20),
    },
    quickAddContainer: {
        flexDirection: 'row',
        gap: scale(12),
    },
    addPhraseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(8),
        paddingVertical: scale(10),
        paddingHorizontal: scale(16),
        borderRadius: scale(8),
    },
    addPhraseText: {
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    mostUsedContainer: {
        marginHorizontal: scale(20),
        marginBottom: scale(16),
        padding: scale(16),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: scale(16),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(8),
        marginBottom: scale(12),
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
        gap: scale(8),
        minWidth: '22%',
    },
    mostUsedButtonText: {
        color: '#1E293B',
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    mostUsedImage: {
        width: scale(20),
        height: scale(20),
        resizeMode: 'contain',
    },
});
