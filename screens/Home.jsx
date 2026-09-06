import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    RefreshControl,
    Alert,
    SafeAreaView,
    ActivityIndicator,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---- Palette (shared language with Login.js) ---------------------------
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

export default function Home({ navigation }) {
    const [student, setStudent] = useState(null);
    const [fees, setFees] = useState([]);
    const [school, setSchool] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [feeDetailsOpen, setFeeDetailsOpen] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const chevronRotate = useRef(new Animated.Value(0)).current;
    const blobA = useRef(new Animated.Value(0)).current;
    const blobB = useRef(new Animated.Value(0)).current;
    const actionAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        loadStudentData();
        startAnimations();
        startAmbientLoops();
    }, []);

    const startAnimations = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 700,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 60,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.stagger(
            90,
            actionAnims.map((v) =>
                Animated.spring(v, {
                    toValue: 1,
                    tension: 70,
                    friction: 7,
                    useNativeDriver: true,
                })
            )
        ).start();
    };

    // Two slow-drifting blurred blobs, same ambient language as Login.
    const startAmbientLoops = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(blobA, {
                    toValue: 1,
                    duration: 8000,
                    useNativeDriver: true,
                }),
                Animated.timing(blobA, {
                    toValue: 0,
                    duration: 8000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(blobB, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: true,
                }),
                Animated.timing(blobB, {
                    toValue: 0,
                    duration: 10000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const toggleFeeDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        Animated.timing(chevronRotate, {
            toValue: feeDetailsOpen ? 0 : 1,
            duration: 220,
            useNativeDriver: true,
        }).start();
        setFeeDetailsOpen((prev) => !prev);
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
            setFees(Array.isArray(studentData.student_fees) ? studentData.student_fees : []);

            if (studentData.school) {
                setSchool(studentData.school);
            } else {
                setSchool(null);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load student data');
            setFees([]);
            setSchool(null);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadStudentData();
        setRefreshing(false);
    }, []);

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await AsyncStorage.removeItem(ACCESS_TOKEN);
                        navigation.replace('Login');
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                },
            },
        ]);
    };

    const safeNumber = (value) => Number.parseFloat(value || 0) || 0;

    const formatCurrency = (amount) => {
        const value = safeNumber(amount);
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS',
        }).format(value);
    };

    const calculateFeeSummary = () => {
        if (student && student.total_due !== undefined) {
            return {
                totalDue: safeNumber(student.total_due),
                totalPaid: safeNumber(student.total_paid),
                totalBalance: safeNumber(student.total_balance),
            };
        }

        if (!fees || fees.length === 0) {
            return { totalDue: 0, totalPaid: 0, totalBalance: 0 };
        }

        const totalDue = fees.reduce((sum, fee) => sum + safeNumber(fee.amount_due), 0);
        const totalPaid = fees.reduce((sum, fee) => sum + safeNumber(fee.amount_paid), 0);
        const totalBalance = fees.reduce((sum, fee) => sum + safeNumber(fee.balance), 0);

        return { totalDue, totalPaid, totalBalance };
    };

    const getGroupedFees = () => {
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
                    paid: [],
                    unpaid: [],
                };
            }

            if (safeNumber(fee.balance) <= 0) {
                groups[key].paid.push(fee);
            } else {
                groups[key].unpaid.push(fee);
            }
        });

        return Object.values(groups).sort((a, b) => {
            if (a.academicYear !== b.academicYear) {
                return b.academicYear.localeCompare(a.academicYear);
            }
            return b.term.localeCompare(a.term);
        });
    };

    const groupedFees = useMemo(() => getGroupedFees(), [fees]);
    const feeSummary = useMemo(() => calculateFeeSummary(), [student, fees]);

    const feeStatusCount = useMemo(
        () => ({
            paid: (fees?.filter((f) => safeNumber(f.balance) <= 0) || []).length,
            pending: (fees?.filter((f) => safeNumber(f.balance) > 0) || []).length,
        }),
        [fees]
    );

    // ---- Animated counter for the summary figures --------------------------
    const AnimatedAmount = ({ value, style }) => {
        const animRef = useRef(new Animated.Value(0)).current;
        const [display, setDisplay] = useState(0);

        useEffect(() => {
            const listenerId = animRef.addListener(({ value: v }) => setDisplay(v));
            Animated.timing(animRef, {
                toValue: value,
                duration: 700,
                useNativeDriver: false,
            }).start();
            return () => animRef.removeListener(listenerId);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [value]);

        return <Text style={style}>{formatCurrency(display)}</Text>;
    };

    const FeeCard = ({ fee, compact = false }) => (
        <View style={[styles.feeCard, compact && styles.feeCardCompact]}>
            <View style={styles.feeHeader}>
                <View style={styles.feeTitleContainer}>
                    <Text style={styles.feeName} numberOfLines={0}>
                        {fee.fee_item?.name || 'Fee Item'}
                    </Text>
                    <Text style={styles.feeTermInfo}>
                        {fee.academic_year} • {fee.term}
                    </Text>
                </View>

                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: safeNumber(fee.balance) <= 0 ? COLORS.green : COLORS.error },
                    ]}
                >
                    <Text style={styles.statusText}>
                        {safeNumber(fee.balance) <= 0 ? 'Paid' : 'Pending'}
                    </Text>
                </View>
            </View>

            <View style={styles.feeAmounts}>
                <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Due:</Text>
                    <Text style={styles.amountValue}>{formatCurrency(fee.amount_due)}</Text>
                </View>
                <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Paid:</Text>
                    <Text style={[styles.amountValue, styles.paidAmount]}>
                        {formatCurrency(fee.amount_paid)}
                    </Text>
                </View>
                <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Balance:</Text>
                    <Text
                        style={[
                            styles.amountValue,
                            { color: safeNumber(fee.balance) <= 0 ? COLORS.green : COLORS.error },
                        ]}
                    >
                        {formatCurrency(fee.balance)}
                    </Text>
                </View>
            </View>
        </View>
    );

    const QuickAction = ({ icon, name, color, onPress, animValue }) => {
        const pressScale = useRef(new Animated.Value(1)).current;
        const onPressIn = () =>
            Animated.timing(pressScale, { toValue: 0.92, duration: 90, useNativeDriver: true }).start();
        const onPressOut = () =>
            Animated.timing(pressScale, { toValue: 1, duration: 140, useNativeDriver: true }).start();

        return (
            <Animated.View
                style={[
                    styles.quickAction,
                    {
                        opacity: animValue,
                        transform: [
                            { scale: Animated.multiply(animValue, pressScale) },
                            { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    activeOpacity={0.9}
                    style={{ alignItems: 'center' }}
                >
                    <LinearGradient
                        colors={[color, `${color}99`]}
                        style={styles.actionGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name={icon} size={23} color="white" />
                    </LinearGradient>
                    <Text style={styles.actionText}>{name}</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const navigateToSchoolInfo = () => {
        navigation.navigate('SchoolInfo', { school });
    };

    const chevronSpin = chevronRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

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
                        <Ionicons name="school" size={40} color={COLORS.blue} />
                    </View>
                    <ActivityIndicator size="small" color={COLORS.green} style={{ marginTop: 18 }} />
                    <Text style={styles.loadingText}>Loading Dashboard...</Text>
                </Animated.View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.green}
                        colors={[COLORS.blue, COLORS.green]}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
                        },
                    ]}
                >
                    <BlurView intensity={60} tint="dark" style={styles.blurHeader}>
                        <View style={styles.headerContent}>
                            <View style={styles.welcomeSection}>
                                <Text style={styles.greeting}>Welcome,</Text>
                                <Text style={styles.studentName}>
                                    {student?.first_name} {student?.last_name}
                                </Text>
                                <View style={styles.studentInfoRow}>
                                    <View style={styles.classPill}>
                                        <Text style={styles.classPillText}>
                                            {student?.school_class?.name || 'No Class'}
                                        </Text>
                                    </View>
                                    <Text style={styles.studentInfo}>{student?.student_id}</Text>
                                </View>
                                {student?.parent_name && (
                                    <Text style={styles.parentInfo}>Parent: {student.parent_name}</Text>
                                )}
                            </View>

                            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.section,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActions}>
                        <QuickAction
                            icon="card-outline"
                            name="Pay Fees"
                            color={COLORS.green}
                            onPress={() => navigation.navigate('Payment')}
                            animValue={actionAnims[0]}
                        />
                        <QuickAction
                            icon="document-text-outline"
                            name="Receipts"
                            color={COLORS.blue}
                            onPress={() => navigation.navigate('Receipts')}
                            animValue={actionAnims[1]}
                        />
                        <QuickAction
                            icon="school-outline"
                            name="School Info"
                            color={COLORS.amber}
                            onPress={navigateToSchoolInfo}
                            animValue={actionAnims[2]}
                        />
                        <QuickAction
                            icon="person-outline"
                            name="Profile"
                            color={COLORS.blueSoft}
                            onPress={() => navigation.navigate('Profile')}
                            animValue={actionAnims[3]}
                        />
                    </View>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.section,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <Text style={styles.sectionTitle}>Fee Summary</Text>
                    <BlurView intensity={50} tint="dark" style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Total Due</Text>
                                <AnimatedAmount value={feeSummary.totalDue} style={styles.summaryValue} />
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Total Paid</Text>
                                <AnimatedAmount
                                    value={feeSummary.totalPaid}
                                    style={[styles.summaryValue, styles.paidSummary]}
                                />
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Balance</Text>
                                <AnimatedAmount
                                    value={feeSummary.totalBalance}
                                    style={[
                                        styles.summaryValue,
                                        { color: feeSummary.totalBalance <= 0 ? COLORS.green : COLORS.error },
                                    ]}
                                />
                            </View>
                        </View>
                    </BlurView>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.section,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        },
                    ]}
                >
                    <View style={styles.feeDetailsHeader}>
                        <Text style={styles.sectionTitle}>Fee Details</Text>
                        <TouchableOpacity onPress={toggleFeeDetails} style={styles.viewAllButton}>
                            <Text style={styles.viewAllText}>{feeDetailsOpen ? 'Hide' : 'Show'}</Text>
                            <Animated.View style={{ transform: [{ rotate: chevronSpin }] }}>
                                <Ionicons name="chevron-down" size={16} color={COLORS.blueSoft} />
                            </Animated.View>
                        </TouchableOpacity>
                    </View>

                    <BlurView intensity={50} tint="dark" style={styles.feePreviewCard}>
                        <View style={styles.feePreviewRow}>
                            <View style={styles.feePreviewItem}>
                                <Text style={styles.feePreviewLabel}>Total Items</Text>
                                <Text style={styles.feePreviewValue}>{fees?.length || 0}</Text>
                            </View>

                            <View style={styles.feePreviewDivider} />

                            <View style={styles.feePreviewItem}>
                                <Text style={styles.feePreviewLabel}>Pending</Text>
                                <Text style={[styles.feePreviewValue, { color: COLORS.error }]}>
                                    {feeStatusCount.pending}
                                </Text>
                            </View>

                            <View style={styles.feePreviewDivider} />

                            <View style={styles.feePreviewItem}>
                                <Text style={styles.feePreviewLabel}>Paid</Text>
                                <Text style={[styles.feePreviewValue, { color: COLORS.green }]}>
                                    {feeStatusCount.paid}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.feePreviewHint}>
                            Tap "Show" to expand the full fee breakdown by term and academic year
                        </Text>
                    </BlurView>

                    {feeDetailsOpen && (
                        <View style={styles.feeDropdown}>
                            {groupedFees.length === 0 ? (
                                <View style={styles.emptyStateInline}>
                                    <Ionicons name="receipt-outline" size={42} color={COLORS.textDim} />
                                    <Text style={styles.emptyStateText}>No fee records found</Text>
                                    <Text style={styles.emptyStateSubtext}>
                                        Contact your school administrator to set up fee structures
                                    </Text>
                                </View>
                            ) : (
                                groupedFees.map((group) => (
                                    <View key={group.title} style={styles.feeGroupBlock}>
                                        <View style={styles.modalSectionHeader}>
                                            <Text style={styles.modalSectionTitle}>{group.title}</Text>
                                            <View style={styles.modalSectionBadges}>
                                                {group.unpaid.length > 0 && (
                                                    <View style={[styles.modalSectionBadge, styles.pendingBadge]}>
                                                        <Text
                                                            style={[
                                                                styles.modalSectionBadgeText,
                                                                styles.pendingBadgeText,
                                                            ]}
                                                        >
                                                            {group.unpaid.length} Pending
                                                        </Text>
                                                    </View>
                                                )}
                                                {group.paid.length > 0 && (
                                                    <View style={[styles.modalSectionBadge, styles.paidBadge]}>
                                                        <Text
                                                            style={[
                                                                styles.modalSectionBadgeText,
                                                                styles.paidBadgeText,
                                                            ]}
                                                        >
                                                            {group.paid.length} Paid
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {group.unpaid.map((fee, index) => (
                                            <View key={`unpaid-${fee.id || index}`} style={styles.feeItemWrap}>
                                                <FeeCard fee={fee} compact />
                                            </View>
                                        ))}

                                        {group.paid.map((fee, index) => (
                                            <View key={`paid-${fee.id || index}`} style={styles.feeItemWrap}>
                                                <FeeCard fee={fee} compact />
                                            </View>
                                        ))}
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </Animated.View>

                {school && (
                    <Animated.View
                        style={[
                            styles.section,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideUpAnim }],
                            },
                        ]}
                    >
                        <Text style={styles.sectionTitle}>School Information</Text>
                        <TouchableOpacity onPress={navigateToSchoolInfo} activeOpacity={0.85}>
                            <BlurView intensity={50} tint="dark" style={styles.schoolCard}>
                                <Text style={styles.schoolName}>{school.name}</Text>
                                <View style={styles.schoolDetails}>
                                    {school.city && school.state && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="location-outline" size={16} color={COLORS.textDim} />
                                            <Text style={styles.detailText}>
                                                {school.city}, {school.state}
                                            </Text>
                                        </View>
                                    )}
                                    {school.contact_number && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="call-outline" size={16} color={COLORS.textDim} />
                                            <Text style={styles.detailText}>{school.contact_number}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.viewFullInfo}>Tap to view full information</Text>
                            </BlurView>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                <View style={styles.footerWrap}>
                    <View style={styles.footerDot} />
                    <Text style={styles.poweredByText}>Powered by BinaryLenz</Text>
                </View>

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
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 60,
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
        width: 76,
        height: 76,
        borderRadius: 38,
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
        opacity: 0.28,
    },
    blobBlue: {
        width: width * 0.85,
        height: width * 0.85,
        top: -width * 0.35,
        right: -width * 0.35,
        backgroundColor: COLORS.blue,
    },
    blobGreen: {
        width: width * 0.65,
        height: width * 0.65,
        bottom: height * 0.25,
        left: -width * 0.3,
        backgroundColor: COLORS.green,
        opacity: 0.14,
    },
    header: {
        padding: 20,
        paddingTop: 10,
        marginTop: 45,
    },
    blurHeader: {
        borderRadius: 22,
        overflow: 'hidden',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    welcomeSection: {
        flex: 1,
    },
    greeting: {
        color: COLORS.textDim,
        fontSize: 15,
        marginBottom: 4,
    },
    studentName: {
        color: COLORS.white,
        fontSize: 23,
        fontWeight: '700',
        marginBottom: 8,
    },
    studentInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    classPill: {
        backgroundColor: 'rgba(62, 213, 152, 0.16)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    classPillText: {
        color: COLORS.greenSoft,
        fontSize: 12,
        fontWeight: '600',
    },
    studentInfo: {
        color: COLORS.textDim,
        fontSize: 13,
    },
    parentInfo: {
        color: COLORS.textFaint,
        fontSize: 12,
        marginTop: 8,
    },
    logoutButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    section: {
        padding: 20,
        paddingTop: 0,
    },
    sectionTitle: {
        color: COLORS.white,
        fontSize: 19,
        fontWeight: '700',
        marginBottom: 16,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    quickAction: {
        alignItems: 'center',
        flex: 1,
    },
    actionGradient: {
        width: 58,
        height: 58,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    actionText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    summaryCard: {
        borderRadius: 18,
        overflow: 'hidden',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryDivider: {
        width: 1,
        height: 34,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    summaryLabel: {
        color: COLORS.textDim,
        fontSize: 12,
        marginBottom: 8,
    },
    summaryValue: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },
    paidSummary: {
        color: COLORS.green,
    },
    feeDetailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(47, 111, 237, 0.16)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    viewAllText: {
        color: COLORS.blueSoft,
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    feePreviewCard: {
        borderRadius: 18,
        overflow: 'hidden',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    feePreviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 12,
    },
    feePreviewItem: {
        alignItems: 'center',
        flex: 1,
    },
    feePreviewLabel: {
        color: COLORS.textDim,
        fontSize: 12,
        marginBottom: 4,
    },
    feePreviewValue: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: '700',
    },
    feePreviewDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    feePreviewHint: {
        color: COLORS.textFaint,
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
    },
    feeDropdown: {
        marginTop: 14,
        padding: 14,
        borderRadius: 18,
        backgroundColor: 'rgba(10, 18, 36, 0.35)',
        overflow: 'visible',
    },
    feeGroupBlock: {
        marginBottom: 18,
        overflow: 'visible',
    },
    feeItemWrap: {
        marginTop: 8,
        overflow: 'visible',
    },
    schoolCard: {
        borderRadius: 18,
        overflow: 'hidden',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    schoolName: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    schoolDetails: {
        gap: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
    },
    viewFullInfo: {
        color: COLORS.blueSoft,
        fontSize: 12,
        marginTop: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
    footerWrap: {
        paddingTop: 20,
        paddingBottom: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    footerDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: COLORS.green,
    },
    poweredByText: {
        color: COLORS.textDim,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.4,
    },
    bottomSpacer: {
        height: 40,
    },
    feeCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 14,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.blue,
        overflow: 'visible',
    },
    feeCardCompact: {
        padding: 12,
    },
    feeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 10,
    },
    feeTitleContainer: {
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    feeName: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        flexShrink: 1,
        flexWrap: 'wrap',
        lineHeight: 22,
    },
    feeTermInfo: {
        color: COLORS.textDim,
        fontSize: 12,
        fontWeight: '500',
        flexWrap: 'wrap',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: '600',
    },
    feeAmounts: {
        gap: 8,
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    amountLabel: {
        color: COLORS.textDim,
        fontSize: 14,
        flexShrink: 0,
    },
    amountValue: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    paidAmount: {
        color: COLORS.green,
    },
    modalSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(47, 111, 237, 0.18)',
        borderRadius: 12,
        marginBottom: 8,
        gap: 10,
    },
    modalSectionTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        minWidth: 0,
        flexWrap: 'wrap',
        lineHeight: 22,
        paddingRight: 6,
    },
    modalSectionBadges: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalSectionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pendingBadge: {
        backgroundColor: 'rgba(255, 107, 107, 0.18)',
    },
    paidBadge: {
        backgroundColor: 'rgba(62, 213, 152, 0.18)',
    },
    modalSectionBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    pendingBadgeText: {
        color: COLORS.error,
    },
    paidBadgeText: {
        color: COLORS.green,
    },
    emptyStateInline: {
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        minHeight: 200,
    },
    emptyStateText: {
        color: COLORS.textDim,
        fontSize: 16,
        marginTop: 12,
        fontWeight: '500',
    },
    emptyStateSubtext: {
        color: COLORS.textFaint,
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
});