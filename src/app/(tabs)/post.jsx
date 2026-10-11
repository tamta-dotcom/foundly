
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '../../contexts/AuthContext';
import { createListing } from '../../services/listings';
import {
  pickListingImage,
  uploadImageAsync,
} from '../../services/uploads';

const CATEGORIES = [
  'Electronics',
  'Wallet',
  'Keys',
  'Bags',
  'Documents',
  'Clothing',
  'Jewellery',
  'Other',
];

export default function PostScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [busy, setBusy] = useState(false);

  const submittingRef = useRef(false);

  async function choosePhoto() {
    try {
      const uri = await pickListingImage();

      if (uri) {
        setImageUri(uri);
      }
    } catch (error) {
      Alert.alert(
        'Photo error',
        error?.message || 'Could not select the photo.'
      );
    }
  }

  async function submit() {
    if (submittingRef.current) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (
      !title.trim() ||
      !description.trim() ||
      !category.trim() ||
      !location.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Please complete the item name, category, location, and description.'
      );
      return;
    }

    submittingRef.current = true;
    setBusy(true);

    try {
      let imageUrl = '';

      if (imageUri) {
        console.log('[Foundly] Starting Cloudinary upload...');
        imageUrl = await uploadImageAsync(imageUri);
        console.log('[Foundly] Cloudinary upload complete.');
      }

      console.log('[Foundly] Saving listing to Firestore...');

      await createListing(
        {
          type,
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          location: location.trim(),
          imageUrl,
        },
        user
      );

      console.log('[Foundly] Listing saved successfully.');

      setTitle('');
      setDescription('');
      setCategory('');
      setLocation('');
      setImageUri(null);
      setType('lost');

      Alert.alert(
        'Your listing is live!',
        'Thanks for helping your community reconnect with their belongings.',
        [
          {
            text: 'View listings',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('[Foundly] Create listing error:', error);

      Alert.alert(
        'Could not publish',
        error?.message ||
          'Something went wrong while publishing. Please try again.'
      );
    } finally {
      submittingRef.current = false;
      setBusy(false);
      console.log('[Foundly] Publishing process finished.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="create-outline" size={25} color="#2563EB" />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MAKE A DIFFERENCE</Text>
            <Text style={styles.heading}>Post an item</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Lost something or found someone else's? Share the details and help
          make a reunion happen.
        </Text>

        {/* Lost / Found selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What happened?</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the type of listing you want to create.
          </Text>

          <View style={styles.typeRow}>
            <Pressable
              onPress={() => setType('lost')}
              disabled={busy}
              style={[
                styles.typeOption,
                type === 'lost' && styles.lostSelected,
              ]}
            >
              <View
                style={[
                  styles.typeIcon,
                  type === 'lost' && styles.lostIconSelected,
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={23}
                  color={type === 'lost' ? '#FFFFFF' : '#64748B'}
                />
              </View>

              <Text style={styles.typeOptionTitle}>I lost it</Text>
              <Text style={styles.typeOptionSubtitle}>
                Help me find it
              </Text>

              {type === 'lost' && (
                <View style={styles.selectedCheck}>
                  <Ionicons
                    name="checkmark-circle"
                    size={19}
                    color="#2563EB"
                  />
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => setType('found')}
              disabled={busy}
              style={[
                styles.typeOption,
                type === 'found' && styles.foundSelected,
              ]}
            >
              <View
                style={[
                  styles.typeIcon,
                  type === 'found' && styles.foundIconSelected,
                ]}
              >
                <Ionicons
                  name="hand-left-outline"
                  size={23}
                  color={type === 'found' ? '#FFFFFF' : '#64748B'}
                />
              </View>

              <Text style={styles.typeOptionTitle}>I found it</Text>
              <Text style={styles.typeOptionSubtitle}>
                Help return it
              </Text>

              {type === 'found' && (
                <View style={styles.selectedCheck}>
                  <Ionicons
                    name="checkmark-circle"
                    size={19}
                    color="#059669"
                  />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Photo upload */}
        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Item photo</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>OPTIONAL</Text>
            </View>
          </View>

          <Text style={styles.sectionSubtitle}>
            A clear photo can help someone recognize the item faster.
          </Text>

          <Pressable
            onPress={choosePhoto}
            disabled={busy}
            style={({ pressed }) => [
              styles.photoPicker,
              imageUri && styles.photoPickerWithImage,
              pressed && !busy && styles.pressed,
            ]}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.photoPreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoEmpty}>
                <View style={styles.photoIcon}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={29}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.photoTitle}>Add a photo</Text>
                <Text style={styles.photoSubtitle}>
                  Choose an image from your device
                </Text>

                <View style={styles.photoAction}>
                  <Ionicons
                    name="images-outline"
                    size={16}
                    color="#2563EB"
                  />
                  <Text style={styles.photoActionText}>Choose image</Text>
                </View>
              </View>
            )}
          </Pressable>

          {imageUri && (
            <View style={styles.photoControls}>
              <Pressable
                style={styles.photoControl}
                onPress={choosePhoto}
                disabled={busy}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color="#2563EB"
                />
                <Text style={styles.photoControlText}>Change photo</Text>
              </Pressable>

              <Pressable
                style={styles.photoControl}
                onPress={() => setImageUri(null)}
                disabled={busy}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color="#DC2626"
                />
                <Text style={styles.removePhotoText}>Remove</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Item details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item details</Text>
          <Text style={styles.sectionSubtitle}>
            Add a few details to help people identify it.
          </Text>

          <Text style={styles.label}>Item name *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="pricetag-outline"
              size={19}
              color="#94A3B8"
            />
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Black leather wallet"
              placeholderTextColor="#94A3B8"
              maxLength={100}
              editable={!busy}
              returnKeyType="next"
            />
          </View>

          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((option) => {
              const selected = category === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  disabled={busy}
                  style={[
                    styles.categoryChip,
                    selected && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected && styles.categoryTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Location *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#94A3B8"
            />
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Where was it lost or found?"
              placeholderTextColor="#94A3B8"
              maxLength={150}
              editable={!busy}
              returnKeyType="next"
            />
          </View>

          <Text style={styles.label}>Description *</Text>
          <View style={[styles.inputWrapper, styles.descriptionWrapper]}>
            <Ionicons
              name="document-text-outline"
              size={19}
              color="#94A3B8"
              style={styles.descriptionIcon}
            />
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the color, brand, distinctive marks, or other useful details..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              maxLength={1500}
              editable={!busy}
            />
          </View>

          <Text style={styles.characterCount}>
            {description.length}/1500 characters
          </Text>
        </View>

        {/* Helpful reminder */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons
              name="bulb-outline"
              size={21}
              color="#B45309"
            />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>A little tip</Text>
            <Text style={styles.tipText}>
              Include useful identifying details, but keep sensitive personal
              information private.
            </Text>
          </View>
        </View>

        {/* Publish */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            busy && styles.submitDisabled,
            pressed && !busy && styles.pressed,
          ]}
          onPress={submit}
          disabled={busy}
          accessibilityRole="button"
        >
          {busy ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.submitText}>Publishing listing...</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="paper-plane-outline"
                size={19}
                color="#FFFFFF"
              />
              <Text style={styles.submitText}>Publish listing</Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
              />
            </>
          )}
        </Pressable>

        <Text style={styles.footerNote}>
          By posting, you're helping your community reconnect with their
          belongings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 125,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  headerIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: '#E8EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  heading: {
    color: '#0F172A',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
    marginBottom: 24,
  },

  // Sections
  section: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EEF5',
    borderRadius: 21,
    padding: 17,
    marginBottom: 17,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 16,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
  },
  optionalText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#64748B',
  },

  // Type selector
  typeRow: {
    flexDirection: 'row',
    gap: 11,
  },
  typeOption: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 13,
    backgroundColor: '#FFFFFF',
  },
  lostSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#F5F8FF',
  },
  foundSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF8',
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  lostIconSelected: {
    backgroundColor: '#2563EB',
  },
  foundIconSelected: {
    backgroundColor: '#059669',
  },
  typeOptionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  typeOptionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  selectedCheck: {
    position: 'absolute',
    top: 10,
    right: 9,
  },

  // Photo
  photoPicker: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BFCCDE',
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#F8FAFF',
  },
  photoPickerWithImage: {
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  photoEmpty: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 24,
  },
  photoIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#E8EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  photoSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  photoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5F5',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 15,
  },
  photoActionText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  photoPreview: {
    width: '100%',
    height: 225,
    backgroundColor: '#F1F5F9',
  },
  photoControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
  },
  photoControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 3,
  },
  photoControlText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  removePhotoText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },

  // Form fields
  label: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 9,
  },
  inputWrapper: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 13,
    backgroundColor: '#FBFCFE',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 13,
    color: '#0F172A',
    fontSize: 13,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipSelected: {
    backgroundColor: '#E8EEFF',
    borderColor: '#2563EB',
  },
  categoryText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryTextSelected: {
    color: '#1D4ED8',
  },
  descriptionWrapper: {
    alignItems: 'flex-start',
    minHeight: 135,
    paddingTop: 4,
  },
  descriptionIcon: {
    marginTop: 12,
  },
  descriptionInput: {
    minHeight: 125,
    lineHeight: 20,
  },
  characterCount: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 7,
  },

  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  tipIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '900',
  },
  tipText: {
    color: '#A16207',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
  },

  // Publish
  submitButton: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.19,
    shadowRadius: 10,
    elevation: 4,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  submitDisabled: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.82,
  },
  footerNote: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
  },
});
