import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Phrase } from '../types';
import { moderateScale, scale } from '../utils/responsive';

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
        <View style={[styles.container, compact && styles.compactContainer]}>
            <TouchableOpacity
                style={styles.mainContentArea}
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
                    <Text style={[styles.phraseText, compact && styles.compactPhraseText]} numberOfLines={compact ? 1 : undefined}>
                        {phrase.text}
                    </Text>
                    {showManageControls && (
                        <Text style={styles.usageCount}>Usado: {phrase.usage_count} veces</Text>
                    )}
                </View>
            </TouchableOpacity>

            {showManageControls && (
                <View style={styles.controlsArea}>
                    <TouchableOpacity
                        onPress={() => onEdit?.()}
                        style={styles.actionButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="pencil" size={scale(18)} color="#4A90E2" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => onDelete?.()}
                        style={[styles.actionButton, styles.deleteButton]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="trash" size={scale(18)} color="#E25C5C" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: scale(12),
        padding: scale(12),
        marginBottom: scale(12),
        flexDirection: 'row',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'relative',
    },
    compactContainer: {
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: scale(10),
        marginBottom: 0,
    },
    mainContentArea: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    pictogramsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: scale(6),
    },
    pictogramWrapper: {
        alignItems: 'center',
        marginRight: scale(8),
        marginBottom: scale(4),
    },
    pictogramImage: {
        width: scale(40),
        height: scale(40),
        resizeMode: 'contain',
    },
    compactPictogramImage: {
        width: scale(30),
        height: scale(30),
        resizeMode: 'contain',
    },
    pictogramWord: {
        fontSize: moderateScale(10),
        color: '#666',
        marginTop: scale(2),
    },
    phraseText: {
        fontSize: moderateScale(18),
        fontWeight: '600',
        color: '#333',
    },
    compactPhraseText: {
        fontSize: moderateScale(14),
        lineHeight: moderateScale(18),
    },
    usageCount: {
        fontSize: moderateScale(12),
        color: '#999',
        marginTop: scale(4),
    },
    controlsArea: {
        flexDirection: 'row',
        gap: scale(12),
        paddingLeft: scale(8),
        alignItems: 'center',
    },
    actionButton: {
        width: scale(36),
        height: scale(36),
        borderRadius: scale(18),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
    },
    deleteButton: {
        backgroundColor: '#FEE2E2',
    },
});
