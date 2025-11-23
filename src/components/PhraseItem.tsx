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
}

export const PhraseItem: React.FC<PhraseItemProps> = ({
    phrase,
    onPress,
    onEdit,
    onDelete,
    showManageControls = false,
}) => {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.content}>
                <View style={styles.pictogramsContainer}>
                    {phrase.pictograms.map((pic, index) => (
                        <View key={index} style={styles.pictogramWrapper}>
                            <Image source={{ uri: pic.url }} style={styles.pictogramImage} />
                            <Text style={styles.pictogramWord}>{pic.word}</Text>
                        </View>
                    ))}
                </View>
                <Text style={styles.phraseText}>{phrase.text}</Text>
                {showManageControls && (
                    <Text style={styles.usageCount}>Usado: {phrase.usage_count} veces</Text>
                )}
            </View>

            {showManageControls && (
                <View style={styles.controls}>
                    <TouchableOpacity onPress={onEdit} style={styles.controlButton}>
                        <Ionicons name="pencil" size={24} color="#4A90E2" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} style={styles.controlButton}>
                        <Ionicons name="trash" size={24} color="#E25C5C" />
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
    },
    content: {
        flex: 1,
    },
    pictogramsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
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
    usageCount: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    controls: {
        flexDirection: 'row',
        marginLeft: 12,
    },
    controlButton: {
        padding: 8,
        marginLeft: 4,
    },
});
