
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ListingCard({ item, onPress }) {
  const isLost = item.type === 'lost';
  const isResolved = item.status === 'resolved';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isLost ? 'Lost' : 'Found'} item: ${item.title || 'Untitled'}`}
    >
      {/* Item photo */}
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name="image-outline"
              size={31}
              color="#94A3B8"
            />
            <Text style={styles.placeholderText}>No photo</Text>
          </View>
        )}

        <View
          style={[
            styles.typeBadge,
            isLost ? styles.lostBadge : styles.foundBadge,
          ]}
        >
          <Ionicons
            name={isLost ? 'search-outline' : 'checkmark-circle-outline'}
            size={12}
            color={isLost ? '#B45309' : '#047857'}
          />
          <Text
            style={[
              styles.typeBadgeText,
              isLost ? styles.lostBadgeText : styles.foundBadgeText,
            ]}
          >
            {isLost ? 'LOST' : 'FOUND'}
          </Text>
        </View>
      </View>

      {/* Item details */}
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={styles.category} numberOfLines={1}>
            {item.category || 'Community listing'}
          </Text>

          <View
            style={[
              styles.statusDot,
              isResolved ? styles.resolvedDot : styles.activeDot,
            ]}
          />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title || 'Untitled item'}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'No description provided.'}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color="#64748B"
            />
            <Text style={styles.location} numberOfLines={1}>
              {item.location || 'Location not specified'}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isResolved ? styles.resolvedBadge : styles.activeBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isResolved ? styles.resolvedText : styles.activeText,
              ]}
            >
              {isResolved ? 'Resolved' : 'Active'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E9EEF5',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },

  // Photo
  imageContainer: {
    width: 112,
    minHeight: 140,
    alignSelf: 'stretch',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 140,
  },
  placeholder: {
    flex: 1,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lostBadge: {
    backgroundColor: '#FEF3C7',
  },
  foundBadge: {
    backgroundColor: '#D1FAE5',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lostBadgeText: {
    color: '#92400E',
  },
  foundBadgeText: {
    color: '#065F46',
  },

  // Details
  content: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 12,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 7,
  },
  category: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#10B981',
  },
  resolvedDot: {
    backgroundColor: '#94A3B8',
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  description: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 10,
  },

  // Footer
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 'auto',
  },
  locationRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    flex: 1,
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },
  activeBadge: {
    backgroundColor: '#ECFDF5',
  },
  resolvedBadge: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  activeText: {
    color: '#047857',
  },
  resolvedText: {
    color: '#64748B',
  },
});
