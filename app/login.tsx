import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
    const { signInWithGoogle, user, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Cargando...</Text>
            </View>
        );
    }

    if (user) {
        return <Redirect href="/" />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="chatbubbles" size={80} color="#9333EA" />
                </View>
                <Text style={styles.title}>Eire Fast Conversation</Text>
                <Text style={styles.subtitle}>Tu voz, tus frases, en todas partes.</Text>

                <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
                    <Ionicons name="logo-google" size={24} color="white" />
                    <Text style={styles.buttonText}>Iniciar sesión con Google</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: 'white',
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 20px rgba(147, 51, 234, 0.15)',
    },
    iconContainer: {
        marginBottom: 24,
        backgroundColor: '#F3E8FF',
        padding: 20,
        borderRadius: 50,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#DB4437',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
        width: '100%',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
