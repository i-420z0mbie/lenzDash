// screens/Receipts.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    Platform,
    ActivityIndicator,
    RefreshControl,
    Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as FileSystem from 'expo-file-system/legacy';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

const { width, height } = Dimensions.get('window');

const SERVER_URL = 'https://binarylenz.mycasaz.com';
const NORMALIZED_SERVER_URL = SERVER_URL.replace(/\/$/, '');

// ---- Palette (shared language with Login.js / Home.js) -----------------
const COLORS = {
    bgTop: '#0A1730',
    bgMid: '#0F2447',
    bgBottom: '#123055',
    blue: '#2F6FED',
    blueSoft: '#5B8DF6',
    blueDeep: '#193B78',
    green: '#3ED598',
    greenSoft: '#8FF0C6',
    amber: '#F5A623',
    white: '#FFFFFF',
    textDim: 'rgba(255,255,255,0.62)',
    textFaint: 'rgba(255,255,255,0.4)',
    error: '#FF6B6B',
};

export default function Receipts({ navigation }) {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [downloaded, setDownloaded] = useState(null);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const refreshSpin = useRef(new Animated.Value(0)).current;
    const blobA = useRef(new Animated.Value(0)).current;
    const blobB = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadReceipts();
        startAnimations();
        startAmbientLoops();
    }, []);

    const startAnimations = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    };

    // Slow-drifting ambient blobs, matching Login / Home.
    const startAmbientLoops = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(blobA, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(blobA, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(blobB, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(blobB, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    };

    const spinRefreshIcon = () => {
        refreshSpin.setValue(0);
        Animated.timing(refreshSpin, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const loadReceipts = async () => {
        try {
            spinRefreshIcon();
            const token = await AsyncStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                navigation.replace('Login');
                return;
            }

            const response = await api.get('main/receipt/');
            setReceipts(response.data);

        } catch (error) {
            console.error('Error loading receipts:', error);
            Alert.alert('Error', 'Failed to load receipts');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadReceipts();
    };

    /**
     * Robust function to fix media / file URLs returned by a dev server
     */
    const fixMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('/')) {
            return `${NORMALIZED_SERVER_URL}${url}`;
        }
        const devHostRegex = /^https?:\/\/(?:(?:127\.0\.0\.1)|(?:localhost)|(?:192\.168\.\d{1,3}\.\d{1,3}))(?:\:\d+)?/i;
        if (devHostRegex.test(url)) {
            return url.replace(devHostRegex, NORMALIZED_SERVER_URL);
        }
        const port8000Regex = /^http:\/\/[^/]+:8000/i;
        if (port8000Regex.test(url)) {
            return url.replace(port8000Regex, NORMALIZED_SERVER_URL);
        }
        return url;
    };

    const handleDownload = async (receipt) => {
        if (!receipt.pdf_url) {
            Alert.alert('Error', 'PDF not available for this receipt');
            return;
        }

        setDownloading(receipt.id);
        try {
            const token = await AsyncStorage.getItem(ACCESS_TOKEN);
            const downloadUrl = fixMediaUrl(receipt.pdf_url);
            const fileUri = `${FileSystem.documentDirectory}receipt_${receipt.payment_reference}.pdf`;

            const downloadResumable = FileSystem.createDownloadResumable(
                downloadUrl,
                fileUri,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            const { uri } = await downloadResumable.downloadAsync();

            // Brief success flash on the button before handing off to the share sheet
            setDownloading(null);
            setDownloaded(receipt.id);
            setTimeout(() => setDownloaded(null), 1400);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Receipt - ${receipt.payment_reference}`,
                });
            } else {
                Alert.alert('Success', `Receipt downloaded to: ${uri}`);
            }

        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to download receipt');
            setDownloading(null);
        }
    };

    const handleViewReceipt = async (receipt) => {
        if (!receipt.pdf_url) {
            Alert.alert('Error', 'PDF not available for this receipt');
            return;
        }

        try {
            const viewUrl = fixMediaUrl(receipt.pdf_url);
            await WebBrowser.openBrowserAsync(viewUrl);
        } catch (error) {
            console.error('Error opening PDF:', error);
            Alert.alert('Error', 'Failed to open PDF');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        if (!amount) return 'N/A';
        return `₵${parseFloat(amount).toFixed(2)}`;
    };

    // Helper to get the fee item name from the nested payment object
    const getFeeItemName = (receipt) => {
        if (receipt.payment?.fee_item_name) {
            return receipt.payment.fee_item_name;
        }
        if (receipt.data?.fee_item_name) {
            return receipt.data.fee_item_name;
        }
        return null;
    };

    const getAcademicInfo = (receipt) => {
        const studentFee = receipt.payment?.student_fee;
        if (studentFee && (studentFee.academic_year || studentFee.term)) {
            return `${studentFee.academic_year || ''} ${studentFee.term || ''}`.trim();
        }
        if (receipt.data?.academic_year || receipt.data?.term) {
            return `${receipt.data?.academic_year || ''} ${receipt.data?.term || ''}`.trim();
        }
        return null;
    };

    const ReceiptCard = ({ receipt, index }) => {
        const cardScale = useRef(new Animated.Value(1)).current;
        const viewPress = useRef(new Animated.Value(1)).current;
        const downloadPress = useRef(new Animated.Value(1)).current;

        const pressIn = (v) => Animated.timing(v, { toValue: 0.95, duration: 90, useNativeDriver: true }).start();
        const pressOut = (v) => Animated.timing(v, { toValue: 1, duration: 140, useNativeDriver: true }).start();

        const feeItemName = getFeeItemName(receipt);
        const academicInfo = getAcademicInfo(receipt);
        const paymentRef = receipt.payment_reference || receipt.payment?.payment_reference;
        const isDownloading = downloading === receipt.id;
        const isDownloaded = downloaded === receipt.id;

        return (
            <Animated.View
                style={[
                    styles.receiptCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            {
                                translateY: slideUpAnim.interpolate({
                                    inputRange: [0, 30],
                                    outputRange: [0, index * 10]
                                })
                            },
                            { scale: cardScale },
                        ],
                    },
                ]}
            >
                <BlurView intensity={50} tint="dark" style={styles.receiptBlur}>
                    {/* Header with Fee Item Name */}
                    <View style={styles.receiptHeader}>
                        <View style={styles.receiptTitleSection}>
                            <Text style={styles.feeItemName} numberOfLines={1}>
                                {feeItemName || 'Payment'}
                            </Text>
                            <Text style={styles.paymentReference}>
                                Ref: {paymentRef}
                            </Text>
                            {academicInfo ? (
                                <Text style={styles.academicInfo}>
                                    {academicInfo}
                                </Text>
                            ) : null}
                        </View>
                        <View style={[
                            styles.receiptTypeBadge,
                            receipt.receipt_type === 'school' ? styles.schoolBadge : styles.studentBadge
                        ]}>
                            <Text style={styles.receiptTypeText}>
                                {receipt.receipt_type === 'school' ? 'School Copy' : 'Student Copy'}
                            </Text>
                        </View>
                    </View>

                    {/* Payment Details */}
                    <View style={styles.receiptDetails}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date:</Text>
                            <Text style={styles.detailValue}>{formatDate(receipt.created_at)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Amount:</Text>
                            <Text style={styles.detailValue}>
                                {formatAmount(receipt.payment?.amount || receipt.data?.amount)}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Status:</Text>
                            <View style={[
                                styles.statusBadge,
                                (receipt.payment?.status === 'successful' || receipt.data?.status === 'successful')
                                    ? styles.completedBadge
                                    : styles.pendingBadge
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: (receipt.payment?.status === 'successful' || receipt.data?.status === 'successful') ? COLORS.green : COLORS.amber }
                                ]}>
                                    {((receipt.payment?.status || receipt.data?.status || 'completed').toUpperCase())}
                                </Text>
                            </View>
                        </View>

                        {receipt.payee_name && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Payee:</Text>
                                <Text style={styles.detailValue}>{receipt.payee_name}</Text>
                            </View>
                        )}

                        {receipt.data?.payment_method && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Method:</Text>
                                <Text style={styles.detailValue}>
                                    {receipt.data.payment_method.replace(/_/g, ' ').toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <Animated.View style={{ flex: 1, transform: [{ scale: viewPress }] }}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.viewButton]}
                                onPress={() => handleViewReceipt(receipt)}
                                onPressIn={() => pressIn(viewPress)}
                                onPressOut={() => pressOut(viewPress)}
                                disabled={!receipt.pdf_url}
                                activeOpacity={0.9}
                            >
                                <Ionicons name="eye-outline" size={19} color={COLORS.white} />
                                <Text style={styles.actionButtonText}>View</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={{ flex: 1, transform: [{ scale: downloadPress }] }}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    isDownloaded ? styles.downloadedButton : styles.downloadButton,
                                ]}
                                onPress={() => handleDownload(receipt)}
                                onPressIn={() => pressIn(downloadPress)}
                                onPressOut={() => pressOut(downloadPress)}
                                disabled={!receipt.pdf_url || isDownloading}
                                activeOpacity={0.9}
                            >
                                {isDownloading ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : isDownloaded ? (
                                    <>
                                        <Ionicons name="checkmark-circle" size={19} color={COLORS.white} />
                                        <Text style={styles.actionButtonText}>Saved</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="download-outline" size={19} color={COLORS.white} />
                                        <Text style={styles.actionButtonText}>Download</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* PDF Status */}
                    {!receipt.pdf_url && (
                        <View style={styles.pdfStatus}>
                            <Ionicons name="warning-outline" size={16} color={COLORS.amber} />
                            <Text style={styles.pdfStatusText}>PDF generating...</Text>
                        </View>
                    )}
                </BlurView>
            </Animated.View>
        );
    };

    const EmptyState = () => (
        <Animated.View
            style={[
                styles.emptyState,
                { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
            ]}
        >
            <BlurView intensity={50} tint="dark" style={styles.emptyBlur}>
                <View style={styles.emptyIconCircle}>
                    <Ionicons name="receipt-outline" size={46} color={COLORS.blueSoft} />
                </View>
                <Text style={styles.emptyTitle}>No Receipts Found</Text>
                <Text style={styles.emptySubtitle}>
                    Your payment receipts will appear here once processed
                </Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={loadReceipts}
                    activeOpacity={0.85}
                >
                    <Ionicons name="refresh" size={18} color={COLORS.white} />
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
            </BlurView>
        </Animated.View>
    );

    const refreshRotate = refreshSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const blobATranslate = blobA.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
    const blobBTranslate = blobB.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBottom]}
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
                    <View style={styles.loadingLogo}>
                        <Ionicons name="receipt-outline" size={38} color={COLORS.blue} />
                    </View>
                    <ActivityIndicator size="small" color={COLORS.green} style={{ marginTop: 18 }} />
                    <Text style={styles.loadingText}>Loading Receipts...</Text>
                </Animated.View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBottom]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
            />
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.blob,
                    styles.blobBlue,
                    { transform: [{ translateY: blobATranslate }, { translateX: blobATranslate }] },
                ]}
            />
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.blob,
                    styles.blobGreen,
                    { transform: [{ translateY: blobBTranslate }, { translateX: blobBTranslate }] },
                ]}
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.green}
                        colors={[COLORS.blue, COLORS.green]}
                    />
                }
            >
                {/* Header */}
                <Animated.View
                    style={[
                        styles.header,
                        { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
                    ]}
                >
                    <BlurView intensity={60} tint="dark" style={styles.blurHeader}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="arrow-back" size={22} color={COLORS.white} />
                            </TouchableOpacity>

                            <View style={styles.headerCenter}>
                                <Text style={styles.headerTitle}>Payment Receipts</Text>
                                <Text style={styles.headerSubtitle}>
                                    {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} found
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={loadReceipts}
                                style={styles.refreshHeaderButton}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Animated.View style={{ transform: [{ rotate: refreshRotate }] }}>
                                    <Ionicons name="refresh" size={22} color={COLORS.white} />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* Receipts List */}
                <View style={styles.receiptsList}>
                    {receipts.length === 0 ? (
                        <EmptyState />
                    ) : (
                        receipts.map((receipt, index) => (
                            <ReceiptCard
                                key={receipt.id}
                                receipt={receipt}
                                index={index}
                            />
                        ))
                    )}
                </View>

                {/* Help Text */}
                {receipts.length > 0 && (
                    <Animated.View
                        style={[
                            styles.helpSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
                        ]}
                    >
                        <BlurView intensity={50} tint="dark" style={styles.helpBlur}>
                            <Ionicons name="information-circle-outline" size={20} color={COLORS.blueSoft} />
                            <Text style={styles.helpText}>
                                Your receipts contain only the essential payment information.
                                Sensitive payment gateway details are hidden for security.
                            </Text>
                        </BlurView>
                    </Animated.View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgTop,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContent: {
        alignItems: 'center',
    },
    loadingLogo: {
        width: 74,
        height: 74,
        borderRadius: 37,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.blue,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 8,
    },
    loadingText: {
        color: COLORS.white,
        fontSize: 15,
        marginTop: 14,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.26,
    },
    blobBlue: {
        width: width * 0.85,
        height: width * 0.85,
        top: -width * 0.35,
        right: -width * 0.35,
        backgroundColor: COLORS.blue,
    },
    blobGreen: {
        width: width * 0.6,
        height: width * 0.6,
        bottom: height * 0.15,
        left: -width * 0.28,
        backgroundColor: COLORS.green,
        opacity: 0.14,
    },
    header: {
        padding: 20,
        paddingTop: 10,
    },
    blurHeader: {
        borderRadius: 20,
        overflow: 'hidden',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
    headerSubtitle: {
        color: COLORS.textDim,
        fontSize: 12,
        marginTop: 2,
    },
    refreshHeaderButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    receiptsList: {
        padding: 20,
        paddingTop: 10,
    },
    receiptCard: {
        marginBottom: 16,
        borderRadius: 18,
        overflow: 'hidden',
    },
    receiptBlur: {
        padding: 20,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    receiptTitleSection: {
        flex: 1,
        marginRight: 12,
    },
    feeItemName: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    paymentReference: {
        color: COLORS.textDim,
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 4,
    },
    academicInfo: {
        color: COLORS.textFaint,
        fontSize: 12,
        fontStyle: 'italic',
    },
    receiptTypeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    studentBadge: {
        backgroundColor: 'rgba(62, 213, 152, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(62, 213, 152, 0.4)',
    },
    schoolBadge: {
        backgroundColor: 'rgba(47, 111, 237, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(47, 111, 237, 0.4)',
    },
    receiptTypeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    receiptDetails: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        color: COLORS.textDim,
        fontSize: 14,
        fontWeight: '500',
    },
    detailValue: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    completedBadge: {
        backgroundColor: 'rgba(62, 213, 152, 0.16)',
    },
    pendingBadge: {
        backgroundColor: 'rgba(245, 166, 35, 0.16)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    viewButton: {
        backgroundColor: 'rgba(47, 111, 237, 0.22)',
        borderWidth: 1,
        borderColor: 'rgba(47, 111, 237, 0.45)',
    },
    downloadButton: {
        backgroundColor: 'rgba(62, 213, 152, 0.22)',
        borderWidth: 1,
        borderColor: 'rgba(62, 213, 152, 0.45)',
    },
    downloadedButton: {
        backgroundColor: 'rgba(62, 213, 152, 0.4)',
        borderWidth: 1,
        borderColor: COLORS.green,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    pdfStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 8,
    },
    pdfStatusText: {
        color: COLORS.amber,
        fontSize: 12,
        fontWeight: '500',
    },
    emptyState: {
        padding: 20,
    },
    emptyBlur: {
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    emptyIconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(47, 111, 237, 0.14)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 18,
        marginBottom: 8,
    },
    emptySubtitle: {
        color: COLORS.textDim,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(47, 111, 237, 0.22)',
        borderWidth: 1,
        borderColor: 'rgba(47, 111, 237, 0.45)',
        gap: 8,
    },
    refreshButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    helpSection: {
        padding: 20,
        paddingTop: 0,
    },
    helpBlur: {
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    helpText: {
        color: COLORS.textDim,
        fontSize: 12,
        flex: 1,
        lineHeight: 16,
    },
});