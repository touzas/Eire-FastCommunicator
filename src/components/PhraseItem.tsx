import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Phrase } from '../types';

interface PhraseItemProps {
    phrase: Phrase;
    onPress?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    showManageControls?: boolean;
    compact?: boolean;
}

export const PhraseItem: React.FC<PhraseItemProps> = ({
    phrase,
    onPress,
    onEdit,
    onDelete,
    showManageControls = false,
    compact = false,
}) => {
    return (
        <TouchableOpacity
            style={[styles.container, compact && styles.compactContainer]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.content}>
                <View style={styles.pictogramsContainer}>
                    {phrase.pictograms.slice(0, compact ? 3 : undefined).map((pic, index) => (
                        <View key={index} style={styles.pictogramWrapper}>
                            <Image
                                source={{ uri: pic.base64 || pic.url }}
                                style={compact ? styles.compactPictogramImage : styles.pictogramImage}
                            />
                            {!compact && <Text style={styles.pictogramWord}>{pic.word}</Text>}
                        </View>
                    ))}
                </View>
                <Text style={[styles.phraseText, compact && styles.compactPhraseText]} numberOfLines={compact ? 2 : undefined}>
                    {phrase.text}
                </Text>
                {showManageControls && (
                    <Text style={styles.usageCount}>Usado: {phrase.usage_count} veces</Text>
                )}
            </View>
            {showManageControls && (
                <View style={styles.floatingControls}>
                    <TouchableOpacity onPress={onEdit} style={styles.floatingButton}>
                        <Ionicons name="pencil" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} style={[styles.floatingButton, styles.deleteButton]}>
                        <Ionicons name="trash" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'relative',
    },
    compactContainer: {
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: 10,
        marginBottom: 0,
    },
    content: {
        flex: 1,
        paddingRight: 70,
    },
    pictogramsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 6,
    },
    pictogramWrapper: {
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 4,
    },
    pictogramImage: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    compactPictogramImage: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    pictogramWord: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
    phraseText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    compactPhraseText: {
        fontSize: 14,
        lineHeight: 18,
    },
    usageCount: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    floatingControls: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        gap: 6,
    },
    floatingButton: {
        backgroundColor: '#4A90E2',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    },
    deleteButton: {
        backgroundColor: '#E25C5C',
    },
});
