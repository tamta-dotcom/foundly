import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/auth';

const BLUE = '#2563EB';
const DARK = '#0F172A';
const MUTED = '#64748B';
const BACKGROUND = '#F8FAFC';
const BORDER = '#E2E8F0';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = user?.displayName || 'Foundly member';
  const email = user?.email || 'Not signed in';

  const initial = (
    user?.displayName ||
    user?.email ||
    'F'
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  async function logout() {
    if (loggingOut) return;

    Alert.alert(
      'Sign out?',
      'Are you sure you want to sign out of Foundly?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);
              await logoutUser();
              router.replace('/login');
            } catch (error) {
              Alert.alert(
                'Sign out failed',
                error?.message || 'Please try again.'
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  }

  function openLogin() {
    router.push('/login');
  }

  function openSaved() {
    router.push('/(tabs)/saved');
  }

  function openMessages() {
    router.push('/(tabs)/message');
  }

  function openHome() {
    router.push('/(tabs)');
  }

  function openPost() {
    router.push('/(tabs)/post');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Page heading */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
            <Text style={styles.pageTitle}>Profile</Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="person-outline" size={25} color={BLUE} />
          </View>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name} numberOfLines={2}>
                {displayName}
              </Text>

              <Text style={styles.email} numberOfLines={2}>
                {email}
              </Text>

              <View
                style={[
                  styles.accountBadge,
                  user ? styles.signedInBadge : styles.guestBadge,
                ]}
              >
                <View
                  style={[
                    styles.accountDot,
                    user ? styles.signedInDot : styles.guestDot,
                  ]}
                />
                <Text
                  style={[
                    styles.accountBadgeText,
                    user ? styles.signedInText : styles.guestText,
                  ]}
                >
                  {user ? 'Signed in' : 'Guest account'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.profileDivider} />

          <Text style={styles.profileDescription}>
            {user
              ? 'You are part of the Foundly community. Help reunite people with the things they have lost.'
              : 'Sign in to save listings, contact owners, and take part in the Foundly community.'}
          </Text>

          {!user && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={openLogin}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Sign in to Foundly</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <Text style={styles.sectionSubtitle}>Your Foundly shortcuts</Text>
        </View>

        <View style={styles.actionsCard}>
          <ActionRow
            icon="search-outline"
            title="Explore listings"
            subtitle="Browse lost and found items"
            onPress={openHome}
          />

          <View style={styles.rowDivider} />

          <ActionRow
            icon="heart-outline"
            title="Saved listings"
            subtitle="Items you want to revisit"
            onPress={openSaved}
          />

          <View style={styles.rowDivider} />

          <ActionRow
            icon="chatbubbles-outline"
            title="Messages"
            subtitle="Conversations with the community"
            onPress={openMessages}
          />

          <View style={styles.rowDivider} />

          <ActionRow
            icon="add-circle-outline"
            title="Post a listing"
            subtitle="Report something lost or found"
            onPress={openPost}
          />
        </View>

        {/* Safety card */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={23}
              color="#047857"
            />
          </View>

          <View style={styles.safetyInfo}>
            <Text style={styles.safetyTitle}>Your safety matters</Text>
            <Text style={styles.safetyDescription}>
              Arrange item handovers in a public place. Never share passwords,
              verification codes, or sensitive personal information in chat.
            </Text>
          </View>
        </View>

        {/* Account actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account</Text>
        </View>

        <View style={styles.actionsCard}>
          <ActionRow
            icon="person-circle-outline"
            title={user ? 'Switch account' : 'Sign in'}
            subtitle={
              user
                ? 'Use another Foundly account'
                : 'Access your saved items and messages'
            }
            onPress={openLogin}
          />

          {user && (
            <>
              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.logoutRow}
                onPress={logout}
                disabled={loggingOut}
                activeOpacity={0.75}
              >
                <View style={styles.logoutIcon}>
                  <Ionicons name="log-out-outline" size={21} color="#DC2626" />
                </View>

                <View style={styles.actionInfo}>
                  <Text style={styles.logoutTitle}>
                    {loggingOut ? 'Signing out...' : 'Sign out'}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    Sign out of your current account
                  </Text>
                </View>

                {loggingOut ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color="#94A3B8"
                  />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Ionicons name="heart" size={15} color={BLUE} />
            <Text style={styles.footerBrand}>Foundly</Text>
          </View>

          <Text style={styles.footerText}>
            Bringing lost things back to their people.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionRow({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.actionRow}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={BLUE} />
      </View>

      <View style={styles.actionInfo}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={19} color="#94A3B8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 35,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  eyebrow: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  pageTitle: {
    color: DARK,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    padding: 19,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: '#DBEAFE',
    borderWidth: 3,
    borderColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#1D4ED8',
    fontSize: 31,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: DARK,
    fontSize: 19,
    fontWeight: '900',
  },
  email: {
    color: MUTED,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },
  accountBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    marginTop: 10,
  },
  signedInBadge: {
    backgroundColor: '#DCFCE7',
  },
  guestBadge: {
    backgroundColor: '#F1F5F9',
  },
  accountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  signedInDot: {
    backgroundColor: '#16A34A',
  },
  guestDot: {
    backgroundColor: '#64748B',
  },
  accountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  signedInText: {
    color: '#166534',
  },
  guestText: {
    color: '#475569',
  },
  profileDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 17,
  },
  profileDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginTop: 17,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 27,
    marginBottom: 13,
  },
  sectionTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 5,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    paddingHorizontal: 13,
  },
  actionRow: {
    minHeight: 77,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '800',
  },
  actionSubtitle: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 56,
  },
  safetyCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 19,
    padding: 15,
    marginTop: 22,
  },
  safetyIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyInfo: {
    flex: 1,
  },
  safetyTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '900',
  },
  safetyDescription: {
    color: '#047857',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  logoutRow: {
    minHeight: 77,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  logoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTitle: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '900',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerBrand: {
    color: DARK,
    fontSize: 14,
    fontWeight: '900',
  },
  footerText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 7,
  },
});
