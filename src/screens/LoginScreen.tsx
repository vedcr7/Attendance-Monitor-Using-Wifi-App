/**
 * LoginScreen — Real API authentication.
 *
 * Two modes (tab-switched):
 *   1. Email + Password  → POST /api/auth/login
 *   2. Phone OTP         → POST /api/auth/request-otp → POST /api/auth/verify-otp
 *
 * On success: JWT stored in EncryptedStorage, navigate to Dashboard.
 * Demo cards updated to match backend seed data.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { loginWithPassword, requestOtp, verifyOtp, loadStoredSession } from '../services/authService';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type LoginMode = 'password' | 'otp';
type OtpStep = 'phone' | 'verify';

export function LoginScreen({ navigation }: Props) {
  // ── Auto-login check ───────────────────────────────────────────────────
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    loadStoredSession().then(stored => {
      if (stored?.token && stored?.user) {
        navigation.replace('Dashboard', { user: stored.user });
      } else {
        setCheckingSession(false);
      }
    });
  }, [navigation]);

  // ── Form state ─────────────────────────────────────────────────────────
  const [mode, setMode] = useState<LoginMode>('password');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');

  // Password mode
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  // OTP mode
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState('');
  const [devOtp, setDevOtp]     = useState<string | null>(null); // shown in dev
  const [otpCountdown, setOtpCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shared
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Password login ─────────────────────────────────────────────────────
  const handlePasswordLogin = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password)     { setError('Password is required'); return; }
    setError('');
    setIsLoading(true);
    try {
      const { user } = await loginWithPassword(email.trim().toLowerCase(), password);
      navigation.replace('Dashboard', { user });
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP — request ─────────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Enter a valid 10-digit phone number'); return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await requestOtp(phone.trim());
      setDevOtp(res._dev_otp ?? null); // shown in dev build only
      setOtpStep('verify');
      // Start 30-second resend countdown
      setOtpCountdown(30);
      countdownRef.current = setInterval(() => {
        setOtpCountdown(prev => {
          if (prev <= 1) { clearInterval(countdownRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP — verify ──────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP'); return;
    }
    setError('');
    setIsLoading(true);
    try {
      const { user } = await verifyOtp(phone.trim(), otp.trim());
      navigation.replace('Dashboard', { user });
    } catch (e: any) {
      setError(e.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (m: LoginMode) => {
    setMode(m);
    setOtpStep('phone');
    setError('');
    setDevOtp(null);
  };

  // ── Loading splash ────────────────────────────────────────────────────
  if (checkingSession) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashIcon}>📡</Text>
        <ActivityIndicator color="#3F51B5" size="large" style={{ marginTop: 16 }} />
        <Text style={styles.splashText}>Checking session...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>📡</Text>
          </View>
          <Text style={styles.appTitle}>WiFi Track</Text>
          <Text style={styles.appSubtitle}>Attendance Monitoring System</Text>
        </View>

        {/* ── Mode tabs ── */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, mode === 'password' && styles.tabActive]}
            onPress={() => switchMode('password')}
          >
            <Text style={[styles.tabText, mode === 'password' && styles.tabTextActive]}>
              🔑 Password
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'otp' && styles.tabActive]}
            onPress={() => switchMode('otp')}
          >
            <Text style={[styles.tabText, mode === 'otp' && styles.tabTextActive]}>
              📱 OTP
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Form card ── */}
        <View style={styles.formContainer}>
          {/* ── PASSWORD MODE ── */}
          {mode === 'password' && (
            <>
              <Text style={styles.formTitle}>Sign In</Text>
              <Text style={styles.formSubtitle}>Enter your email and password</Text>

              <TextInput
                label="Email Address"
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                left={<TextInput.Icon icon="email-outline" />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                disabled={isLoading}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                mode="outlined"
                secureTextEntry={!showPw}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPw ? 'eye-off' : 'eye'}
                    onPress={() => setShowPw(v => !v)}
                  />
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
                disabled={isLoading}
              />

              {error ? <HelperText type="error" visible>{error}</HelperText> : null}

              <Button
                mode="contained"
                onPress={handlePasswordLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                buttonColor="#3F51B5"
                labelStyle={styles.loginButtonLabel}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </>
          )}

          {/* ── OTP MODE — step 1: enter phone ── */}
          {mode === 'otp' && otpStep === 'phone' && (
            <>
              <Text style={styles.formTitle}>Sign In with OTP</Text>
              <Text style={styles.formSubtitle}>Enter your registered phone number</Text>

              <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={t => { setPhone(t); setError(''); }}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={10}
                left={<TextInput.Icon icon="phone" />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                disabled={isLoading}
                placeholder="10-digit number"
              />

              {error ? <HelperText type="error" visible>{error}</HelperText> : null}

              <Button
                mode="contained"
                onPress={handleRequestOtp}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                buttonColor="#3F51B5"
                labelStyle={styles.loginButtonLabel}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </>
          )}

          {/* ── OTP MODE — step 2: enter OTP ── */}
          {mode === 'otp' && otpStep === 'verify' && (
            <>
              <Text style={styles.formTitle}>Enter OTP</Text>
              <Text style={styles.formSubtitle}>
                OTP sent to {phone}
              </Text>

              {/* Dev-mode OTP hint */}
              {devOtp && (
                <View style={styles.devOtpBox}>
                  <Text style={styles.devOtpLabel}>🔧 Dev OTP:</Text>
                  <Text style={styles.devOtpValue}>{devOtp}</Text>
                </View>
              )}

              <TextInput
                label="6-digit OTP"
                value={otp}
                onChangeText={t => { setOtp(t); setError(''); }}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={6}
                left={<TextInput.Icon icon="shield-check" />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                disabled={isLoading}
              />

              {error ? <HelperText type="error" visible>{error}</HelperText> : null}

              <Button
                mode="contained"
                onPress={handleVerifyOtp}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                buttonColor="#3F51B5"
                labelStyle={styles.loginButtonLabel}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              {/* Resend / change number */}
              <View style={styles.otpActions}>
                <TouchableOpacity
                  onPress={handleRequestOtp}
                  disabled={otpCountdown > 0 || isLoading}
                >
                  <Text style={[
                    styles.resendText,
                    (otpCountdown > 0 || isLoading) && { opacity: 0.4 },
                  ]}>
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setOtpStep('phone'); setOtp(''); setError(''); }}>
                  <Text style={styles.changeText}>Change Number</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* ── Demo credentials ── */}
        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Demo Credentials (API)</Text>
          <View style={styles.demoCards}>
            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => {
                setMode('password');
                setEmail('admin@company.com');
                setPassword('Admin@123');
                setError('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.demoRole}>👔 ADMIN</Text>
              <Text style={styles.demoEmail}>admin@company.com</Text>
              <Text style={styles.demoPass}>Admin@123</Text>
              <Text style={styles.demoPhone}>📱 9000000001</Text>
              <Text style={styles.demoHint}>Tap to fill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => {
                setMode('password');
                setEmail('alice@company.com');
                setPassword('Pass@123');
                setError('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.demoRole}>👤 EMPLOYEE</Text>
              <Text style={styles.demoEmail}>alice@company.com</Text>
              <Text style={styles.demoPass}>Pass@123</Text>
              <Text style={styles.demoPhone}>📱 9000000002</Text>
              <Text style={styles.demoHint}>Tap to fill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F2FF' },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2FF' },
  splashIcon: { fontSize: 56 },
  splashText: { color: '#6B7280', marginTop: 12, fontSize: 14 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  header: {
    alignItems: 'center', paddingTop: 56, paddingBottom: 28,
    backgroundColor: '#3F51B5',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  logoContainer: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  logoIcon: { fontSize: 36 },
  appTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  appSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16,
    backgroundColor: '#E8EAF6', borderRadius: 10, padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#3F51B5' },
  tabText: { color: '#6B7280', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#FFFFFF' },
  formContainer: {
    margin: 20, marginTop: 12, padding: 22,
    backgroundColor: '#FFFFFF', borderRadius: 16, elevation: 3,
  },
  formTitle: { fontWeight: '800', color: '#1A1A2E', fontSize: 17, marginBottom: 4 },
  formSubtitle: { color: '#6B7280', fontSize: 12, marginBottom: 16 },
  input: { backgroundColor: '#FFFFFF', marginBottom: 8 },
  inputOutline: { borderRadius: 8 },
  loginButton: { marginTop: 4, borderRadius: 8 },
  loginButtonContent: { paddingVertical: 6 },
  loginButtonLabel: { fontSize: 15, fontWeight: '700' },
  devOtpBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF9C4', borderRadius: 8, padding: 10, marginBottom: 10,
  },
  devOtpLabel: { color: '#F57F17', fontWeight: '700', fontSize: 12 },
  devOtpValue: { color: '#1A1A2E', fontWeight: '900', fontSize: 20, letterSpacing: 4 },
  otpActions: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 14,
  },
  resendText: { color: '#3F51B5', fontWeight: '600', fontSize: 13 },
  changeText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  demoContainer: { marginHorizontal: 20 },
  demoTitle: {
    color: '#6B7280', fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
    textAlign: 'center', marginBottom: 10,
  },
  demoCards: { flexDirection: 'row', gap: 10 },
  demoCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    elevation: 1, borderWidth: 1, borderColor: '#E8EAF6',
  },
  demoRole: { fontSize: 11, fontWeight: '700', color: '#3F51B5', marginBottom: 4 },
  demoEmail: { fontSize: 10, color: '#374151', fontFamily: 'monospace' },
  demoPass: { fontSize: 10, color: '#374151', fontFamily: 'monospace', marginBottom: 2 },
  demoPhone: { fontSize: 10, color: '#5C6BC0', marginBottom: 4 },
  demoHint: { fontSize: 9, color: '#9CA3AF', fontStyle: 'italic' },
});
