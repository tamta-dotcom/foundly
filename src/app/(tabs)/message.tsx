
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
} from '../../services/messages';

const BLUE = '#2563EB';
const DARK = '#0F172A';
const MUTED = '#64748B';
const BG = '#F8FAFC';
const BORDER = '#E2E8F0';

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const getParam = (value) =>
    Array.isArray(value) ? value[0] : value;

  const conversationId = getParam(params.conversationId);
  const listingId = getParam(params.listingId);
  const ownerId = getParam(params.ownerId);

  const [conversations, setConversations] = useState([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const listRef = useRef(null);
  const draftRef = useRef('');

  function updateDraft(value) {
    draftRef.current = value;
    setDraft(value);
  }

  // Subscribe to conversations belonging to the signed-in user.
  useEffect(() => {
    let active = true;

    setConversationsLoaded(false);
    setLoading(true);
    setLoadError('');

    if (!user?.uid) {
      setConversations([]);
      setSelected(null);
      setMessages([]);
      setLoading(false);
      setConversationsLoaded(false);
      return;
    }

    const unsubscribe = subscribeToConversations(
      user.uid,
      (data) => {
        if (!active) return;

        setConversations(Array.isArray(data) ? data : []);
        setConversationsLoaded(true);
        setLoading(false);
        setLoadError('');
      },
      (error) => {
        if (!active) return;

        console.error('Conversation subscription error:', error);
        setConversationsLoaded(true);
        setLoading(false);
        setLoadError(
          'Could not load conversations. Check your connection and try again.'
        );
      }
    );

    return () => {
      active = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  // Automatically open the conversation passed from the listing screen.
  // The service stores participant IDs in "participants".
  useEffect(() => {
    if (!user?.uid || !conversationsLoaded) return;

    // No incoming chat route: keep the user's current selection.
    if (!conversationId && !listingId) return;

    const match = conversations.find((conversation) => {
      // Exact conversation ID is the most reliable match.
      if (
        conversationId &&
        conversation.id === String(conversationId)
      ) {
        return true;
      }

      if (!listingId) return false;

      const sameListing =
        String(conversation.listingId ?? '') === String(listingId);

      if (!sameListing) return false;

      const participants = Array.isArray(conversation.participants)
        ? conversation.participants
        : [];

      // The current user must belong to this conversation.
      if (!participants.includes(user.uid)) return false;

      // When ownerId is provided, ensure the owner is also a participant.
      if (ownerId && !participants.includes(String(ownerId))) {
        return false;
      }

      return true;
    });

    if (match) {
      setSelected((current) =>
        current?.id === match.id ? current : match
      );
      setMessages([]);
      updateDraft('');
    } else {
      // Do not accidentally leave a previous chat open if the requested
      // conversation cannot be found.
      setSelected(null);
    }
  }, [
    user?.uid,
    conversationsLoaded,
    conversations,
    conversationId,
    listingId,
    ownerId,
  ]);

  // Subscribe to messages whenever the selected conversation changes.
  useEffect(() => {
    if (!selected?.id || !user?.uid) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    let active = true;

    setMessages([]);
    setMessagesLoading(true);

    const unsubscribe = subscribeToMessages(
      selected.id,
      (data) => {
        if (!active) return;

        setMessages(Array.isArray(data) ? data : []);
        setMessagesLoading(false);
      },
      (error) => {
        if (!active) return;

        console.error('Message subscription error:', error);
        setMessagesLoading(false);

        Alert.alert(
          'Messages unavailable',
          error?.message || 'Could not load messages for this conversation.'
        );
      }
    );

    return () => {
      active = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [selected?.id, user?.uid]);

  // Scroll to the newest message.
  useEffect(() => {
    if (!selected) return;

    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 150);

    return () => clearTimeout(timeout);
  }, [messages, selected?.id]);

  async function submitMessage() {
    const text = draftRef.current.trim();

    if (!user) {
      router.push('/login');
      return;
    }

    if (!selected?.id || !text || sending) return;

    updateDraft('');
    setSending(true);

    try {
      await sendMessage(selected, user, text);
    } catch (error) {
      console.error('Send message error:', error);

      // Restore the message if the user has not typed a new one.
      if (!draftRef.current.trim()) {
        updateDraft(text);
      }

      Alert.alert(
        'Could not send message',
        error?.message || 'Please check your connection and try again.'
      );
    } finally {
      setSending(false);
    }
  }

  function openConversation(conversation) {
    setSelected(conversation);
    setMessages([]);
    updateDraft('');
  }

  function closeConversation() {
    setSelected(null);
    setMessages([]);
    updateDraft('');
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />

        <View style={styles.center}>
          <View style={styles.bigIcon}>
            <Ionicons
              name="chatbubbles-outline"
              size={38}
              color={BLUE}
            />
          </View>

          <Text style={styles.pageTitle}>Your conversations await</Text>

          <Text style={styles.subtitle}>
            Sign in to contact listing owners and message your Foundly
            community.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.subtitle}>Loading conversations...</Text>
      </SafeAreaView>
    );
  }

  // -------------------- CHAT VIEW --------------------
  if (selected) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={closeConversation}
              accessibilityLabel="Back to conversations"
            >
              <Ionicons name="arrow-back" size={23} color={DARK} />
            </TouchableOpacity>

            <View style={styles.chatAvatar}>
              <Ionicons
                name="chatbubble-ellipses"
                size={22}
                color={BLUE}
              />
            </View>

            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatTitle} numberOfLines={1}>
                {selected.listingTitle || 'Foundly conversation'}
              </Text>
              <Text style={styles.chatSubtitle}>
                Listing conversation
              </Text>
            </View>
          </View>

          <View style={styles.listingBanner}>
            <Ionicons name="pricetag-outline" size={20} color={BLUE} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerLabel}>Discussing listing</Text>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {selected.listingTitle || 'Foundly listing'}
              </Text>
            </View>
          </View>

          <FlatList
            ref={listRef}
            style={styles.messageList}
            data={messages}
            keyExtractor={(message, index) =>
              String(
                message.id ||
                  message.createdAt?.toString?.() ||
                  index
              )
            }
            contentContainerStyle={[
              styles.messageListContent,
              messages.length === 0 && styles.emptyMessagesContent,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const mine = item.senderId === user.uid;

              return (
                <View
                  style={[
                    styles.messageRow,
                    mine ? styles.myRow : styles.theirRow,
                  ]}
                >
                  {!mine && (
                    <View style={styles.smallAvatar}>
                      <Ionicons
                        name="person-outline"
                        size={14}
                        color={MUTED}
                      />
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      mine ? styles.myBubble : styles.theirBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        mine ? styles.myText : styles.theirText,
                      ]}
                    >
                      {item.text || ''}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                {messagesLoading ? (
                  <ActivityIndicator color={BLUE} size="small" />
                ) : (
                  <>
                    <View style={styles.emptyChatIcon}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={30}
                        color={BLUE}
                      />
                    </View>

                    <Text style={styles.emptyChatTitle}>
                      Start a conversation
                    </Text>

                    <Text style={styles.subtitle}>
                      Write a message below to contact the other person.
                    </Text>
                  </>
                )}
              </View>
            }
          />

          {/* Message input and Send button */}
          <View style={styles.composerContainer}>
            <View style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={updateDraft}
                placeholder="Write a message..."
                placeholderTextColor="#94A3B8"
                style={styles.input}
                multiline
                maxLength={2000}
                editable={!sending}
                blurOnSubmit={false}
                textAlignVertical="center"
                accessibilityLabel="Write a message"
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!draft.trim() || sending) && styles.sendDisabled,
                ]}
                onPress={submitMessage}
                disabled={!draft.trim() || sending}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={19} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.composerHint}>
              Keep personal information private and arrange safe handovers.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------------- CONVERSATION LIST ----------------
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <FlatList
        data={conversations}
        keyExtractor={(conversation, index) =>
          String(conversation.id || index)
        }
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>STAY CONNECTED</Text>
            <Text style={styles.pageTitle}>Messages</Text>
            <Text style={styles.subtitle}>
              Connect with your Foundly community.
            </Text>

            <View style={styles.summaryCard}>
              <Ionicons
                name="chatbubbles"
                size={28}
                color="#FFFFFF"
              />

              <View style={{ flex: 1, marginLeft: 13 }}>
                <Text style={styles.summaryTitle}>
                  Your conversations
                </Text>
                <Text style={styles.summarySubtitle}>
                  Messages about lost and found items
                </Text>
              </View>

              <Text style={styles.countBadge}>
                {conversations.length}
              </Text>
            </View>

            {!!loadError && (
              <View style={styles.errorCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#B91C1C"
                />
                <Text style={styles.errorText}>{loadError}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              Recent conversations
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationCard}
            onPress={() => openConversation(item)}
            activeOpacity={0.8}
          >
            <View style={styles.conversationAvatar}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={BLUE}
              />
            </View>

            <View style={styles.conversationInfo}>
              <Text style={styles.conversationTitle} numberOfLines={1}>
                {item.listingTitle || 'Foundly conversation'}
              </Text>

              <Text style={styles.preview} numberOfLines={2}>
                {item.lastMessage || 'Tap to open this conversation'}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#94A3B8"
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.bigIcon}>
              <Ionicons
                name="chatbubbles-outline"
                size={38}
                color={BLUE}
              />
            </View>

            <Text style={styles.emptyTitle}>No conversations yet</Text>

            <Text style={styles.subtitle}>
              Open a listing and tap Message Owner to start a conversation.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.primaryButtonText}>
                Explore listings
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  keyboard: { flex: 1, backgroundColor: BG },

  center: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 30,
  },
  emptyListContent: { flexGrow: 1 },

  eyebrow: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 7,
  },
  pageTitle: {
    color: DARK,
    fontSize: 29,
    fontWeight: '900',
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 9,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    borderRadius: 20,
    padding: 17,
    marginTop: 22,
    marginBottom: 27,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: '#DBEAFE',
    fontSize: 12,
    marginTop: 5,
  },
  countBadge: {
    minWidth: 34,
    textAlign: 'center',
    overflow: 'hidden',
    color: BLUE,
    backgroundColor: '#FFFFFF',
    fontWeight: '900',
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  sectionTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 13,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 11,
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationInfo: { flex: 1 },
  conversationTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '900',
  },
  preview: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  emptyCard: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    marginTop: 8,
  },
  bigIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  emptyTitle: {
    color: DARK,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: BLUE,
    borderRadius: 13,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorText: {
    color: '#B91C1C',
    flex: 1,
    fontSize: 13,
  },

  // Chat header
  chatHeader: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    width: 38,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderInfo: { flex: 1 },
  chatTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: '900',
  },
  chatSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 5,
  },
  listingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  bannerLabel: {
    color: MUTED,
    fontSize: 11,
  },
  bannerTitle: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },

  messageList: { flex: 1 },
  messageListContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 18,
  },
  emptyMessagesContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    marginBottom: 12,
  },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  smallAvatar: {
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: BLUE,
    borderBottomRightRadius: 5,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  myText: { color: '#FFFFFF' },
  theirText: { color: DARK },

  emptyChat: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 25,
  },
  emptyChatIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyChatTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '900',
  },

  // Message composer
  composerContainer: {
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  composer: {
    minHeight: 53,
    maxHeight: 130,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 118,
    color: DARK,
    fontSize: 15,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 9,
  },
  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: '#94A3B8',
  },
  composerHint: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 7,
  },
});
