import React, { useState, useEffect, useRef, useCallback, memo } from "react";
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
  Keyboard,
  Animated,
  Easing,
  LayoutAnimation,
  UIManager,
  Dimensions,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  MessageSquare,
  Send,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShieldCheck,
} from "lucide-react-native";
import axios from "axios";
import io from "socket.io-client";
import { navigate } from "../navigation/RootNavigation";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width } = Dimensions.get("window");

// --- COMPONENT: Animated Message Bubble ---
const MessageItem = memo(
  ({ item, userId, theme }) => {
    const isMyMessage = item.sender === userId;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.otherMessage,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: isMyMessage
              ? theme.colors.primary
              : theme.colors.card,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            borderBottomRightRadius: isMyMessage ? 4 : 18,
            borderBottomLeftRadius: isMyMessage ? 18 : 4,
            shadowColor: isMyMessage ? theme.colors.primary : "#000",
            shadowOpacity: isMyMessage ? 0.3 : 0.05,
            shadowRadius: isMyMessage ? 8 : 4,
            elevation: isMyMessage ? 4 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isMyMessage ? "#fff" : theme.colors.text },
          ]}
        >
          {item.message}
        </Text>
        <View style={styles.metaContainer}>
          <Text
            style={[
              styles.timestamp,
              {
                color: isMyMessage
                  ? "rgba(255,255,255,0.8)"
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {isMyMessage && (
            <CheckCircle
              size={10}
              color="rgba(255,255,255,0.8)"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </Animated.View>
    );
  },
  (prev, next) => prev.item._id === next.item._id
);

// --- COMPONENT: Premium Toast Notification ---
const ToastNotification = ({ notification, theme }) => {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (notification.visible) {
      Animated.spring(translateY, {
        toValue: Platform.OS === "ios" ? 60 : 40, // Adjusted to sit below notch
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [notification.visible]);

  if (!notification.visible && notification.message === "") return null;

  const getStyle = () => {
    switch (notification.type) {
      case "success":
        return { bg: "#059669", icon: <CheckCircle size={20} color="#fff" /> };
      case "error":
        return { bg: "#DC2626", icon: <XCircle size={20} color="#fff" /> };
      default:
        return { bg: "#2563EB", icon: <AlertCircle size={20} color="#fff" /> };
    }
  };
  const { bg, icon } = getStyle();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }], backgroundColor: bg },
      ]}
    >
      <View style={styles.toastIconBubble}>{icon}</View>
      <Text style={styles.toastText}>{notification.message}</Text>
    </Animated.View>
  );
};

// --- COMPONENT: Online Indicator ---
const OnlineIndicator = ({ theme }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.onlineBadge}>
      <Animated.View
        style={[styles.onlineDot, { opacity, backgroundColor: "#10B981" }]}
      />
      <Text style={[styles.onlineText, { color: theme.colors.textSecondary }]}>
        Support Online
      </Text>
    </View>
  );
};

export default function ChatScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { user, token: authToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const notificationTimeout = useRef(null);

  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const socket = useRef(null);
  const adminId = "654a7e1c8e9d7b001f8e9d7b";

  const showToast = useCallback((message, type = "info") => {
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    setNotification({ visible: true, message, type });
    notificationTimeout.current = setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 4000);
  }, []);

  useEffect(() => {
    if (!user || !authToken) {
      // Use root navigator helper (safe isReady check) instead of replace which
      // can fail if this screen's navigator is unmounted or not handling REPLACE
      try {
        navigate("Login");
      } catch (e) {
        // Fallback to using navigation.reset if root navigation isn't ready
        try { navigation.reset({ index: 0, routes: [{ name: "Login" }] }); } catch (err) { /* noop */ }
      }
      return;
    }
    fetchMessages();

    try {
      socket.current = io(API_URL, {
        query: { token: authToken },
        transports: ["websocket"],
      });
      socket.current.on("connect", () => console.log("Socket connected"));
      socket.current.on("message", (message) => {
        if (
          (message.sender === user._id && message.receiver === adminId) ||
          (message.sender === adminId && message.receiver === user._id)
        ) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setMessages((prev) => [...prev, message]);
          setTimeout(scrollToBottom, 50);
        }
      });
      socket.current.emit("joinChat", {
        userId: user._id,
        receiverId: adminId,
      });
    } catch (err) {
      console.error("Socket Error", err);
    }
    return () => {
      if (socket.current) socket.current.disconnect();
      if (notificationTimeout.current)
        clearTimeout(notificationTimeout.current);
    };
  }, [user, authToken]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/${adminId}`, {
        headers: { "x-auth-token": authToken },
        timeout: 10000,
      });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(response.data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      showToast("Sync failed. Checking connection...", "error");
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.8,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(sendButtonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const messageData = {
      receiverId: adminId,
      message: newMessage,
      appType: "customer-app",
    };
    const tempMessage = newMessage;
    setNewMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/send`,
        messageData,
        { headers: { "x-auth-token": authToken } }
      );
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages((prev) => [...prev, response.data]);
      if (socket.current && socket.current.connected)
        socket.current.emit("sendMessage", response.data);
      scrollToBottom();
    } catch (error) {
      setNewMessage(tempMessage);
      showToast("Message failed to send", "error");
    }
  };

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const renderItem = useCallback(
    ({ item }) => <MessageItem item={item} userId={user._id} theme={theme} />,
    [user._id, theme]
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.card}
        translucent={false}
      />
      <ToastNotification notification={notification} theme={theme} />

      {/* --- FIXED HEADER (NO OVERLAP) --- */}
      {/* We use SafeAreaView ONLY for the header background on iOS to push content down properly */}
      <SafeAreaView style={{ backgroundColor: theme.colors.card }}>
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ChevronLeft size={26} color={theme.colors.primary} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={[styles.headerTitle, { color: theme.colors.text }]}
                >
                  Help Center
                </Text>
                <ShieldCheck
                  size={16}
                  color={theme.colors.primary}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <OnlineIndicator theme={theme} />
            </View>
            <View style={{ width: 26 }} />
          </View>
        </View>
      </SafeAreaView>

      {/* --- CHAT BODY --- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* We remove TouchableWithoutFeedback wrapping everything to avoid layout locking issues */}
        <View style={styles.chatArea}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item._id || Math.random().toString()}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // Allows scrolling without dismissing keyboard immediately
            onScrollBeginDrag={Keyboard.dismiss} // Smoothly dismiss keyboard on user scroll
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MessageSquare size={48} color={theme.colors.border} />
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Start a conversation with our team.
                </Text>
              </View>
            }
          />
        </View>

        {/* --- INPUT BAR (Always at bottom) --- */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: theme.colors.inputBackground },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              placeholder="Type your message..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
          </View>
          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: newMessage.trim()
                    ? theme.colors.primary
                    : theme.colors.border,
                  shadowColor: newMessage.trim()
                    ? theme.colors.primary
                    : "transparent",
                },
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
              activeOpacity={0.9}
            >
              <Send size={22} color="#fff" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  // --- HEADER STYLES ---
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    zIndex: 10,
    // Android Padding for Status Bar overlap
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 5, // Extra breathing room below status bar
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: -8,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // --- TOAST STYLES ---
  toastContainer: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 40,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    maxWidth: "92%",
  },
  toastIconBubble: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 4,
    marginRight: 10,
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    flexShrink: 1,
  },
  // --- CHAT AREA ---
  chatArea: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexGrow: 1,
    paddingBottom: 20, // Bottom padding for scrolling
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: "500",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    width: "70%",
  },
  // --- INPUT STYLES ---
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === "ios" ? 20 : 12, // Extra padding for iOS Home Indicator
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 10,
    minHeight: 48,
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    fontWeight: "400",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
