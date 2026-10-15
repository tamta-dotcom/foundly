import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import ListingCard from '../../components/ListingCard';
import LoadingView from '../../components/LoadingView';
import {
  getListingsPage,
  LISTINGS_PAGE_SIZE,
  subscribeToListings,
} from '../../services/listings';

const FILTERS = [
  { label: 'Everything', value: 'all' },
  { label: 'Lost items', value: 'lost' },
  { label: 'Found items', value: 'found' },
];

export default function ExploreScreen() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // null means the full-collection search/filter subscription is not ready.
  const [liveItems, setLiveItems] = useState(null);

  const lastDocumentRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const requestVersionRef = useRef(0);

  const isSearchingOrFiltering =
    debouncedSearch.trim().length > 0 || filter !== 'all';

  // Debounce text input so rapid typing doesn't repeatedly filter the list
  // or repeatedly change the live query mode.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const loadFirstPage = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;

    setLoading(true);
    setHasMore(false);
    lastDocumentRef.current = null;

    try {
      const page = await getListingsPage({
        pageSize: LISTINGS_PAGE_SIZE,
      });

      if (requestVersion !== requestVersionRef.current) return;

      setItems(page.items);
      lastDocumentRef.current = page.lastDocument;
      setHasMore(page.hasMore);
    } catch (error) {
      if (requestVersion !== requestVersionRef.current) return;

      console.error('Failed to load listings:', error);
      Alert.alert(
        'Something went wrong',
        'We could not load listings. Please try again.'
      );
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // When searching or filtering, preserve the original behavior:
  // search/filter across the complete live listings collection.
  useEffect(() => {
    if (!isSearchingOrFiltering) {
      setLiveItems(null);
      return undefined;
    }

    let active = true;
    setLiveItems(null);

    const unsubscribe = subscribeToListings(
      (data) => {
        if (active) {
          setLiveItems(Array.isArray(data) ? data : []);
        }
      },
      (error) => {
        if (!active) return;

        console.error('Failed to search listings:', error);
        Alert.alert(
          'Something went wrong',
          'We could not load listings. Please try again.'
        );
        setLiveItems([]);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isSearchingOrFiltering]);

  const loadMore = useCallback(async () => {
    if (
      isSearchingOrFiltering ||
      loading ||
      loadingMoreRef.current ||
      !hasMore ||
      !lastDocumentRef.current
    ) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const requestVersion = requestVersionRef.current;

    try {
      const page = await getListingsPage({
        pageSize: LISTINGS_PAGE_SIZE,
        lastDocument: lastDocumentRef.current,
      });

      // Ignore results if a refresh has started while this request was pending.
      if (refreshing) return;

      setItems((previous) => {
        const existingIds = new Set(previous.map((item) => item.id));
        const newItems = page.items.filter(
          (item) => !existingIds.has(item.id)
        );

        return [...previous, ...newItems];
      });

      lastDocumentRef.current = page.lastDocument;
      setHasMore(page.hasMore);
    } catch (error) {
      console.error('Failed to load more listings:', error);
      Alert.alert(
        'Could not load more',
        'Please try again in a moment.'
      );
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, isSearchingOrFiltering, loading, refreshing]);

  const refreshListings = useCallback(() => {
    // Invalidate any older page request and start again from page one.
    requestVersionRef.current += 1;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setRefreshing(true);
    loadFirstPage();
  }, [loadFirstPage]);

  const sourceItems = isSearchingOrFiltering
    ? (liveItems || [])
    : items;

  const filteredItems = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();

    return sourceItems.filter((item) => {
      const searchableText = [
        item.title,
        item.description,
        item.location,
        item.category,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        !term || searchableText.some((value) => value.includes(term));

      const matchesFilter = filter === 'all' || item.type === filter;
      const isVisible = item.status !== 'deleted';

      return matchesSearch && matchesFilter && isVisible;
    });
  }, [sourceItems, debouncedSearch, filter]);

  const openPostScreen = useCallback(() => {
    router.push('/(tabs)/post');
  }, [router]);

  const openListing = useCallback(
    (id) => {
      router.push({
        pathname: '/item/[id]',
        params: { id },
      });
    },
    [router]
  );

  const renderListing = useCallback(
    ({ item }) => (
      <ListingCard
        item={item}
        onPress={() => openListing(item.id)}
      />
    ),
    [openListing]
  );

  const header = (
    <View>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="search" size={23} color="#FFFFFF" />
          </View>

          <View>
            <Text style={styles.brandName}>foundly</Text>
            <Text style={styles.brandTagline}>
              A little help goes a long way
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.topAction}
          onPress={openPostScreen}
          accessibilityRole="button"
          accessibilityLabel="Post an item"
        >
          <Ionicons name="add" size={25} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroDecoration} />

        <View style={styles.heroBadge}>
          <Ionicons name="heart" size={12} color="#DCE8FF" />
          <Text style={styles.heroBadgeText}>COMMUNITY POWERED</Text>
        </View>

        <Text style={styles.heroTitle}>
          Lost something?{'\n'}
          <Text style={styles.heroTitleAccent}>
            Let's bring it home.
          </Text>
        </Text>

        <Text style={styles.heroDescription}>
          Every item has a story. Help someone reconnect with theirs.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.heroButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={openPostScreen}
          accessibilityRole="button"
        >
          <Ionicons
            name="add-circle-outline"
            size={19}
            color="#1D4ED8"
          />
          <Text style={styles.heroButtonText}>Post an item</Text>
          <Ionicons
            name="arrow-forward"
            size={17}
            color="#1D4ED8"
          />
        </Pressable>

        <View style={styles.heroIcon}>
          <Ionicons name="location" size={30} color="#DCE8FF" />
        </View>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.sectionEyebrow}>YOUR COMMUNITY</Text>
        <Text style={styles.pageTitle}>Find something?</Text>
        <Text style={styles.pageSubtitle}>
          Search nearby lost and found items.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={21}
            color="#94A3B8"
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Try keys, wallet, location..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search listings"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#94A3B8"
              />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((option) => {
          const selected = filter === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => setFilter(option.value)}
              style={[
                styles.filterChip,
                selected && styles.filterChipSelected,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              {option.value === 'lost' && (
                <Ionicons
                  name="help-circle-outline"
                  size={16}
                  color={selected ? '#FFFFFF' : '#64748B'}
                />
              )}

              {option.value === 'found' && (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={selected ? '#FFFFFF' : '#64748B'}
                />
              )}

              <Text
                style={[
                  styles.filterText,
                  selected && styles.filterTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.listingHeader}>
        <View>
          <Text style={styles.listingTitle}>Recent listings</Text>
          <Text style={styles.listingSubtitle}>
            {search.trim() || filter !== 'all'
              ? 'Results matching your search'
              : 'A little kindness can make someone’s day'}
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {isSearchingOrFiltering && liveItems === null
              ? '…'
              : filteredItems.length}
          </Text>
        </View>
      </View>
    </View>
  );

  const emptyState = (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="file-tray-outline"
          size={32}
          color="#64748B"
        />
      </View>
      <Text style={styles.emptyTitle}>Nothing here just yet</Text>
      <Text style={styles.emptyDescription}>
        Try a different search or be the first to post an item.
      </Text>
      <Pressable
        style={styles.emptyButton}
        onPress={openPostScreen}
        accessibilityRole="button"
      >
        <Text style={styles.emptyButtonText}>Post an item</Text>
      </Pressable>
    </View>
  );

  const footer = isSearchingOrFiltering ? null : (
    <View style={styles.listFooter}>
      {loadingMore && <ActivityIndicator color="#2563EB" />}

      {!loadingMore && hasMore && (
        <Pressable
          style={styles.loadMoreButton}
          onPress={loadMore}
          accessibilityRole="button"
        >
          <Text style={styles.loadMoreText}>Load more listings</Text>
        </Pressable>
      )}

      {!hasMore && items.length > 0 && (
        <Text style={styles.endOfList}>You're all caught up.</Text>
      )}
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LoadingView message="Finding items..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderListing}
          ListHeaderComponent={header}
          ListEmptyComponent={
            isSearchingOrFiltering && liveItems === null ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator color="#2563EB" />
                <Text style={styles.searchLoadingText}>
                  Searching listings...
                </Text>
              </View>
            ) : emptyState
          }
          ListFooterComponent={footer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshListings}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    flexGrow: 1,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 22,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  brandName: {
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.8,
    color: '#0F172A',
  },
  brandTagline: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  topAction: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    backgroundColor: '#1D4ED8',
    borderRadius: 25,
    padding: 22,
    paddingBottom: 21,
    marginBottom: 29,
    overflow: 'hidden',
  },
  heroDecoration: {
    position: 'absolute',
    width: 185,
    height: 185,
    borderRadius: 93,
    backgroundColor: '#3B82F6',
    opacity: 0.28,
    right: -75,
    top: -75,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 17,
    gap: 6,
  },
  heroBadgeText: {
    color: '#E5EDFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.7,
    color: '#FFFFFF',
  },
  heroTitleAccent: {
    color: '#C7D9FF',
  },
  heroDescription: {
    color: '#DBEAFE',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 11,
    maxWidth: '88%',
  },
  heroButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
    gap: 9,
  },
  heroButtonText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '800',
  },
  heroIcon: {
    position: 'absolute',
    right: 21,
    bottom: 25,
    width: 53,
    height: 53,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '10deg' }],
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  searchSection: {
    marginBottom: 17,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
    color: '#2563EB',
    marginBottom: 7,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    marginTop: 5,
    marginBottom: 17,
  },
  searchBox: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 15,
    gap: 11,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    paddingVertical: 13,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 27,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },

  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  listingTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  listingSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 5,
  },
  countBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#E8EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 13,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 30,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: '#E8EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 260,
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 18,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  listFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8EEFF',
  },
  loadMoreText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 13,
  },
  endOfList: {
    fontSize: 12,
    color: '#94A3B8',
  },
  searchLoading: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
  },
  searchLoadingText: {
    color: '#64748B',
    fontSize: 13,
  },
});