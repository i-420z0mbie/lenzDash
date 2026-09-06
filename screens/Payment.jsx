// screens/Payment.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView,
    Modal, ActivityIndicator, TextInput, Switch, Linking, KeyboardAvoidingView,
    Platform, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // ADD THIS
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

export default function Payment({ navigation }) {
    const CALLBACK_SCHEME = 'edupay360://payment-callback';

    const [student, setStudent] = useState(null);
    const [fees, setFees] = useState([]);
    const [selectedFee, setSelectedFee] = useState(null);
    const [amount, setAmount] = useState('');
    const [customAmount, setCustomAmount] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [currentReference, setCurrentReference] = useState(null);
    const [webViewVisible, setWebViewVisible] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');
    const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);

    const scrollViewRef = useRef(null);
    const amountInputRef = useRef(null);
    const webViewRef = useRef(null);
    const webViewClosedRef = useRef(false);
    const paymentVerifiedRef = useRef(false);

    // Group fees by academic year & term
    const groupedFees = useMemo(() => {
        if (!Array.isArray(fees) || fees.length === 0) return [];
        const groups = {};
        fees.forEach((fee) => {
            const academicYear = fee.academic_year || 'Unknown Year';
            const term = fee.term || 'Unknown Term';
            const key = `${academicYear} - ${term}`;
            if (!groups[key]) {
                groups[key] = {
                    title: key,
                    academicYear,
                    term,
                    fees: [],
                };
            }
            groups[key].fees.push(fee);
        });
        return Object.values(groups).sort((a, b) => {
            if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
            return b.term.localeCompare(a.term);
        });
    }, [fees]);

    // Load student data on mount AND when screen gains focus
    useEffect(() => {
        loadStudentData();
        const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            keyboardDidShow.remove();
            keyboardDidHide.remove();
        };
    }, []);

    // Focus listener – refresh student data every time this screen becomes active
    useFocusEffect(
        useCallback(() => {
            loadStudentData();
            return () => {};
        }, [])
    );

    // Deep link listener
    useEffect(() => {
        const handleUrl = ({ url }) => { if (url) handleDeepLink(url); };
        const subscription = Linking.addEventListener('url', handleUrl);
        (async () => {
            try {
                const initialUrl = await Linking.getInitialURL();
                if (initialUrl) handleDeepLink(initialUrl);
            } catch (e) { console.warn(e); }
        })();
        return () => subscription.remove();
    }, [currentReference]);

    const handleDeepLink = (url) => {
        const reference = extractReferenceFromUrl(url) || currentReference;
        if (reference && !paymentVerifiedRef.current) {
            paymentVerifiedRef.current = true;
            setTimeout(() => verifyPayment(reference), 1000);
        }
    };

    const extractReferenceFromUrl = (url) => {
        if (!url) return null;
        try {
            const queryString = url.includes('?') ? url.split('?')[1] : '';
            const params = new URLSearchParams(queryString);
            return params.get('reference') || params.get('trxref') || params.get('tx_ref');
        } catch { return null; }
    };

    const hasActiveSubscription = (studentData) => {
        if (!studentData) return false;
        if (studentData.has_active_subscription === true) return true;
        if (studentData.subscriptions && Array.isArray(studentData.subscriptions)) {
            return studentData.subscriptions.some(sub => sub.active_now === true);
        }
        return false;
    };

    const loadStudentData = async () => {
        try {
            const token = await AsyncStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                navigation.replace('Login');
                return;
            }
            const studentResponse = await api.get('main/students/me/');
            const studentData = studentResponse.data;
            setStudent(studentData);

            const feesArray = studentData.student_fees || [];
            setFees(feesArray);
            const feesWithBalance = feesArray.filter(fee => fee.balance > 0);
            if (feesWithBalance.length > 0) {
                setSelectedFee(feesWithBalance[0]);
                setAmount(feesWithBalance[0].balance.toString());
            }

            if (!hasActiveSubscription(studentData)) {
                setSubscriptionModalVisible(true);
            } else {
                setSubscriptionModalVisible(false);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load student data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
    };

    const handleFeeSelect = (fee) => {
        setSelectedFee(fee);
        if (!customAmount) setAmount(fee.balance.toString());
    };

    const handleAmountChange = (value) => {
        const cleaned = value.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        if (parts[1] && parts[1].length > 2) return;
        setAmount(cleaned);
    };

    const validateAmount = () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
            return false;
        }
        if (selectedFee && numAmount > selectedFee.balance) {
            Alert.alert('Invalid Amount', `Amount cannot exceed balance of ${formatCurrency(selectedFee.balance)}`);
            return false;
        }
        return true;
    };

    const focusOnAmountInput = () => {
        amountInputRef.current?.focus();
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const initiatePayment = async () => {
        if (!validateAmount()) return;
        setProcessing(true);
        try {
            const amountValue = parseFloat(amount).toFixed(2);
            const paymentData = {
                amount: amountValue,
                student_fee: selectedFee?.id || null,
                callback_url: CALLBACK_SCHEME,
            };
            const response = await api.post('main/payments/initiate/', paymentData);
            if (response.data?.authorization_url) {
                webViewClosedRef.current = false;
                paymentVerifiedRef.current = false;
                setPaymentUrl(response.data.authorization_url);
                setCurrentReference(response.data.reference);
                setWebViewVisible(true);
            } else {
                throw new Error('No payment URL received');
            }
        } catch (error) {
            let msg = 'Payment initiation failed. Please try again.';
            if (error.response?.data?.detail) msg = error.response.data.detail;
            else if (error.response?.data?.message) msg = error.response.data.message;
            Alert.alert('Payment Failed', msg);
            setProcessing(false);
        }
    };

    const paymentDetectionScript = `
        (function() {
            let detected = false;
            function checkForSuccess() {
                if (detected) return;
                const url = window.location.href;
                const pageText = document.body.innerText.toLowerCase();
                const success = /success|completed|thank.you|payment.success/i.test(url) ||
                    pageText.includes('payment successful') ||
                    pageText.includes('transaction successful') ||
                    !!document.querySelector('.success, .payment-success');
                if (success) {
                    detected = true;
                    let ref = null;
                    const match = pageText.match(/reference[^a-zA-Z0-9]*([a-zA-Z0-9]{10,})/i);
                    if (match) ref = match[1];
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_SUCCESS', reference: ref }));
                }
            }
            setInterval(checkForSuccess, 2000);
        })();
    `;

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'PAYMENT_SUCCESS' && !paymentVerifiedRef.current) {
                paymentVerifiedRef.current = true;
                webViewClosedRef.current = true;
                setWebViewVisible(false);
                const ref = data.reference || currentReference;
                if (ref) setTimeout(() => verifyPayment(ref), 1000);
            }
        } catch (error) { console.warn(error); }
    };

    const handleWebViewNavigationStateChange = (navState) => {
        const { url, title } = navState;
        if (webViewClosedRef.current || paymentVerifiedRef.current) return;
        if (url?.startsWith(CALLBACK_SCHEME)) {
            webViewClosedRef.current = true;
            setWebViewVisible(false);
            const ref = extractReferenceFromUrl(url) || currentReference;
            if (ref) setTimeout(() => verifyPayment(ref), 1500);
        } else if (/success|complete|thank.you/i.test(url) || (title && /success/i.test(title))) {
            webViewClosedRef.current = true;
            setWebViewVisible(false);
            if (currentReference) setTimeout(() => verifyPayment(currentReference), 1500);
        }
    };

    const handleWebViewClose = () => {
        if (!webViewClosedRef.current) {
            webViewClosedRef.current = true;
            setWebViewVisible(false);
            setProcessing(false);
            if (currentReference && !paymentVerifiedRef.current) {
                Alert.alert('Verify Payment', 'Would you like to verify your payment status?', [
                    { text: 'No', style: 'cancel', onPress: () => setProcessing(false) },
                    { text: 'Yes', onPress: () => { paymentVerifiedRef.current = true; verifyPayment(currentReference); } }
                ]);
            }
        }
    };

    const verifyPayment = async (reference) => {
        if (!reference) { Alert.alert('Error', 'No payment reference found'); setProcessing(false); return; }
        setProcessing(true);
        try {
            const verifyResponse = await api.post('main/payments/verify/', { reference });
            if (verifyResponse.data.status === 'success') {
                setPaymentResult({ success: true, message: 'Payment Successful!', reference, amount: parseFloat(amount) });
                setPaymentModalVisible(true);
                await loadStudentData(); // refresh after payment
                setTimeout(() => {
                    setPaymentModalVisible(false);
                    setPaymentResult(null);
                    setCurrentReference(null);
                    setProcessing(false);
                    navigation.navigate('Home');
                }, 3000);
            } else {
                setPaymentResult({ success: false, message: 'Payment Failed', error: verifyResponse.data.details || 'Verification failed' });
                setPaymentModalVisible(true);
                setProcessing(false);
            }
        } catch (error) {
            setPaymentResult({ success: false, message: 'Verification Failed', error: error.response?.data?.detail || error.message });
            setPaymentModalVisible(true);
            setProcessing(false);
        }
    };

    const handlePaymentComplete = () => {
        setPaymentModalVisible(false);
        setPaymentResult(null);
        setCurrentReference(null);
        setProcessing(false);
        paymentVerifiedRef.current = false;
        loadStudentData();
        navigation.navigate('Home');
    };

    const goToSubscription = () => {
        setSubscriptionModalVisible(false);
        navigation.navigate('Subscription');
    };

    const cancelAndGoHome = () => {
        setSubscriptionModalVisible(false);
        navigation.goBack();
    };

    const FeeOption = ({ fee, isSelected, onSelect }) => (
        <TouchableOpacity style={[styles.feeOption, isSelected && styles.feeOptionSelected]} onPress={() => onSelect(fee)}>
            <View style={styles.feeOptionContent}>
                <View style={styles.feeInfo}>
                    <Text style={styles.feeName}>{fee.fee_item?.name || 'Fee Item'}</Text>
                    <Text style={styles.feeDetails}>
                        Due: {formatCurrency(fee.amount_due)} • Paid: {formatCurrency(fee.amount_paid)} • Balance: {formatCurrency(fee.balance)}
                    </Text>
                </View>
                <View style={styles.feeSelector}>
                    {isSelected ? <Ionicons name="checkmark-circle" size={24} color="#4CAF50" /> : <View style={styles.radioCircle} />}
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={['#667eea', '#764ba2']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const feesWithBalance = fees.filter(fee => fee.balance > 0);

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.container}>
                <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.scrollContent, keyboardVisible && styles.scrollContentKeyboard]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Make Payment</Text>
                        {currentReference && (
                            <TouchableOpacity onPress={() => verifyPayment(currentReference)} style={styles.verifyButton}>
                                <Ionicons name="refresh-circle" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                        {!currentReference && <View style={styles.headerSpacer} />}
                    </View>

                    <View style={styles.formContainer}>
                        <BlurView intensity={80} tint="dark" style={styles.formCard}>
                            {feesWithBalance.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="checkmark-done-circle" size={48} color="#4CAF50" />
                                    <Text style={styles.emptyStateTitle}>All Fees Paid!</Text>
                                    <Text style={styles.emptyStateText}>You have no pending fees. Great job!</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Select Fee</Text>
                                        {groupedFees.map(group => (
                                            <View key={group.title} style={styles.feeGroup}>
                                                <View style={styles.groupHeader}><Text style={styles.groupTitle}>{group.title}</Text></View>
                                                {group.fees.map(fee => (
                                                    <FeeOption key={fee.id} fee={fee} isSelected={selectedFee?.id === fee.id} onSelect={handleFeeSelect} />
                                                ))}
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Payment Amount</Text>
                                        <View style={styles.customAmountToggle}>
                                            <Text style={styles.toggleLabel}>Pay custom amount</Text>
                                            <Switch value={customAmount} onValueChange={(val) => { setCustomAmount(val); if (!val && selectedFee) setAmount(selectedFee.balance.toString()); else setTimeout(focusOnAmountInput, 300); }} />
                                        </View>
                                        <View style={styles.amountInputContainer}>
                                            <Text style={styles.amountLabel}>Amount to Pay</Text>
                                            <View style={styles.amountInputWrapper}>
                                                <Text style={styles.currencySymbol}>GH₵</Text>
                                                <TextInput ref={amountInputRef} style={styles.amountInput} value={amount} onChangeText={handleAmountChange} placeholder="0.00" keyboardType="decimal-pad" editable={customAmount || !selectedFee} />
                                            </View>
                                            {selectedFee && <Text style={styles.amountHint}>Max: {formatCurrency(selectedFee.balance)}</Text>}
                                        </View>
                                        <View style={styles.paymentSummary}>
                                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Fee:</Text><Text style={styles.summaryValue}>{selectedFee?.fee_item?.name || 'General'}</Text></View>
                                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Amount:</Text><Text style={styles.summaryValue}>{formatCurrency(parseFloat(amount) || 0)}</Text></View>
                                            {selectedFee && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Remaining:</Text><Text style={styles.summaryValue}>{formatCurrency(selectedFee.balance - (parseFloat(amount) || 0))}</Text></View>}
                                        </View>
                                    </View>

                                    <TouchableOpacity style={[styles.payButton, (processing || !amount || parseFloat(amount) <= 0) && styles.payButtonDisabled]} onPress={initiatePayment} disabled={processing || !amount || parseFloat(amount) <= 0}>
                                        {processing ? <ActivityIndicator color="white" /> : (
                                            <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.payButtonGradient}>
                                                <Text style={styles.payButtonText}>Pay {formatCurrency(parseFloat(amount) || 0)}</Text>
                                                <Ionicons name="lock-closed" size={16} color="white" />
                                            </LinearGradient>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                            <View style={styles.securityNotice}>
                                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                                <Text style={styles.securityText}>Secure & encrypted payment</Text>
                            </View>
                        </BlurView>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Subscription Required Modal */}
            <Modal transparent visible={subscriptionModalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="dark" style={styles.subscriptionModal}>
                        <Ionicons name="alert-circle-outline" size={60} color="#FFA500" />
                        <Text style={styles.subscriptionModalTitle}>Subscription Required</Text>
                        <Text style={styles.subscriptionModalText}>
                            You need an active subscription to make payments. Would you like to subscribe now?
                        </Text>
                        <View style={styles.subscriptionModalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={cancelAndGoHome}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.subscribeButton]} onPress={goToSubscription}>
                                <Text style={styles.subscribeButtonText}>Subscribe</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </Modal>

            {/* WebView Modal */}
            <Modal visible={webViewVisible} onRequestClose={handleWebViewClose} animationType="slide">
                <View style={styles.webViewContainer}>
                    <View style={styles.webViewHeader}>
                        <TouchableOpacity onPress={handleWebViewClose}><Ionicons name="close" size={24} color="white" /></TouchableOpacity>
                        <Text style={styles.webViewTitle}>Complete Payment</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <WebView ref={webViewRef} source={{ uri: paymentUrl }} onMessage={handleWebViewMessage} onNavigationStateChange={handleWebViewNavigationStateChange} injectedJavaScript={paymentDetectionScript} javaScriptEnabled domStorageEnabled />
                </View>
            </Modal>

            {/* Payment Result Modal */}
            <Modal visible={paymentModalVisible} transparent animationType="fade" onRequestClose={handlePaymentComplete}>
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="dark" style={styles.modalContent}>
                        {paymentResult && (
                            <View style={styles.resultContent}>
                                <View style={[styles.resultIcon, { backgroundColor: paymentResult.success ? '#4CAF50' : '#FF6B6B' }]}>
                                    <Ionicons name={paymentResult.success ? "checkmark" : "close"} size={40} color="white" />
                                </View>
                                <Text style={styles.resultTitle}>{paymentResult.message}</Text>
                                {paymentResult.success ? (
                                    <View style={styles.successDetails}>
                                        <Text style={styles.detailLabel}>Reference:</Text><Text style={styles.detailValue}>{paymentResult.reference}</Text>
                                        <Text style={styles.detailLabel}>Amount:</Text><Text style={styles.detailValue}>{formatCurrency(paymentResult.amount)}</Text>
                                        <Text style={styles.autoRedirectText}>Redirecting...</Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.doneButton} onPress={handlePaymentComplete}>
                                        <Text style={styles.doneButtonText}>Try Again</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </BlurView>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

// Styles (same as before – no changes)
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: 20 },
    scrollContentKeyboard: { paddingBottom: 300 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: 'white', marginTop: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40 },
    backButton: { padding: 8 }, headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
    verifyButton: { padding: 8 }, headerSpacer: { width: 40 },
    formContainer: { padding: 20 }, formCard: { borderRadius: 20, padding: 20 },
    section: { marginBottom: 24 }, sectionTitle: { color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 16 },
    emptyState: { alignItems: 'center', padding: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16 },
    emptyStateTitle: { color: '#4CAF50', fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptyStateText: { color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
    feeGroup: { marginBottom: 16 }, groupHeader: { marginBottom: 8 }, groupTitle: { color: '#ddd', fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start' },
    feeOption: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: 'transparent', marginBottom: 8 },
    feeOptionSelected: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)' },
    feeOptionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    feeInfo: { flex: 1 }, feeName: { color: 'white', fontWeight: '600', marginBottom: 4 },
    feeDetails: { color: 'rgba(255,255,255,0.7)', fontSize: 12 }, feeSelector: { marginLeft: 12 }, radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    customAmountToggle: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    toggleLabel: { color: 'white', fontSize: 16, fontWeight: '500' },
    amountInputContainer: { marginBottom: 20 }, amountLabel: { color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
    amountInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
    currencySymbol: { color: 'white', fontSize: 18, fontWeight: '600', marginRight: 8 },
    amountInput: { flex: 1, color: 'white', fontSize: 18, fontWeight: '600' },
    amountHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 },
    paymentSummary: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, gap: 8 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { color: 'rgba(255,255,255,0.7)' }, summaryValue: { color: 'white', fontWeight: '600' },
    payButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 }, payButtonDisabled: { opacity: 0.6 },
    payButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
    payButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
    securityNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    securityText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    subscriptionModal: { width: '85%', borderRadius: 24, padding: 24, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
    subscriptionModalTitle: { color: 'white', fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 12 },
    subscriptionModalText: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 24, fontSize: 16 },
    subscriptionModalButtons: { flexDirection: 'row', gap: 16 },
    modalButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, minWidth: 120, alignItems: 'center' },
    cancelButton: { backgroundColor: 'rgba(255,255,255,0.2)' }, cancelButtonText: { color: 'white', fontSize: 16 },
    subscribeButton: { backgroundColor: '#4CAF50' }, subscribeButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    modalContent: { width: '90%', borderRadius: 24, padding: 30, alignItems: 'center' },
    resultIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    resultTitle: { color: 'white', fontSize: 24, fontWeight: '700', marginBottom: 20 },
    successDetails: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 20, gap: 8 },
    detailLabel: { color: 'rgba(255,255,255,0.7)' }, detailValue: { color: 'white', marginBottom: 8 },
    autoRedirectText: { color: '#4CAF50', textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
    doneButton: { backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
    doneButtonText: { color: 'white', fontWeight: '600' },
    webViewContainer: { flex: 1, backgroundColor: '#fff' },
    webViewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#667eea', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 50 },
    webViewTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
});