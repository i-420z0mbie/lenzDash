import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Updated import
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function PDFViewer({ route, navigation }) {
    const { url, title } = route.params;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const webViewRef = useRef(null);

    const handleLoadStart = () => {
        setLoading(true);
        setError(false);
    };

    const handleLoadEnd = () => {
        setLoading(false);
    };

    const handleError = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error:', nativeEvent);
        setLoading(false);
        setError(true);
    };

    const handleReload = () => {
        setLoading(true);
        setError(false);
        webViewRef.current?.reload();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <BlurView intensity={80} tint="dark" style={styles.blurHeader}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {title || 'View Receipt'}
                            </Text>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={handleReload}
                            style={styles.reloadButton}
                        >
                            <Ionicons name="refresh" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>

            {/* WebView Container */}
            <View style={styles.webviewContainer}>
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <BlurView intensity={60} tint="dark" style={styles.loadingBlur}>
                            <ActivityIndicator size="large" color="#667eea" />
                            <Text style={styles.loadingText}>Loading PDF...</Text>
                        </BlurView>
                    </View>
                )}

                {error ? (
                    <View style={styles.errorContainer}>
                        <BlurView intensity={60} tint="dark" style={styles.errorBlur}>
                            <Ionicons name="warning-outline" size={64} color="#FF6B6B" />
                            <Text style={styles.errorTitle}>Failed to Load PDF</Text>
                            <Text style={styles.errorSubtitle}>
                                There was an error loading the receipt. Please check your connection and try again.
                            </Text>
                            <TouchableOpacity 
                                style={styles.retryButton}
                                onPress={handleReload}
                            >
                                <Ionicons name="refresh" size={20} color="white" />
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                ) : (
                    <WebView
                        ref={webViewRef}
                        source={{ uri: url }}
                        style={styles.webview}
                        onLoadStart={handleLoadStart}
                        onLoadEnd={handleLoadEnd}
                        onError={handleError}
                        startInLoadingState={true}
                        scalesPageToFit={true}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        padding: 20,
        paddingTop: 10,
    },
    blurHeader: {
        borderRadius: 20,
        overflow: 'hidden',
        padding: 16,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    reloadButton: {
        padding: 8,
    },
    webviewContainer: {
        flex: 1,
        margin: 20,
        marginTop: 0,
        borderRadius: 16,
        overflow: 'hidden',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingBlur: {
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        overflow: 'hidden',
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 12,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorBlur: {
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        overflow: 'hidden',
        width: '100%',
    },
    errorTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(102, 126, 234, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.5)',
        gap: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});