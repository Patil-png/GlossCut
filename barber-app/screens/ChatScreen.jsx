import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  LayoutAnimation,
  UIManager,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Send, ChevronLeft, ShieldCheck, Phone, AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import api from "../utils/api";
import io from 'socket.io-client';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// --- OPTIMIZED SUB-COMPONENTS ---

// 1. Toast Component (Memoized to prevent unnecessary checks)
const ToastNotification = React.memo(({ visible, message, type, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 40,
        useNativeDriver: true,
        friction: 5,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onHide) onHide();
    });
  };

  const getIcon = () => {
    if (type === 'success') return <CheckCircle size={20} color="#FFF" />;
    if (type === 'error') return <AlertCircle size={20} color="#FFF" />;
    return <Info size={20} color="#FFF" />;
  };

  const getBackgroundColor = () => {
    if (type === 'success') return '#10B981';
    if (type === 'error') return '#EF4444';
    return '#3B82F6';
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
          zIndex: 9999,
        },
      ]}
    >
      <View style={styles.toastContent}>
        {getIcon()}
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
});

// 2. Message Item Component (The detailed lag fix)
// By separating this and using React.memo, typing in the input won't re-render these bubbles.
const MessageItem = React.memo(({ item, isMyMessage, isSameSenderAsPrev, theme }) => {
  return (
    <View style={[
      styles.messageRow,
      isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
      { marginTop: isSameSenderAsPrev ? 2 : 12 }
    ]}>
      {!isMyMessage && !isSameSenderAsPrev && (
        <View style={[styles.avatarSmall, { backgroundColor: theme.colors.border }]}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.colors.textSecondary }}>S</Text>
        </View>
      )}
      {!isMyMessage && isSameSenderAsPrev && <View style={{ width: 32, marginRight: 8 }} />}

      <View style={[
        styles.messageBubble,
        isMyMessage ? styles.myBubble : styles.otherBubble,
        {
          backgroundColor: isMyMessage ? theme.colors.primary : theme.colors.card,
          borderWidth: isMyMessage ? 0 : 1,
          borderColor: isMyMessage ? 'transparent' : theme.colors.border,
        },
      ]}>
        <Text style={[styles.messageText, { color: isMyMessage ? '#FFFFFF' : theme.colors.text }]}>
          {item.message}
        </Text>
        <Text style={[styles.timestamp, { color: isMyMessage ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for maximum performance
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.item.message === nextProps.item.message &&
    prevProps.isSameSenderAsPrev === nextProps.isSameSenderAsPrev &&
    prevProps.theme.isDark === nextProps.theme.isDark // Only re-render if theme changes
  );
});

export default function ChatScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { user, token: authToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const flatListRef = useRef(null);
  const socket = useRef(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  const adminId = '654a7e1c8e9d7b001f8e9d7b';

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    if (!user || !authToken) {
      navigation.replace('Login');
      return;
    }

    const initChat = async () => {
      await fetchMessages();
      setupSocket();
    };

    initChat();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [user, authToken]);

  const setupSocket = () => {
    try {
      socket.current = io(API_URL, {
        query: { token: authToken },
        reconnectionAttempts: 3,
        timeout: 10000,
      });

      socket.current.on('message', (message) => {
        if (
          (message.sender === user._id && message.receiver === adminId) ||
          (message.sender === adminId && message.receiver === user._id)
        ) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setMessages((prevMessages) => [...prevMessages, message]);
        }
        // Debounce scroll to avoid stuttering on rapid messages
        requestAnimationFrame(scrollToBottom);
      });
    } catch (error) {
      console.log("Socket initialization failed", error);
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/chat/${adminId}`, {
        timeout: 10000,
      });
      setMessages(response.data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (!error.response) {
        showToast('Unable to connect to server. Please check internet.', 'error');
      } else {
        showToast('Could not load chat history.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const animateSendButton = () => {
    Animated.sequence([
      Animated.timing(sendButtonScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(sendButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    animateSendButton();

    const messageData = {
      receiverId: adminId,
      message: newMessage,
      appType: 'barber-app',
    };

    try {
      const response = await api.post('/api/chat/send', messageData, {
        timeout: 5000,
      });

      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setMessages((prevMessages) => [...prevMessages, response.data]);

      if (socket.current?.connected) {
        socket.current.emit('sendMessage', response.data);
      }

      setNewMessage('');
      requestAnimationFrame(scrollToBottom);
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request URL:', error.config?.url);
      if (!error.response) {
        showToast('Network error. Message not sent.', 'error');
      } else if (error.response.status === 404) {
        showToast('Chat service not found. Please contact support.', 'error');
      } else {
        showToast('Failed to send message.', 'error');
      }
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Optimized Render Item
  const renderMessageItem = useCallback(({ item, index }) => {
    const isMyMessage = item.sender === user._id;
    // Safe check for previous message
    const isSameSenderAsPrev = index > 0 && messages[index - 1] && messages[index - 1].sender === item.sender;

    return (
      <MessageItem
        item={item}
        isMyMessage={isMyMessage}
        isSameSenderAsPrev={isSameSenderAsPrev}
        theme={theme}
      />
    );
  }, [user._id, messages, theme]); // Added dependencies

  // Stable key extractor
  const keyExtractor = useCallback((item, index) => {
    return item._id ? item._id : `temp-${index}`;
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={Platform.OS === 'android'}
      />

      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* HEADER */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10
        }
      ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <ShieldCheck size={20} color="#FFF" />
            </View>
            <View style={styles.onlineBadge} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Premium Support</Text>
            <Text style={[styles.headerSubtitle, { color: '#10B981' }]}>Online</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callButton}>
          <Phone size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={scrollToBottom}
                onLayout={scrollToBottom}
                // --- PERFORMANCE PROPS ---
                removeClippedSubviews={Platform.OS === 'android'} // Unmounts off-screen items
                initialNumToRender={15} // Render enough to fill screen
                maxToRenderPerBatch={10} // Don't render too many at once
                windowSize={10} // Reduce memory usage
                updateCellsBatchingPeriod={50}
                // -------------------------
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={{ color: theme.colors.textSecondary }}>How can we help you today?</Text>
                  </View>
                }
              />
            )}

            {/* INPUT AREA */}
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background }]}>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="Type a message..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                />
                <TouchableOpacity
                  disabled={!newMessage.trim()}
                  onPress={handleSendMessage}
                  style={{ opacity: newMessage.trim() ? 1 : 0.4 }}
                >
                  <Animated.View
                    style={[
                      styles.sendButton,
                      {
                        backgroundColor: newMessage.trim() ? theme.colors.primary : theme.colors.textSecondary,
                        transform: [{ scale: sendButtonScale }],
                      },
                    ]}
                  >
                    <Send size={18} color="#FFF" style={{ marginLeft: 2 }} />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    alignSelf: 'center',
    maxWidth: 400,
    width: '90%'
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  backButton: {
    paddingRight: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  callButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 50
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
    opacity: 0.6
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});