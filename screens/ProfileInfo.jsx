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
    SafeAreaView,
    ActivityIndicator,
    Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

const { width, height } = Dimensions.get('window');

// ---- Palette (shared language with Login / Home / Receipts) ------------
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

export default function Profile({ navigation }) {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const avatarScale = useRef(new Animated.Value(0.7)).current;
    const blobA = useRef(new Animated.Value(0)).current;
    const blobB = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        loadStudentProfile();
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
            }),
            Animated.spring(avatarScale, {
                toValue: 1,
                tension: 60,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.stagger(
            110,
            cardAnims.map((v) =>
                Animated.timing(v, {
                    toValue: 1,
                    duration: 480,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                })
            )
        ).start();
    };

    // Ambient drifting blobs, same language as the rest of the app.
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

    const loadStudentProfile = async () => {
        try {
            const token = await AsyncStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                navigation.replace('Login');
                return;
            }

            const response = await api.get('main/students/me/');
            const studentData = response.data;

            setStudent(studentData);

        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const InfoCard = ({ title, children, animValue }) => (
        <Animated.View
            style={[
                styles.infoCard,
                {
                    opacity: animValue,
                    transform: [
                        { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                    ],
                },
            ]}
        >
            <Text style={styles.cardTitle}>{title}</Text>
            {children}
        </Animated.View>
    );

    const InfoRow = ({ label, value, icon, last }) => (
        <View style={[styles.infoRow, last && styles.infoRowLast]}>
            <View style={styles.infoLabelContainer}>
                <View style={styles.rowIconWrap}>
                    <Ionicons name={icon} size={17} color={COLORS.blueSoft} />
                </View>
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

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
                        <Ionicons name="person-outline" size={38} color={COLORS.blue} />
                    </View>
                    <ActivityIndicator size="small" color={COLORS.green} style={{ marginTop: 18 }} />
                    <Text style={styles.loadingText}>Loading Profile...</Text>
                </Animated.View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Gradient */}
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

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
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
                                <Text style={styles.headerTitle}>Student Profile</Text>
                            </View>

                            <View style={styles.editButtonPlaceholder} />
                        </View>
                    </BlurView>
                </Animated.View>

                {/* Profile Header Card */}
                <Animated.View
                    style={[
                        styles.profileHeaderCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <BlurView intensity={55} tint="dark" style={styles.profileBlur}>
                        <View style={styles.avatarSection}>
                            <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
                                <LinearGradient
                                    colors={[COLORS.blue, COLORS.blueDeep]}
                                    style={styles.avatar}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.avatarText}>
                                        {student?.first_name?.[0]}{student?.last_name?.[0]}
                                    </Text>
                                </LinearGradient>
                                <View style={styles.avatarDot} />
                            </Animated.View>
                            <View style={styles.nameSection}>
                                <Text style={styles.displayName}>
                                    {student?.first_name} {student?.last_name}
                                </Text>
                                {student?.other_names && (
                                    <Text style={styles.otherNames}>
                                        {student.other_names}
                                    </Text>
                                )}
                                <View style={styles.idPill}>
                                    <Text style={styles.studentId}>ID: {student?.student_id}</Text>
                                </View>
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* Personal Information */}
                <InfoCard title="Personal Information" animValue={cardAnims[0]}>
                    <InfoRow
                        label="First Name"
                        value={student?.first_name}
                        icon="person-outline"
                    />
                    <InfoRow
                        label="Last Name"
                        value={student?.last_name}
                        icon="person-outline"
                    />
                    <InfoRow
                        label="Other Names"
                        value={student?.other_names}
                        icon="people-outline"
                    />
                    <InfoRow
                        label="Student ID"
                        value={student?.student_id}
                        icon="id-card-outline"
                        last
                    />
                </InfoCard>

                {/* Class & School Information */}
                <InfoCard title="Academic Information" animValue={cardAnims[1]}>
                    <InfoRow
                        label="Class"
                        value={student?.school_class?.name}
                        icon="school-outline"
                    />
                    <InfoRow
                        label="School"
                        value={student?.school_class?.school?.name}
                        icon="business-outline"
                    />
                    <InfoRow
                        label="Date Joined"
                        value={formatDate(student?.date_added)}
                        icon="calendar-outline"
                        last
                    />
                </InfoCard>

                {/* Parent/Guardian Information */}
                <InfoCard title="Parent/Guardian Information" animValue={cardAnims[2]}>
                    <InfoRow
                        label="Parent Name"
                        value={student?.parent_name}
                        icon="people-circle-outline"
                    />
                    <InfoRow
                        label="Parent Contact"
                        value={student?.parent_contact}
                        icon="call-outline"
                        last
                    />
                </InfoCard>

                {/* Quick Stats */}
                <InfoCard title="Quick Stats" animValue={cardAnims[3]}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(47, 111, 237, 0.16)' }]}>
                                <Ionicons name="document-text-outline" size={20} color={COLORS.blueSoft} />
                            </View>
                            <Text style={styles.statNumber}>
                                {student?.student_fees?.length || 0}
                            </Text>
                            <Text style={styles.statLabel}>Fee Items</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(62, 213, 152, 0.16)' }]}>
                                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.green} />
                            </View>
                            <Text style={styles.statNumber}>
                                {student?.student_fees?.filter(fee => fee.balance <= 0).length || 0}
                            </Text>
                            <Text style={styles.statLabel}>Paid Fees</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255, 107, 107, 0.14)' }]}>
                                <Ionicons name="time-outline" size={20} color={COLORS.error} />
                            </View>
                            <Text style={styles.statNumber}>
                                {student?.student_fees?.filter(fee => fee.balance > 0).length || 0}
                            </Text>
                            <Text style={styles.statLabel}>Pending Fees</Text>
                        </View>
                    </View>
                </InfoCard>

                <View style={styles.bottomSpacer} />
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
        bottom: height * 0.1,
        left: -width * 0.28,
        backgroundColor: COLORS.green,
        opacity: 0.14,
    },
    header: {
        padding: 20,
        paddingTop: 10,
        marginTop: 45
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
    editButtonPlaceholder: {
        width: 38,
        height: 38,
    },
    profileHeaderCard: {
        padding: 20,
        paddingTop: 0,
    },
    profileBlur: {
        borderRadius: 22,
        overflow: 'hidden',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 78,
        height: 78,
        borderRadius: 39,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: COLORS.blue,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    avatarDot: {
        position: 'absolute',
        bottom: 2,
        right: 14,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.green,
        borderWidth: 3,
        borderColor: COLORS.bgMid,
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: 'bold',
    },
    nameSection: {
        flex: 1,
    },
    displayName: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    otherNames: {
        color: COLORS.textDim,
        fontSize: 15,
        marginBottom: 6,
    },
    idPill: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(62, 213, 152, 0.14)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    studentId: {
        color: COLORS.greenSoft,
        fontSize: 13,
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 18,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.blue,
    },
    cardTitle: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    infoRowLast: {
        borderBottomWidth: 0,
    },
    infoLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rowIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: 'rgba(47, 111, 237, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoLabel: {
        color: COLORS.textDim,
        fontSize: 14,
        fontWeight: '500',
    },
    infoValueContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    infoValue: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: {
        color: COLORS.white,
        fontSize: 19,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        color: COLORS.textDim,
        fontSize: 12,
        textAlign: 'center',
    },
    bottomSpacer: {
        height: 30,
    },
});