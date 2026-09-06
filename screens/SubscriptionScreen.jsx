// screens/SubscriptionScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView,
    ActivityIndicator, Modal, Linking, Platform, KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

// Helper function to check active subscription (same logic as Payment.js)
const hasActiveSubscription = (studentData) => {
    if (!studentData) return false;
    if (studentData.has_active_subscription === true) return true;
    if (studentData.subscriptions && Array.isArray(studentData.subscriptions)) {
        return studentData.subscriptions.some(sub => sub.active_now === true);
    }
    return false;
};

export default function SubscriptionScreen({ navigation }) {
    const CALLBACK_SCHEME = 'edupay360://subscription-callback';

    const [selectedPlan, setSelectedPlan] = useState('termly');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [webViewVisible, setWebViewVisible] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');
    const [currentReference, setCurrentReference] = useState(null);
    const [student, setStudent] = useState(null);

    const webViewClosedRef = useRef(false);
    const paymentVerifiedRef = useRef(false);
    const webViewRef = useRef(null);
    const redirectDoneRef = useRef(false);   // Prevent multiple redirects

    const PLAN_AMOUNTS = {
        termly: 8,
        yearly: 20,
    };

    useEffect(() => {
        loadStudent();
    }, []);

    // Deep link listener for callback URL
    useEffect(() => {
        const handleDeepLink = ({ url }) => {
            if (url && url.startsWith(CALLBACK_SCHEME)) {
                const ref = extractReferenceFromUrl(url);
                if (ref && !paymentVerifiedRef.current) {
                    paymentVerifiedRef.current = true;
                    setTimeout(() => verifySubscription(ref), 1000);
                }
            }
        };
        const subscription = Linking.addEventListener('url', handleDeepLink);
        (async () => {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl && initialUrl.startsWith(CALLBACK_SCHEME)) {
                const ref = extractReferenceFromUrl(initialUrl);
                if (ref && !paymentVerifiedRef.current) {
                    paymentVerifiedRef.current = true;
                    setTimeout(() => verifySubscription(ref), 1000);
                }
            }
        })();
        return () => subscription.remove();
    }, [currentReference]);

    const extractReferenceFromUrl = (url) => {
        if (!url) return null;
        try {
            const queryString = url.split('?')[1] || '';
            const params = new URLSearchParams(queryString);
            return params.get('reference') || params.get('trxref') || params.get('tx_ref');
        } catch {
            return null;
        }
    };

    const loadStudent = async () => {
        try {
            const token = await AsyncStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                navigation.replace('Login');
                return;
            }
            const res = await api.get('main/students/me/');
            const studentData = res.data;
            setStudent(studentData);

            // --- ACTIVE SUBSCRIPTION CHECK ---
            // If user already has an active subscription, redirect to Payment screen
            if (hasActiveSubscription(studentData) && !redirectDoneRef.current) {
                redirectDoneRef.current = true;
                Alert.alert(
                    'Already Subscribed',
                    'You already have an active subscription. Redirecting to Payment...',
                    [{ text: 'OK', onPress: () => navigation.replace('Payment') }]
                );
                return;
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not load student info');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const initiateSubscription = async () => {
        setProcessing(true);
        try {
            const payload = {
                plan_type: selectedPlan,
                student: student.id,
                callback_url: CALLBACK_SCHEME,
            };
            const response = await api.post('main/subscriptions/initiate/', payload);
            if (response.data?.authorization_url) {
                webViewClosedRef.current = false;
                paymentVerifiedRef.current = false;
                setPaymentUrl(response.data.authorization_url);
                setCurrentReference(response.data.reference);
                setWebViewVisible(true);
            } else {
                throw new Error('No authorization URL received');
            }
        } catch (error) {
            let msg = 'Subscription initiation failed.';
            if (error.response?.data?.error) msg = error.response.data.error;
            else if (error.response?.data?.details) msg = error.response.data.details;
            Alert.alert('Error', msg);
            setProcessing(false);
        }
    };

    const verifySubscription = async (reference) => {
        if (!reference) {
            Alert.alert('Error', 'No payment reference found');
            setProcessing(false);
            return;
        }
        setProcessing(true);
        try {
            const verifyResponse = await api.post('main/subscriptions/verify/', { reference });
            if (verifyResponse.data.status === 'success') {
                Alert.alert(
                    'Success',
                    'Subscription activated! You can now make payments.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Payment') }]
                );
                await loadStudent(); // refresh student data (will now redirect if active)
            } else {
                Alert.alert('Verification Failed', verifyResponse.data.details || 'Please contact support.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not verify subscription. Please check your subscription status later.');
        } finally {
            setProcessing(false);
            setWebViewVisible(false);
        }
    };

    // WebView success detection script (same as Payment.js)
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
                if (ref) setTimeout(() => verifySubscription(ref), 1000);
            }
        } catch (error) {
            console.warn(error);
        }
    };

    const handleWebViewNavigationStateChange = (navState) => {
        const { url, title } = navState;
        if (webViewClosedRef.current || paymentVerifiedRef.current) return;

        if (url && url.startsWith(CALLBACK_SCHEME)) {
            webViewClosedRef.current = true;
            setWebViewVisible(false);
            const ref = extractReferenceFromUrl(url) || currentReference;
            if (ref) setTimeout(() => verifySubscription(ref), 1500);
            return;
        }

        if ((url && /success|complete|thank.you/i.test(url)) || (title && /success/i.test(title))) {
            webViewClosedRef.current = true;
            setWebViewVisible(false);
            if (currentReference) setTimeout(() => verifySubscription(currentReference), 1500);
        }
    };

    const handleWebViewClose = () => {
        if (!webViewClosedRef.current) {
            webViewClosedRef.current = true;
            setWebViewVisible(false);
            setProcessing(false);
            if (currentReference && !paymentVerifiedRef.current) {
                Alert.alert(
                    'Verify Payment',
                    'Would you like to verify your subscription status?',
                    [
                        { text: 'No', style: 'cancel', onPress: () => setProcessing(false) },
                        { text: 'Yes', onPress: () => { paymentVerifiedRef.current = true; verifySubscription(currentReference); } }
                    ]
                );
            } else {
                Alert.alert('Payment Cancelled', 'You cancelled the subscription process.');
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <LinearGradient colors={['#667eea', '#764ba2']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Choose Subscription</Text>
                    {currentReference && (
                        <TouchableOpacity onPress={() => verifySubscription(currentReference)} style={styles.verifyButton}>
                            <Ionicons name="refresh-circle" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                    {!currentReference && <View style={{ width: 40 }} />}
                </View>

                <View style={styles.content}>
                    <BlurView intensity={80} tint="dark" style={styles.card}>
                        <Text style={styles.description}>
                            Subscribe to access payment features. Choose a plan that works for you.
                        </Text>

                        <TouchableOpacity
                            style={[styles.planCard, selectedPlan === 'termly' && styles.planSelected]}
                            onPress={() => setSelectedPlan('termly')}
                        >
                            <View style={styles.planLeft}>
                                <Ionicons name="calendar-outline" size={28} color="white" />
                                <View>
                                    <Text style={styles.planTitle}>Termly Plan</Text>
                                    <Text style={styles.planDuration}>Valid for 3 months</Text>
                                </View>
                            </View>
                            <Text style={styles.planPrice}>GH₵ {PLAN_AMOUNTS.termly}</Text>
                            {selectedPlan === 'termly' && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.checkIcon} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.planCard, selectedPlan === 'yearly' && styles.planSelected]}
                            onPress={() => setSelectedPlan('yearly')}
                        >
                            <View style={styles.planLeft}>
                                <Ionicons name="calendar" size={28} color="white" />
                                <View>
                                    <Text style={styles.planTitle}>Yearly Plan</Text>
                                    <Text style={styles.planDuration}>Valid for 12 months (save 20%)</Text>
                                </View>
                            </View>
                            <Text style={styles.planPrice}>GH₵ {PLAN_AMOUNTS.yearly}</Text>
                            {selectedPlan === 'yearly' && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.checkIcon} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.subscribeButton, processing && styles.disabledButton]}
                            onPress={initiateSubscription}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.gradient}>
                                    <Text style={styles.subscribeText}>Subscribe Now</Text>
                                    <Ionicons name="lock-closed" size={16} color="white" />
                                </LinearGradient>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.note}>
                            Payment is securely processed by Paystack. You will be redirected to complete payment.
                        </Text>
                    </BlurView>
                </View>

                {/* WebView Modal */}
                <Modal visible={webViewVisible} onRequestClose={handleWebViewClose} animationType="slide">
                    <View style={styles.webViewContainer}>
                        <View style={styles.webViewHeader}>
                            <TouchableOpacity onPress={handleWebViewClose}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.webViewTitle}>Complete Subscription</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <WebView
                            ref={webViewRef}
                            source={{ uri: paymentUrl }}
                            onMessage={handleWebViewMessage}
                            onNavigationStateChange={handleWebViewNavigationStateChange}
                            injectedJavaScript={paymentDetectionScript}
                            javaScriptEnabled
                            domStorageEnabled
                        />
                    </View>
                </Modal>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40 },
    backButton: { padding: 8 },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
    verifyButton: { padding: 8 },
    content: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
    card: { borderRadius: 24, padding: 24, overflow: 'hidden' },
    description: { color: 'rgba(255,255,255,0.9)', fontSize: 16, textAlign: 'center', marginBottom: 30 },
    planCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: 'transparent' },
    planSelected: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.2)' },
    planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    planTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
    planDuration: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    planPrice: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    checkIcon: { marginLeft: 8 },
    subscribeButton: { borderRadius: 30, overflow: 'hidden', marginTop: 20 },
    gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
    subscribeText: { color: 'white', fontSize: 18, fontWeight: '700' },
    disabledButton: { opacity: 0.6 },
    note: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', marginTop: 20 },
    webViewContainer: { flex: 1, backgroundColor: '#fff' },
    webViewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#667eea', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 50 },
    webViewTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: 'white', marginTop: 12, fontSize: 16 },
});