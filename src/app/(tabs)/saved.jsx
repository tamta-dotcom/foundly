
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '../../contexts/AuthContext';
import { subscribeToListings } from '../../services/listings';
import ListingCard from '../../components/ListingCard';
import LoadingView from '../../components/LoadingView';

const BLUE = '#2563EB';
const DARK = '#0F172A';
const MUTED = '#64748B';
const BACKGROUND = '#F8FAFC';

export default function SavedScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToListings(
      (data) => {
        setItems(
          data.filter((item) => item.savedBy?.includes(user.uid))
        );
        setLoading(false);
      },
      (error) => {
        console.error('Saved listings error:', error);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  function openListing(item) {
    router.push({
      pathname: '/item/[id]',
      params: { id: item.id },
    });
  }

  function goHome() {
    router.push('/(tabs)');
  }

  function goToLogin() {
    router.push('/login');
  }

  if (loading) {
    return <LoadingView />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      {!user ? (
        <View style={styles.guestContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
              <Text style={styles.pageTitle}>Saved listings</Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons name="heart-outline" size={25} color={BLUE} />
            </View>
          </View>

          <View style={styles.guestCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="lock-closed-outline" size={34} color={BLUE} />
            </View>

            <Text style={styles.emptyTitle}>Your saved items await</Text>

            <Text style={styles.emptyDescription}>
              Sign in to keep track of lost and found items you want to revisit.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={goToLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Sign in to Foundly</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.textButton}
              onPress={goHome}
              activeOpacity={0.75}
            >
              <Text style={styles.textButtonText}>Explore listings instead</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listingWrapper}>
              <ListingCard
                item={item}
                onPress={() => openListing(item)}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.emptyListContent,
          ]}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <View style={styles.header}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
                  <Text style={styles.pageTitle}>Saved listings</Text>
                  <Text style={styles.subtitle}>
                    Keep the important finds close.
                  </Text>
                </View>

                <View style={styles.headerIcon}>
                  <Ionicons name="heart" size={25} color={BLUE} />
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="bookmark" size={23} color="#FFFFFF" />
                </View>

                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Your saved items</Text>
                  <Text style={styles.summaryCaption}>
                    {items.length === 1
                      ? 'One listing kept for later'
                      : 'Listings you want to revisit'}
                  </Text>
                </View>

                <Text style={styles.summaryCount}>{items.length}</Text>
              </View>

              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Your collection</Text>
                <Text style={styles.sectionCount}>
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={35} color={BLUE} />
              </View>

              <Text style={styles.emptyTitle}>Nothing saved yet</Text>

              <Text style={styles.emptyDescription}>
                When you find a listing you want to revisit, tap the heart
                icon to save it here.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={goHome}
                activeOpacity={0.85}
              >
                <Ionicons name="search-outline" size={19} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Explore listings</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  guestContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 30,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  headerSection: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
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
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    marginTop: 7,
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    backgroundColor: BLUE,
    borderRadius: 22,
    marginBottom: 27,
  },
  summaryIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    marginLeft: 13,
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  summaryCaption: {
    color: '#DBEAFE',
    fontSize: 12,
    marginTop: 5,
  },
  summaryCount: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    marginLeft: 8,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionCount: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
  },
  listingWrapper: {
    marginBottom: 14,
  },
  emptyCard: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    paddingHorizontal: 25,
    paddingVertical: 30,
    marginTop: 6,
  },
  guestCard: {
    flex: 1,
    maxHeight: 410,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    padding: 25,
    marginTop: 25,
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },
  emptyTitle: {
    color: DARK,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyDescription: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 22,
    maxWidth: 310,
  },
  primaryButton: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: BLUE,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  textButton: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  textButtonText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '800',
  },
});
