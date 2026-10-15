
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAuth } from '../../contexts/AuthContext';
import {
  getListing,
  toggleSavedListing,
  markListingResolved,
} from '../../services/listings';
import { startConversation } from '../../services/messages';

const BLUE = '#2563EB';
const DARK = '#0F172A';
const MUTED = '#64748B';
const BG = '#F8FAFC';
const BORDER = '#E2E8F0';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadListing() {
      setLoading(true);
      try {
        const listingId = Array.isArray(id) ? id[0] : id;
        if (!listingId) {
          if (active) setItem(null);
          return;
        }
        const result = await getListing(String(listingId));
        if (active) setItem(result || null);
      } catch (error) {
        if (active) {
          Alert.alert('Unable to load listing', 'Please try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadListing();
    return () => {
      active = false;
    };
  }, [id]);

  async function saveItem() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!item || busy) return;

    try {
      setBusy(true);
      const savedBy = item.savedBy || [];
      const alreadySaved = savedBy.includes(user.uid);

      await toggleSavedListing(item, user.uid);

      setItem({
        ...item,
        savedBy: alreadySaved
          ? savedBy.filter((uid) => uid !== user.uid)
          : [...savedBy, user.uid],
      });
    } catch (error) {
      Alert.alert(
        'Could not save listing',
        error?.message || 'Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

const contactOwner = async () => {
  try {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to message the owner.');
      router.push('/login');
      return;
    }

    if (!item?.ownerId) {
      Alert.alert('Error', 'Owner information is missing.');
      return;
    }

    if (user.uid === item.ownerId) {
      Alert.alert('Your listing', 'You cannot message yourself.');
      return;
    }

    const conversationId = await startConversation({
      currentUser: user,
      otherUserId: item.ownerId,
      listingId: String(item.id || (Array.isArray(id) ? id[0] : id)),
      listingTitle: item.title || 'Foundly listing',
    });

    router.push({
      pathname: '/(tabs)/message',
      params: {
        conversationId,
        listingId: String(item.id || (Array.isArray(id) ? id[0] : id)),
        ownerId: item.ownerId,
      },
    });
  } catch (error) {
    Alert.alert(
      'Could not open chat',
      error?.message || 'Please try again.'
    );
  }
};


  function resolveItem() {
    if (!item || busy) return;

    Alert.alert(
      'Mark as resolved?',
      'This will let the community know this listing has been resolved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark resolved',
          onPress: async () => {
            try {
              setBusy(true);
              await markListingResolved(item.id);
              setItem((current) =>
                current ? { ...current, status: 'resolved' } : current
              );
              Alert.alert('Listing updated', 'Your listing is now resolved.');
            } catch (error) {
              Alert.alert(
                'Could not update listing',
                error?.message || 'Please try again.'
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Loading listing...</Text>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <Ionicons name="search-outline" size={48} color={BLUE} />
        <Text style={styles.emptyTitle}>Listing not found</Text>
        <Text style={styles.muted}>This listing may have been removed.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isOwner = user?.uid === item.ownerId;
  const isSaved = !!user && (item.savedBy || []).includes(user.uid);
  const isResolved = item.status === 'resolved';
  const isLost = item.type === 'lost';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listing details</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={saveItem}
          disabled={busy}
          accessibilityLabel={isSaved ? 'Unsave listing' : 'Save listing'}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={22}
            color={isSaved ? '#E11D48' : DARK}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoBox}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noPhoto}>
              <Ionicons name="image-outline" size={44} color="#94A3B8" />
              <Text style={styles.muted}>No photo available</Text>
            </View>
          )}
          <View style={[styles.typeBadge, isLost ? styles.lostBadge : styles.foundBadge]}>
            <Text style={styles.typeBadgeText}>
              {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
            </Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={[styles.status, isResolved && styles.resolvedStatus]}>
            {isResolved ? '✓ Resolved' : '● Active listing'}
          </Text>
          <Text style={styles.title}>{item.title || 'Untitled listing'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={BLUE} />
            <Text style={styles.locationText}>
              {item.location || 'Location not specified'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.bodyText}>
            {item.description || 'No description has been added.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{item.category || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.ownerCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={24} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.muted}>Posted by</Text>
            <Text style={styles.ownerName}>{item.ownerName || 'Community member'}</Text>
            <Text style={styles.muted}>{isOwner ? 'This is your listing' : 'Foundly community member'}</Text>
          </View>
          {isOwner && <Text style={styles.youBadge}>You</Text>}
        </View>

        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#0F766E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Stay safe</Text>
            <Text style={styles.safetyText}>
              Arrange handovers in a public place and avoid sharing sensitive
              personal information.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        {!isOwner && !isResolved ? (
          <>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveItem}
              disabled={busy}
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={20}
                color={isSaved ? '#E11D48' : BLUE}
              />
              <Text style={styles.saveButtonText}>{isSaved ? 'Saved' : 'Save'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.messageButton, busy && styles.disabledButton]}
              onPress={contactOwner}
              disabled={busy}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Message owner"
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.messageButtonText}>Message Owner</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : isOwner && !isResolved ? (
          <TouchableOpacity
            style={[styles.resolveButton, busy && styles.disabledButton]}
            onPress={resolveItem}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
                <Text style={styles.messageButtonText}>Mark as resolved</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.closedNotice}>
            <Ionicons name="checkmark-circle" size={20} color="#047857" />
            <Text style={styles.closedText}>
              {isResolved ? 'This listing has been resolved' : 'This is your listing'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  center: {
    flex: 1, backgroundColor: BG, alignItems: 'center',
    justifyContent: 'center', padding: 24,
  },
  loadingText: { marginTop: 14, color: MUTED, fontSize: 14 },
  emptyTitle: { color: DARK, fontSize: 22, fontWeight: '900', marginTop: 16 },
  muted: { color: MUTED, fontSize: 13, lineHeight: 20 },
  header: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: { color: DARK, fontSize: 17, fontWeight: '800' },
  iconButton: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
  photoBox: {
    height: 260, borderRadius: 22, overflow: 'hidden',
    backgroundColor: '#E2E8F0', position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  noPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  typeBadge: {
    position: 'absolute', top: 14, left: 14,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  lostBadge: { backgroundColor: '#FEF3C7' },
  foundBadge: { backgroundColor: '#D1FAE5' },
  typeBadgeText: { color: DARK, fontSize: 11, fontWeight: '900' },
  titleSection: { paddingVertical: 20 },
  status: {
    alignSelf: 'flex-start', backgroundColor: '#DCFCE7', color: '#166534',
    overflow: 'hidden', borderRadius: 9, paddingHorizontal: 10,
    paddingVertical: 6, fontSize: 12, fontWeight: '800',
  },
  resolvedStatus: { backgroundColor: '#E2E8F0', color: '#475569' },
  title: { color: DARK, fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 13 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  locationText: { color: MUTED, fontSize: 14, flex: 1 },
  section: { paddingVertical: 17, borderTopWidth: 1, borderTopColor: BORDER },
  sectionTitle: { color: DARK, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  bodyText: { color: '#475569', fontSize: 15, lineHeight: 24 },
  categoryChip: {
    alignSelf: 'flex-start', backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE', borderWidth: 1, paddingHorizontal: 13,
    paddingVertical: 8, borderRadius: 11,
  },
  categoryText: { color: '#1D4ED8', fontSize: 13, fontWeight: '800' },
  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15,
    marginTop: 18, borderRadius: 18, borderWidth: 1,
    borderColor: BORDER, backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 50, height: 50, borderRadius: 17, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  ownerName: { color: DARK, fontSize: 15, fontWeight: '900', marginVertical: 3 },
  youBadge: {
    color: '#1D4ED8', backgroundColor: '#DBEAFE', overflow: 'hidden',
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, fontWeight: '800',
  },
  safetyCard: {
    flexDirection: 'row', gap: 11, padding: 15, marginTop: 16,
    backgroundColor: '#ECFDF5', borderColor: '#A7F3D0',
    borderWidth: 1, borderRadius: 16,
  },
  safetyTitle: { color: '#065F46', fontSize: 14, fontWeight: '900' },
  safetyText: { color: '#047857', fontSize: 12, lineHeight: 19, marginTop: 5 },
  bottomActions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 10, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  saveButton: {
    minWidth: 95, height: 52, borderRadius: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 7,
    borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF',
  },
  saveButtonText: { color: BLUE, fontWeight: '900', fontSize: 14 },
  messageButton: {
    flex: 1, height: 52, borderRadius: 15, backgroundColor: BLUE,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    paddingHorizontal: 10,
  },
  messageButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  resolveButton: {
    flex: 1, height: 52, borderRadius: 15, backgroundColor: '#0F766E',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
  },
  disabledButton: { opacity: 0.65 },
  closedNotice: {
    flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: '#F1F5F9',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
  },
  closedText: { color: '#475569', fontSize: 13, fontWeight: '800' },
  primaryButton: {
    marginTop: 22, backgroundColor: BLUE, paddingHorizontal: 24,
    paddingVertical: 13, borderRadius: 13,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
});
