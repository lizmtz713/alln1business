import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/providers/AuthProvider';
import { useTheme } from '../src/providers/ThemeProvider';
import { useToast } from '../src/components/ui';
import { hapticLight } from '../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../src/lib/constants';

const NOTIFICATIONS_KEY = 'alln1_notifications_enabled';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme, resolvedScheme } = useTheme();
  const toast = useToast();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [businessName, setBusinessName] = useState(profile?.business_name ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setBusinessName(profile?.business_name ?? '');
  }, [profile?.full_name, profile?.business_name]);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then((v) => {
      setNotificationsEnabled(v !== 'false');
    });
  }, []);

  const handleSaveProfile = async () => {
    hapticLight();
    setProfileSaving(true);
    const { error } = await updateProfile({
      full_name: fullName.trim() || null,
      business_name: businessName.trim() || null,
    });
    setProfileSaving(false);
    if (error) {
      toast.show(error, 'error');
      return;
    }
    toast.show('Profile updated', 'success');
  };

  const handleNotificationsToggle = async (value: boolean) => {
    hapticLight();
    setNotificationsEnabled(value);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, value ? 'true' : 'false');
    toast.show(value ? 'Notifications enabled' : 'Notifications disabled', 'info');
  };

  const handleTheme = async (mode: 'light' | 'dark' | 'system') => {
    hapticLight();
    await setTheme(mode);
    toast.show(`Theme: ${mode === 'system' ? 'System' : mode}`, 'info');
  };

  const handleSignOut = async () => {
    hapticLight();
    await signOut();
    router.replace('/');
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const bg = resolvedScheme === 'dark' ? '#0F172A' : '#F8FAFC';
  const cardBg = resolvedScheme === 'dark' ? '#1E293B' : '#FFFFFF';
  const text = resolvedScheme === 'dark' ? '#F8FAFC' : '#0F172A';
  const muted = resolvedScheme === 'dark' ? '#94A3B8' : '#64748B';

  return (
    <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: muted, fontSize: 14, marginBottom: 8 }}>Profile</Text>
          <View style={{ backgroundColor: cardBg, borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: muted, fontSize: 12, marginBottom: 4 }}>Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={muted}
              style={{ color: text, fontSize: 16, paddingVertical: 8, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: resolvedScheme === 'dark' ? '#334155' : '#E2E8F0' }}
            />
            <Text style={{ color: muted, fontSize: 12, marginBottom: 4 }}>Household name</Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Household name"
              placeholderTextColor={muted}
              style={{ color: text, fontSize: 16, paddingVertical: 8, marginBottom: 16 }}
            />
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={profileSaving}
              style={{ backgroundColor: '#3B82F6', borderRadius: 10, padding: 14, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignItems: 'center' }}
            >
              {profileSaving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save profile</Text>}
            </TouchableOpacity>
          </View>

          <Text style={{ color: muted, fontSize: 14, marginBottom: 8 }}>Preferences</Text>
          <View style={{ backgroundColor: cardBg, borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: text, fontSize: 16 }}>Notifications</Text>
              <Switch value={notificationsEnabled} onValueChange={handleNotificationsToggle} trackColor={{ false: '#334155', true: '#3B82F6' }} thumbColor="#fff" />
            </View>
            <Text style={{ color: muted, fontSize: 14, marginBottom: 8 }}>Theme</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => handleTheme(mode)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: theme === mode ? '#3B82F6' : resolvedScheme === 'dark' ? '#334155' : '#E2E8F0',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: theme === mode ? '#fff' : text, fontWeight: '500', fontSize: 14 }}>
                    {mode === 'system' ? 'System' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            style={{ backgroundColor: resolvedScheme === 'dark' ? '#1E293B' : '#F1F5F9', borderRadius: 12, padding: 16, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
          >
            <Text style={{ color: '#EF4444', fontWeight: '600', textAlign: 'center' }}>Sign out</Text>
          </TouchableOpacity>

          <Text style={{ color: muted, fontSize: 12, marginTop: 24, textAlign: 'center' }}>Alln1Home v{appVersion}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}
