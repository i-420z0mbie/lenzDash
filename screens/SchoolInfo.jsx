import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Animated,
    RefreshControl,
    FlatList,
    Platform,
    Dimensions,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api';

const { width, height } = Dimensions.get('window');

// ---- Palette (shared language with Login.js / Home.js / Receipts.js) ----
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

export default function SchoolInfo({ route, navigation }) {
    const { school } = route.params || {};

    const [activeTab, setActiveTab] = useState('all'); // all | unread | read
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [logoLoading, setLogoLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Animation values (mirrors Receipts.js)
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const refreshSpin = useRef(new Animated.Value(0)).current;
    const blobA = useRef(new Animated.Value(0)).current;
    const blobB = useRef(new Animated.Value(0)).current;
    const haloPulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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
        ]).start();
    };

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

        Animated.loop(
            Animated.sequence([
                Animated.timing(haloPulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(haloPulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;

        const baseURL = api?.defaults?.baseURL || '';
        const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `${cleanBase}${cleanPath}`;
    };

    const logoUrl = school?.logo ? getImageUrl(school.logo) : null;

    const normalizeNotifications = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.results && Array.isArray(data.results)) return data.results;
        return [];
    };

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/main/notifications/');
            const items = normalizeNotifications(res.data);
            setNotifications(items);
        } catch (error) {
            console.log('Failed to load notifications:', error?.response?.data || error.message);
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        spinRefreshIcon();
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = useCallback(async (id) => {
        const item = notifications.find((n) => n.id === id);
        if (!item || item.is_read) return;

        setActionLoadingId(id);
        try {
            await api.patch(`/main/notifications/${id}/`, { is_read: true });

            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (error) {
            console.log('Failed to mark as read:', error?.response?.data || error.message);
        } finally {
            setActionLoadingId(null);
        }
    }, [notifications]);

    const openNotification = useCallback(async (item) => {
        setExpandedId((current) => (current === item.id ? null : item.id));

        if (!item.is_read) {
            await markAsRead(item.id);
        }
    }, [markAsRead]);

    const stats = useMemo(() => {
        const unread = notifications.filter((n) => !n.is_read).length;
        const read = notifications.filter((n) => n.is_read).length;
        return { total: notifications.length, unread, read };
    }, [notifications]);

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'unread') return notifications.filter((n) => !n.is_read);
        if (activeTab === 'read') return notifications.filter((n) => n.is_read);
        return notifications;
    }, [notifications, activeTab]);

    const formatDate = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';

        return new Intl.DateTimeFormat('en', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    // ---- Notification card, restyled to match Receipts.js's receiptCard ----
    const NotificationCard = ({ item, index }) => {
        const cardScale = useRef(new Animated.Value(1)).current;
        const pressIn = () => Animated.timing(cardScale, { toValue: 0.97, duration: 90, useNativeDriver: true }).start();
        const pressOut = () => Animated.timing(cardScale, { toValue: 1, duration: 140, useNativeDriver: true }).start();

        const expanded = expandedId === item.id;
        const unread = !item.is_read;

        return (
            <Animated.View
                style={[
                    styles.notificationCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            {
                                translateY: slideUpAnim.interpolate({
                                    inputRange: [0, 30],
                                    outputRange: [0, Math.min(index, 4) * 8],
                                }),
                            },
                            { scale: cardScale },
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => openNotification(item)}
                    onPressIn={pressIn}
                    onPressOut={pressOut}
                >
                    <BlurView intensity={50} tint="dark" style={styles.notificationBlur}>
                        <View style={styles.notificationTopRow}>
                            <View style={[styles.notificationIconWrap, unread ? styles.iconWrapUnread : styles.iconWrapRead]}>
                                <Ionicons
                                    name={unread ? 'mail-unread-outline' : 'mail-open-outline'}
                                    size={19}
                                    color={COLORS.white}
                                />
                            </View>

                            <View style={styles.notificationHeaderText}>
                                <Text style={styles.notificationTitle} numberOfLines={2}>
                                    {item.title || 'Notification'}
                                </Text>
                                <Text style={styles.notificationDate}>
                                    {formatDate(item.created_at)}
                                </Text>
                            </View>

                            <View style={[
                                styles.receiptTypeBadge,
                                unread ? styles.unreadBadge : styles.readBadge
                            ]}>
                                <Text style={styles.receiptTypeText}>
                                    {unread ? 'Unread' : 'Read'}
                                </Text>
                            </View>
                        </View>

                        <Text
                            style={styles.notificationMessage}
                            numberOfLines={expanded ? undefined : 3}
                        >
                            {item.message || ''}
                        </Text>

                        <View style={styles.actionButtons}>
                            <View style={[styles.actionButton, styles.metaButton]}>
                                <Ionicons name="school-outline" size={16} color={COLORS.white} />
                                <Text style={styles.actionButtonText} numberOfLines={1}>
                                    {school?.name || 'School'}
                                </Text>
                            </View>
                            <View style={[styles.actionButton, styles.viewMetaButton]}>
                                <Ionicons
                                    name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                                    size={16}
                                    color={COLORS.white}
                                />
                                <Text style={styles.actionButtonText}>
                                    {expanded ? 'Hide' : 'View'}
                                </Text>
                            </View>
                        </View>

                        {actionLoadingId === item.id && (
                            <View style={styles.pdfStatus}>
                                <ActivityIndicator size="small" color={COLORS.blueSoft} />
                                <Text style={styles.pdfStatusText}>Updating...</Text>
                            </View>
                        )}
                    </BlurView>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const EmptyState = () => (
        <Animated.View
            style={[
                styles.emptyState,
                { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
            ]}
        >
            <BlurView intensity={50} tint="dark" style={styles.emptyBlur}>
                <View style={styles.emptyIconCircle}>
                    <Ionicons
                        name={activeTab === 'read' ? 'mail-open-outline' : 'notifications-off-outline'}
                        size={46}
                        color={COLORS.blueSoft}
                    />
                </View>
                <Text style={styles.emptyTitle}>
                    {activeTab === 'unread'
                        ? 'No Unread Notifications'
                        : activeTab === 'read'
                            ? 'No Read Notifications'
                            : 'No Notifications Yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                    Notifications from your school will appear here
                </Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}
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
    const haloScale = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
    const haloOpacity = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.1] });

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
                        { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
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
                                <Text style={styles.headerTitle}>School Notifications</Text>
                                <Text style={styles.headerSubtitle} numberOfLines={1}>
                                    {school?.name || 'School Information'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={onRefresh}
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

                {/* ---- Totally redesigned School Info hero ---- */}
                <Animated.View
                    style={[
                        styles.heroWrap,
                        { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                    ]}
                >
                    <BlurView intensity={55} tint="dark" style={styles.heroBlur}>
                        <LinearGradient
                            colors={['rgba(47,111,237,0.28)', 'rgba(62,213,152,0.06)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroAccentBar}
                        />

                        {/* Watermark icon */}
                        <Ionicons
                            name="school"
                            size={140}
                            color="rgba(255,255,255,0.035)"
                            style={styles.heroWatermark}
                        />

                        <View style={styles.heroLogoRow}>
                            <View style={styles.logoHaloWrap}>
                                <Animated.View
                                    style={[
                                        styles.logoHalo,
                                        { transform: [{ scale: haloScale }], opacity: haloOpacity },
                                    ]}
                                />
                                {logoUrl ? (
                                    <View style={styles.logoCircle}>
                                        <Image
                                            source={{ uri: logoUrl }}
                                            style={styles.logoImage}
                                            onLoadStart={() => setLogoLoading(true)}
                                            onLoadEnd={() => setLogoLoading(false)}
                                            onError={() => setLogoLoading(false)}
                                        />
                                        {logoLoading && (
                                            <View style={styles.logoLoader}>
                                                <ActivityIndicator size="small" color={COLORS.white} />
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View style={styles.logoCircle}>
                                        <Ionicons name="school" size={32} color={COLORS.white} />
                                    </View>
                                )}
                            </View>

                            <View style={styles.verifiedPill}>
                                <Ionicons name="shield-checkmark" size={13} color={COLORS.green} />
                                <Text style={styles.verifiedPillText}>Active School</Text>
                            </View>
                        </View>

                        <Text style={styles.schoolNameNew} numberOfLines={2}>
                            {school?.name || 'No School Selected'}
                        </Text>
                        <Text style={styles.schoolTagNew}>
                            Notifications for parents & students
                        </Text>

                        {/* Stat chips styled like receipt badges */}
                        <View style={styles.statChipsRow}>
                            <StatChip label="All" value={stats.total} color={COLORS.blueSoft} icon="albums-outline" />
                            <StatChip label="Unread" value={stats.unread} color={COLORS.blue} icon="mail-unread-outline" />
                            <StatChip label="Read" value={stats.read} color={COLORS.green} icon="checkmark-done-outline" />
                        </View>

                        {/* Contact info grid */}
                        <View style={styles.contactGrid}>
                            {school?.contact_number ? (
                                <ContactTile icon="call-outline" label="Phone" value={school.contact_number} />
                            ) : null}
                            {school?.email ? (
                                <ContactTile icon="mail-outline" label="Email" value={school.email} />
                            ) : null}
                        </View>

                        {school?.address_line ? (
                            <View style={styles.addressTile}>
                                <View style={styles.addressIconWrap}>
                                    <Ionicons name="location-outline" size={17} color={COLORS.blueSoft} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.contactLabel}>Address</Text>
                                    <Text style={styles.addressValue}>
                                        {`${school.address_line}${school.city ? `, ${school.city}` : ''}${school.state ? `, ${school.state}` : ''}`}
                                    </Text>
                                </View>
                            </View>
                        ) : null}
                    </BlurView>
                </Animated.View>

                {/* Section header + tabs */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <Text style={styles.sectionCount}>
                        {filteredNotifications.length} item{filteredNotifications.length === 1 ? '' : 's'}
                    </Text>
                </View>

                <View style={styles.tabsRow}>
                    <TabButton
                        label={`All (${stats.total})`}
                        active={activeTab === 'all'}
                        onPress={() => setActiveTab('all')}
                    />
                    <TabButton
                        label={`Unread (${stats.unread})`}
                        active={activeTab === 'unread'}
                        onPress={() => setActiveTab('unread')}
                    />
                    <TabButton
                        label={`Read (${stats.read})`}
                        active={activeTab === 'read'}
                        onPress={() => setActiveTab('read')}
                    />
                </View>

                {/* Notifications list */}
                <View style={styles.notificationsList}>
                    {loading ? (
                        <View style={styles.loaderWrap}>
                            <ActivityIndicator size="large" color={COLORS.green} />
                            <Text style={styles.loaderText}>Loading notifications...</Text>
                        </View>
                    ) : filteredNotifications.length > 0 ? (
                        <FlatList
                            data={filteredNotifications}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={({ item, index }) => <NotificationCard item={item} index={index} />}
                            scrollEnabled={false}
                        />
                    ) : (
                        <EmptyState />
                    )}
                </View>

                {/* Help text, matching Receipts.js */}
                <Animated.View
                    style={[
                        styles.helpSection,
                        { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                    ]}
                >
                    <BlurView intensity={50} tint="dark" style={styles.helpBlur}>
                        <Ionicons name="information-circle-outline" size={20} color={COLORS.blueSoft} />
                        <Text style={styles.helpText}>
                            Tap a notification to read the full message. Opening an unread
                            notification will automatically mark it as read.
                        </Text>
                    </BlurView>
                </Animated.View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by BinaryLenz</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const StatChip = ({ label, value, color, icon }) => (
    <View style={[styles.statChip, { borderColor: `${color}66`, backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={styles.statChipValue}>{value}</Text>
        <Text style={styles.statChipLabel}>{label}</Text>
    </View>
);

const ContactTile = ({ icon, label, value }) => (
    <View style={styles.contactTile}>
        <View style={styles.contactIconWrap}>
            <Ionicons name={icon} size={16} color={COLORS.blueSoft} />
        </View>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue} numberOfLines={1}>{value}</Text>
    </View>
);

const TabButton = ({ label, active, onPress }) => (
    <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.tabBtn, active && styles.tabBtnActive]}
    >
        <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgTop,
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

    // Header
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
        paddingHorizontal: 8,
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

    // ---- New hero ----
    heroWrap: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    heroBlur: {
        borderRadius: 24,
        padding: 22,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    heroAccentBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    heroWatermark: {
        position: 'absolute',
        right: -20,
        top: -20,
    },
    heroLogoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    logoHaloWrap: {
        width: 76,
        height: 76,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoHalo: {
        position: 'absolute',
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: COLORS.blue,
    },
    logoCircle: {
        width: 68,
        height: 68,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: COLORS.blueDeep,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    logoLoader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    verifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(62, 213, 152, 0.14)',
        borderWidth: 1,
        borderColor: 'rgba(62, 213, 152, 0.4)',
        gap: 5,
    },
    verifiedPillText: {
        color: COLORS.greenSoft,
        fontSize: 11,
        fontWeight: '700',
    },
    schoolNameNew: {
        color: COLORS.white,
        fontSize: 23,
        fontWeight: '800',
        lineHeight: 29,
    },
    schoolTagNew: {
        color: COLORS.textDim,
        fontSize: 13,
        marginTop: 4,
        marginBottom: 18,
    },
    statChipsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 18,
    },
    statChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        gap: 5,
    },
    statChipValue: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '800',
    },
    statChipLabel: {
        color: COLORS.textDim,
        fontSize: 11,
        fontWeight: '600',
    },
    contactGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    contactTile: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 12,
    },
    contactIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: 'rgba(47, 111, 237, 0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    contactLabel: {
        color: COLORS.textFaint,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    contactValue: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
    },
    addressTile: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 12,
        gap: 10,
    },
    addressIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: 'rgba(47, 111, 237, 0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    addressValue: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },

    // Section header + tabs
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 22,
        marginTop: 22,
        marginBottom: 10,
    },
    sectionTitle: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
    sectionCount: {
        color: COLORS.textDim,
        fontSize: 12,
    },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 8,
    },
    tabBtn: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 11,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    tabBtnActive: {
        backgroundColor: 'rgba(47, 111, 237, 0.22)',
        borderColor: 'rgba(47, 111, 237, 0.45)',
    },
    tabBtnText: {
        color: COLORS.textDim,
        fontSize: 12,
        fontWeight: '700',
    },
    tabBtnTextActive: {
        color: COLORS.white,
    },

    // Notifications list
    notificationsList: {
        paddingHorizontal: 20,
    },
    notificationCard: {
        marginBottom: 16,
        borderRadius: 18,
        overflow: 'hidden',
    },
    notificationBlur: {
        padding: 20,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    notificationTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    notificationIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconWrapUnread: {
        backgroundColor: COLORS.blue,
    },
    iconWrapRead: {
        backgroundColor: 'rgba(62, 213, 152, 0.35)',
    },
    notificationHeaderText: {
        flex: 1,
        marginRight: 8,
    },
    notificationTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 21,
    },
    notificationDate: {
        color: COLORS.textDim,
        fontSize: 12,
        marginTop: 4,
    },
    receiptTypeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    unreadBadge: {
        backgroundColor: 'rgba(47, 111, 237, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(47, 111, 237, 0.4)',
    },
    readBadge: {
        backgroundColor: 'rgba(62, 213, 152, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(62, 213, 152, 0.4)',
    },
    receiptTypeText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: '600',
    },
    notificationMessage: {
        color: COLORS.textDim,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
        flex: 1,
    },
    metaButton: {
        backgroundColor: 'rgba(47, 111, 237, 0.22)',
        borderWidth: 1,
        borderColor: 'rgba(47, 111, 237, 0.45)',
    },
    viewMetaButton: {
        backgroundColor: 'rgba(62, 213, 152, 0.22)',
        borderWidth: 1,
        borderColor: 'rgba(62, 213, 152, 0.45)',
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 13,
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
        color: COLORS.blueSoft,
        fontSize: 12,
        fontWeight: '500',
    },

    // Loading / empty states
    loaderWrap: {
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loaderText: {
        color: COLORS.textDim,
        marginTop: 12,
        fontSize: 14,
    },
    emptyState: {
        paddingBottom: 4,
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

    // Help + footer
    helpSection: {
        padding: 20,
        paddingTop: 6,
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
    footer: {
        alignItems: 'center',
        paddingBottom: 30,
    },
    footerText: {
        color: COLORS.textFaint,
        fontSize: 13,
        fontWeight: '700',
    },
});