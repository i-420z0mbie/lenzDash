// screens/Login.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../src/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN, REFRESH_TOKEN, SAVED_ACCOUNTS } from '../src/constant';

const { width, height } = Dimensions.get('window');

// ---- Palette -----------------------------------------------------------
// Echoes the logo (blue + white) without drowning the screen in it, and
// introduces a light-green accent for "success" / positive moments so the
// UI doesn't read as a generic purple auth screen.
const COLORS = {
  bgTop: '#0A1730',
  bgMid: '#0F2447',
  bgBottom: '#123055',
  blue: '#2F6FED',
  blueSoft: '#5B8DF6',
  blueDeep: '#193B78',
  green: '#3ED598',
  greenSoft: '#8FF0C6',
  white: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.62)',
  textFaint: 'rgba(255,255,255,0.4)',
  error: '#FF5C72',
};

export default function Login({ navigation, registerPushToken }) {
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState({ studentId: '', password: '' });
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ studentId: false, pin: false });
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Refs for inputs
  const studentIdRef = useRef(null);
  const pinRef = useRef(null);

  // ---- Animation values -------------------------------------------------
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoRing = useRef(new Animated.Value(0)).current; // pulsing green ring
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonColor = useRef(new Animated.Value(0)).current; // 0 = blue, 1 = green
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fieldAnims = useRef([new Animated.Value(0), new Animated.Value(0)]).current; // staggered fields
  const blobA = useRef(new Animated.Value(0)).current;
  const blobB = useRef(new Animated.Value(0)).current;
  const savedListAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkExistingToken();
    loadSavedAccounts();

    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      handleKeyboardShow
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      handleKeyboardHide
    );

    startAnimations();
    startAmbientLoops();

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const checkExistingToken = async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (token) {
        try {
          await api.get('main/students/me/');
          navigation.replace('Home');
        } catch (error) {
          await AsyncStorage.removeItem(ACCESS_TOKEN);
          await AsyncStorage.removeItem(REFRESH_TOKEN);
        }
      }
    } catch (err) {
      console.warn('Token check error', err);
    }
  };

  const loadSavedAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const accountsData = await AsyncStorage.getItem(SAVED_ACCOUNTS);
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        setSavedAccounts(accounts);
      }
    } catch (error) {
      console.error('Error loading saved accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const saveAccount = async (studentData, token) => {
    try {
      const account = {
        student_id: studentData.student_id,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        avatar_initials: `${studentData.first_name?.[0] || ''}${studentData.last_name?.[0] || ''}`.toUpperCase(),
        school_name: studentData.school?.name || '',
        class_name: studentData.school_class?.name || '',
        timestamp: new Date().toISOString(),
        token: token
      };

      const existingAccounts = savedAccounts.filter(
        acc => acc.student_id !== studentData.student_id
      );

      const updatedAccounts = [account, ...existingAccounts];
      const limitedAccounts = updatedAccounts.slice(0, 4);

      setSavedAccounts(limitedAccounts);
      await AsyncStorage.setItem(SAVED_ACCOUNTS, JSON.stringify(limitedAccounts));
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const removeAccount = async (studentIdToRemove) => {
    try {
      Alert.alert(
        'Remove Account',
        'Are you sure you want to remove this saved account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const updatedAccounts = savedAccounts.filter(
                acc => acc.student_id !== studentIdToRemove
              );
              setSavedAccounts(updatedAccounts);
              await AsyncStorage.setItem(SAVED_ACCOUNTS, JSON.stringify(updatedAccounts));
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error removing account:', error);
    }
  };

  const handleSavedAccountPress = async (account) => {
    try {
      setIsLoading(true);
      setServerError('');

      setStudentId('');
      setPin('');

      if (account.token) {
        await AsyncStorage.setItem(ACCESS_TOKEN, account.token);

        try {
          await api.get('main/students/me/');
          await playSuccessThenNavigate();
          return;
        } catch (error) {
          console.log('Saved token expired');
        }
      }

      setStudentId(account.student_id);
      pinRef.current?.focus();

      setTimeout(() => {
        Alert.alert(
          'Enter PIN',
          'Please enter your PIN to continue',
          [{ text: 'OK' }]
        );
      }, 300);

    } catch (error) {
      console.error('Error with saved account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Keyboard handling --------------------------------------------------
  const handleKeyboardShow = () => {
    setKeyboardVisible(true);
    Animated.timing(formTranslateY, {
      toValue: -30,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleKeyboardHide = () => {
    setKeyboardVisible(false);
    Animated.timing(formTranslateY, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // ---- Entrance & ambient animations ---------------------------------------
  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.stagger(120, [
      Animated.timing(fieldAnims[0], {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fieldAnims[1], {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(savedListAnim, {
      toValue: 1,
      duration: 500,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Subtle "living" background: a soft green pulse ring behind the logo,
  // and two slow-drifting blurred blobs in the backdrop.
  const startAmbientLoops = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRing, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoRing, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blobA, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(blobA, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blobB, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(blobB, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0.6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -0.6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const playSuccessThenNavigate = () => {
    return new Promise((resolve) => {
      setIsSuccess(true);
      Animated.timing(buttonColor, {
        toValue: 1,
        duration: 260,
        useNativeDriver: false, // color interpolation needs the JS driver
      }).start(() => {
        setTimeout(() => {
          navigation.replace('Home');
          resolve();
        }, 350);
      });
    });
  };

  // ---- Validation & auth ---------------------------------------------------
  const validateField = (fieldName, value) => {
    let errorMessage = '';

    if (!value.trim()) {
      errorMessage = `${fieldName === 'username' ? 'Student ID' : 'PIN'} is required`;
    } else if (fieldName === 'password' && value.length < 4) {
      errorMessage = 'PIN must be at least 4 characters';
    }

    setError(prev => ({
      ...prev,
      [fieldName === 'username' ? 'studentId' : 'password']: errorMessage
    }));

    return !errorMessage;
  };

  const performLogin = async (sid, pwd) => {
    const response = await api.post('main/students/login/', {
      student_id: sid,
      pin: pwd
    });

    const { token, student } = response.data;

    await AsyncStorage.setItem(ACCESS_TOKEN, token);
    if (response.data.refresh) {
      await AsyncStorage.setItem(REFRESH_TOKEN, response.data.refresh);
    }

    await saveAccount(student, token);

    if (registerPushToken) {
      console.log('Attempting push token registration...');
      registerPushToken()
        .then(() => console.log('✅ Push token registered'))
        .catch(err => console.warn('⚠️ Push registration error:', err));
    }

    await playSuccessThenNavigate();
  };

  const handleLogin = async () => {
    animateButtonPress();
    setServerError('');

    const validStudentId = validateField('username', studentId);
    const validPin = validateField('password', pin);
    if (!validStudentId || !validPin) {
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      console.log('🟡 Attempting login...');
      await performLogin(studentId.trim(), pin);
    } catch (err) {
      console.error('❌ Login error:', err.response?.data || err.message);
      triggerShake();

      if (err?.response?.status === 401) {
        setServerError('Incorrect Student ID or PIN.');
      } else if (err?.response?.status === 400) {
        setServerError('Invalid credentials. Please check and try again.');
      } else if (err?.response?.status === 404) {
        setServerError('Student account not found.');
      } else {
        setServerError(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          'Login failed. Please try again later.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const focusNextField = (nextField) => {
    nextField?.current?.focus();
  };

  // ---- Interpolations -------------------------------------------------------
  const ringScale = logoRing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const ringOpacity = logoRing.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  const blobATranslate = blobA.interpolate({ inputRange: [0, 1], outputRange: [0, 26] });
  const blobBTranslate = blobB.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });

  const shakeTranslate = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });

  const buttonBg = buttonColor.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.blue, COLORS.green],
  });

  const fieldStyle = (v) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  const SavedAccountItem = ({ account }) => {
    const pressScale = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.timing(pressScale, { toValue: 0.97, duration: 90, useNativeDriver: true }).start();
    const onPressOut = () => Animated.timing(pressScale, { toValue: 1, duration: 120, useNativeDriver: true }).start();

    return (
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <TouchableOpacity
          onPress={() => handleSavedAccountPress(account)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.savedAccountItem}
          activeOpacity={0.85}
        >
          <View style={styles.savedAccountContent}>
            <View style={styles.savedAccountAvatar}>
              <LinearGradient
                colors={[COLORS.blue, COLORS.blueDeep]}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{account.avatar_initials}</Text>
              </LinearGradient>
              <View style={styles.avatarDot} />
            </View>

            <View style={styles.savedAccountInfo}>
              <Text style={styles.savedAccountName} numberOfLines={1}>
                {account.first_name} {account.last_name}
              </Text>
              <Text style={styles.savedAccountSubtitle} numberOfLines={1}>
                ID {account.student_id}
              </Text>
              {account.class_name ? (
                <Text style={styles.savedAccountClass} numberOfLines={1}>
                  {account.class_name}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => removeAccount(account.student_id)}
              style={styles.removeAccountButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={COLORS.textDim} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Backdrop: deep blue gradient + two slow-drifting soft blobs */}
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
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateY: formTranslateY }
              ]
            }
          ]}
        >
          <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
            {/* Logo/Header */}
            <View style={styles.header}>
              <View style={styles.logoWrap}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.logoRing,
                    { opacity: ringOpacity, transform: [{ scale: ringScale }] },
                  ]}
                />
                <Animated.View style={[styles.logoCircle, { transform: [{ scale: logoScale }] }]}>
                  <Ionicons name="school" size={30} color={COLORS.blue} />
                </Animated.View>
              </View>
              <Text style={styles.welcomeText}>Welcome to LenzPay</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Student ID Input */}
              <Animated.View style={[styles.inputContainer, fieldStyle(fieldAnims[0])]}>
                <View style={[
                  styles.inputWrapper,
                  isFocused.studentId && styles.inputFocused,
                  error.studentId && styles.inputError
                ]}>
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={isFocused.studentId ? COLORS.blueSoft : COLORS.textDim}
                  />
                  <TextInput
                    ref={studentIdRef}
                    style={styles.input}
                    placeholder="Student ID"
                    placeholderTextColor={COLORS.textFaint}
                    autoCapitalize="none"
                    keyboardType="default"
                    returnKeyType="next"
                    value={studentId}
                    onChangeText={setStudentId}
                    onFocus={() => setIsFocused({ ...isFocused, studentId: true })}
                    onBlur={() => setIsFocused({ ...isFocused, studentId: false })}
                    onSubmitEditing={() => focusNextField(pinRef)}
                    blurOnSubmit={false}
                  />
                </View>
                {error.studentId ? (
                  <Text style={styles.errorText}>{error.studentId}</Text>
                ) : null}
              </Animated.View>

              {/* PIN Input */}
              <Animated.View style={[styles.inputContainer, fieldStyle(fieldAnims[1])]}>
                <View style={[
                  styles.inputWrapper,
                  isFocused.pin && styles.inputFocused,
                  error.password && styles.inputError
                ]}>
                  <Ionicons
                    name="key-outline"
                    size={19}
                    color={isFocused.pin ? COLORS.blueSoft : COLORS.textDim}
                  />
                  <TextInput
                    ref={pinRef}
                    style={styles.input}
                    placeholder="PIN"
                    placeholderTextColor={COLORS.textFaint}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    returnKeyType="done"
                    secureTextEntry={!showPassword}
                    value={pin}
                    onChangeText={setPin}
                    onFocus={() => setIsFocused({ ...isFocused, pin: true })}
                    onBlur={() => setIsFocused({ ...isFocused, pin: false })}
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color={COLORS.textDim}
                    />
                  </TouchableOpacity>
                </View>
                {error.password ? (
                  <Text style={styles.errorText}>{error.password}</Text>
                ) : null}
              </Animated.View>

              {/* Server Error */}
              {serverError ? (
                <Animated.View
                  style={[styles.serverError, { transform: [{ translateX: shakeTranslate }] }]}
                >
                  <Ionicons name="warning-outline" size={16} color={COLORS.error} />
                  <Text style={styles.serverErrorText}>{serverError}</Text>
                </Animated.View>
              ) : null}

              {/* Login Button */}
              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={handleLogin}
                disabled={isLoading || isSuccess}
                activeOpacity={0.9}
              >
                <Animated.View
                  style={[
                    styles.buttonGradient,
                    { backgroundColor: buttonBg, transform: [{ scale: buttonScale }] },
                  ]}
                >
                  {isSuccess ? (
                    <View style={styles.buttonContent}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                      <Text style={[styles.buttonText, { marginLeft: 8 }]}>Welcome back</Text>
                    </View>
                  ) : isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Log In</Text>
                      <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Saved Accounts Section */}
          {!keyboardVisible && savedAccounts.length > 0 && (
            <Animated.View
              style={[
                styles.savedAccountsContainer,
                {
                  opacity: savedListAnim,
                  transform: [{ translateY: savedListAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                },
              ]}
            >
              <View style={styles.savedAccountsHeaderRow}>
                <View style={styles.savedAccountsHeaderIcon}>
                  <Ionicons name="people-outline" size={14} color={COLORS.green} />
                </View>
                <Text style={styles.savedAccountsTitle}>Saved Accounts</Text>
              </View>
              <Text style={styles.savedAccountsSubtitle}>
                Choose from recently used accounts
              </Text>

              <View style={styles.savedAccountsList}>
                {savedAccounts.map((account) => (
                  <SavedAccountItem key={account.student_id} account={account} />
                ))}
              </View>

              <TouchableOpacity
                onPress={() => {
                  setStudentId('');
                  setPin('');
                  studentIdRef.current?.focus();
                }}
                style={styles.useAnotherAccountButton}
              >
                <Text style={styles.useAnotherAccountText}>+ Use another account</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By logging in, you agree to our Terms and Privacy Policy.
          </Text>
          <Text style={styles.footerText}>
            Need help? Contact your school administrator.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgTop,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  blobBlue: {
    width: width * 0.9,
    height: width * 0.9,
    top: -width * 0.35,
    right: -width * 0.35,
    backgroundColor: COLORS.blue,
  },
  blobGreen: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -width * 0.25,
    left: -width * 0.3,
    backgroundColor: COLORS.green,
    opacity: 0.18,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 100,
    minHeight: height * 0.8,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  inputFocused: {
    borderColor: COLORS.blueSoft,
    backgroundColor: 'rgba(47, 111, 237, 0.12)',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  serverError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 92, 114, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  serverErrorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  savedAccountsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  savedAccountsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  savedAccountsHeaderIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(62, 213, 152, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  savedAccountsTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  savedAccountsSubtitle: {
    color: COLORS.textDim,
    fontSize: 13,
    marginBottom: 18,
    marginLeft: 30,
  },
  savedAccountsList: {
    marginBottom: 14,
  },
  savedAccountItem: {
    marginBottom: 10,
  },
  savedAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  savedAccountAvatar: {
    marginRight: 12,
    position: 'relative',
  },
  avatarGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.bgMid,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  savedAccountInfo: {
    flex: 1,
  },
  savedAccountName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  savedAccountSubtitle: {
    color: COLORS.textDim,
    fontSize: 13,
    marginBottom: 2,
  },
  savedAccountClass: {
    color: COLORS.textFaint,
    fontSize: 12,
  },
  removeAccountButton: {
    padding: 4,
  },
  useAnotherAccountButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  useAnotherAccountText: {
    color: COLORS.greenSoft,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: COLORS.textFaint,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
});