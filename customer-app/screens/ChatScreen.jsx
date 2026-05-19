import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  StatusBar,
  Keyboard,
  Animated,
  LayoutAnimation,
  UIManager,
  Dimensions,
  Platform,
  StyleSheet
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  Send,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  Info,
  MoreVertical,
  Zap,
  Command,
  Headphones,
  User,
  Sparkles
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import api from "../utils/api";
import io from "socket.io-client";
import { navigate } from "../navigation/RootNavigation";
import { format, isToday, isYesterday } from "date-fns";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

// Helper for responsive sizing
const normalize = (size) => {
  const scale = Math.min(width / 375, 1.25);
  const newSize = size * scale;
  return Math.round(Platform.OS === 'ios' ? newSize : newSize - 1);
};

// --- COMPONENT: Architectural Message Bubble ---
const MessageItem = memo(
  ({ item, userId }) => {
    const isMyMessage = item.sender === userId;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, []);

    if (item.type === 'date_separator') {
      return (
        <View style={styles.dateSeparatorContainer}>
          <View style={styles.dateSeparatorLine} />
          <Text style={styles.dateSeparatorText}>{item.message}</Text>
          <View style={styles.dateSeparatorLine} />
        </View>
      );
    }

    const { isFirstInGroup, isLastInGroup, isConsecutive } = item;

    // Architectural Radii Logic (Softer and more premium)
    const radii = isMyMessage ? {
      borderTopRightRadius: isFirstInGroup ? 20 : 6,
      borderBottomRightRadius: isLastInGroup ? 20 : 6,
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
    } : {
      borderTopLeftRadius: isFirstInGroup ? 20 : 6,
      borderBottomLeftRadius: isLastInGroup ? 20 : 6,
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
    };

    return (
      <View style={{ marginBottom: isConsecutive ? 2 : 8 }}>
        {!isMyMessage && isFirstInGroup && (
          <View style={styles.supportLabelContainer}>
            <Headphones size={12} color="#E21D25" strokeWidth={2.5} />
            <Text style={styles.supportLabelText}>GLOSSCUT CONCIERGE</Text>
          </View>
        )}

        <Animated.View style={[{ opacity: fadeAnim, alignSelf: isMyMessage ? 'flex-end' : 'flex-start' }]}>
          {isMyMessage ? (
            <LinearGradient
              colors={['#E21D25', '#991B1B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.messageBubble, styles.myMessage, radii]}
            >
              <Text style={[styles.messageText, { color: "#FFF" }]}>
                {item.message}
              </Text>


            </LinearGradient>
          ) : (
            <View style={[styles.messageBubble, styles.otherMessage, radii]}>
              <Text style={[styles.messageText, { color: "#0F172A" }]}>
                {item.message}
              </Text>


            </View>
          )}
        </Animated.View>
      </View>
    );
  },
  (prev, next) => prev.item._id === next.item._id && prev.item.isLastInGroup === next.item.isLastInGroup
);

// --- COMPONENT: Editorial Intro ---
const EditorialIntro = memo(() => (
  <View style={styles.introContainer}>
    <LinearGradient
      colors={['#FEE2E2', '#FFF1F2']}
      style={styles.introIconCircle}
    >
      <Sparkles size={22} color="#E21D25" strokeWidth={2} />
    </LinearGradient>
    <Text style={styles.introTitle}>GlossCut Concierge</Text>
    <Text style={styles.introSubtitle}>
      Welcome to your private channel. Our elite support specialists are ready to assist with any request to ensure your journey is seamless.
    </Text>
    <View style={styles.introStatusPill}>
      <View style={styles.statusDot} />
      <Text style={styles.statusText}>ENCRYPTED & ACTIVE</Text>
    </View>
  </View>
));

// --- COMPONENT: Premium Toast ---
const ToastNotification = ({ notification }) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (notification.visible) {
      Animated.spring(translateY, { toValue: Math.max(insets.top, 20) + 10, friction: 8, tension: 40, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }).start();
    }
  }, [notification.visible]);

  if (!notification.visible && notification.message === "") return null;

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
      <Info size={16} color="#FFF" />
      <Text style={styles.toastText}>{notification.message}</Text>
    </Animated.View>
  );
};

export default function ChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token: authToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [notification, setNotification] = useState({ visible: false, message: "", type: "info" });
  const [adminId, setAdminId] = useState(null);

  const flatListRef = useRef(null);
  const socket = useRef(null);
  const notificationTimeout = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    setNotification({ visible: true, message, type });
    notificationTimeout.current = setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  useEffect(() => {
    if (!user || !authToken) { navigate("Login"); return; }
    const initChat = async () => {
      try {
        const res = await api.get('/api/chat/support-id');
        const supportId = res.data.adminId;
        setAdminId(supportId);
        const msgRes = await api.get(`/api/chat/${supportId}`);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages(msgRes.data);
        setTimeout(scrollToBottom, 100);
        socket.current = io(process.env.EXPO_PUBLIC_API_URL, { query: { token: authToken }, transports: ["websocket"] });
        socket.current.on("message", (message) => {
          if ((message.sender === user._id && message.receiver === supportId) || (message.sender === supportId && message.receiver === user._id)) {
            setMessages((prev) => {
              if (prev.some(m => m._id === message._id)) return prev;
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              return [...prev, message];
            });
            setTimeout(scrollToBottom, 50);
          }
        });
        socket.current.emit("joinChat", { userId: user._id, receiverId: supportId });
      } catch (err) { showToast("Connection unstable", "error"); }
    };
    initChat();
    return () => {
      if (socket.current) socket.current.disconnect();
      if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    };
  }, [user, authToken]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const messageData = { receiverId: adminId, message: newMessage, appType: "customer-app" };
    const tempMessage = newMessage;
    setNewMessage("");
    try {
      const response = await api.post(`/api/chat/send`, messageData);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages((prev) => [...prev, response.data]);
      if (socket.current && socket.current.connected) socket.current.emit("sendMessage", response.data);
      scrollToBottom();
    } catch (error) {
      setNewMessage(tempMessage);
      showToast("Message failed", "error");
    }
  };

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const processedMessages = useMemo(() => {
    const results = [];
    let lastDate = null;

    // Fallback messages if empty to ensure the page looks "full" and professional
    const activeMessages = messages.length > 0 ? messages : [
      {
        _id: 'fallback-1',
        sender: adminId || 'concierge',
        receiver: user._id,
        message: "Hello! Welcome to GlossCut Concierge. How can I assist you today?",
        timestamp: new Date().toISOString(),
      },
      {
        _id: 'fallback-2',
        sender: adminId || 'concierge',
        receiver: user._id,
        message: "You can ask me about your appointments, payments, or any issues you are facing.",
        timestamp: new Date().toISOString(),
      }
    ];

    activeMessages.forEach((msg, index) => {
      const msgDate = new Date(msg.timestamp);
      const dateStr = isToday(msgDate) ? 'TODAY' : isYesterday(msgDate) ? 'YESTERDAY' : format(msgDate, 'MMM d, yyyy').toUpperCase();
      if (dateStr !== lastDate) {
        results.push({ type: 'date_separator', message: dateStr, _id: `sep-${dateStr}` });
        lastDate = dateStr;
      }

      const prevMsg = activeMessages[index - 1];
      const nextMsg = activeMessages[index + 1];
      const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender || (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) > 300000;
      const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender || (new Date(nextMsg.timestamp) - new Date(msg.timestamp)) > 300000;
      const isConsecutive = nextMsg && nextMsg.sender === msg.sender && (new Date(nextMsg.timestamp) - new Date(msg.timestamp)) <= 300000;

      results.push({ ...msg, isFirstInGroup, isLastInGroup, isConsecutive });
    });
    return results;
  }, [messages, adminId, user._id]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ToastNotification notification={notification} />

      {/* Premium Glassmorphic Header */}
      <BlurView tint="light" intensity={90} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={22} color="#0F172A" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerMainTitle}>GLOSSCUT CONCIERGE</Text>
            </View>
          </View>

          <View style={{ width: normalize(36) }} />
        </View>
      </BlurView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={processedMessages}
            renderItem={({ item }) => <MessageItem item={item} userId={user._id} />}
            keyExtractor={(item) => item._id || Math.random().toString()}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
            ListHeaderComponent={<EditorialIntro />}
            showsVerticalScrollIndicator={false}
            style={{ maxWidth: 500, width: '100%', alignSelf: 'center' }}
          />

          {/* Floating Input Area */}
          <BlurView tint="light" intensity={80} style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.inputInner}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="#94A3B8"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
                style={[
                  styles.sendButton,
                  { backgroundColor: newMessage.trim() ? '#E21D25' : '#F1F5F9' }
                ]}
              >
                <Send size={16} color={newMessage.trim() ? "#FFF" : "#94A3B8"} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  keyboardView: { flex: 1 },
  header: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 100
  },
  headerInner: {
    height: normalize(60),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center'
  },
  backButton: {
    width: normalize(36),
    height: normalize(36),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  moreButton: {
    width: normalize(36),
    height: normalize(36),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  avatarPlaceholder: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: 16,
    backgroundColor: '#E21D25',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitleContainer: { alignItems: 'flex-start' },
  headerMainTitle: { fontSize: normalize(13), fontWeight: '900', color: '#0F172A', letterSpacing: 1.5, textAlign: 'center' },
  activeStatusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 },
  headerSubTitle: { fontSize: normalize(11), fontWeight: '600', color: '#64748B' },

  listContent: { paddingHorizontal: 16, paddingTop: 20 },

  introContainer: { alignItems: 'center', marginBottom: 16, marginTop: 10 },
  introIconCircle: {
    width: normalize(54),
    height: normalize(54),
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#E21D25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  introTitle: { fontSize: normalize(20), fontWeight: '900', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
  introSubtitle: { fontSize: normalize(12), color: '#64748B', textAlign: 'center', lineHeight: 18, paddingHorizontal: 30, fontWeight: '500' },
  introStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginTop: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusText: { fontSize: 8, fontWeight: '900', color: '#FFF', letterSpacing: 1 },

  dateSeparatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, paddingHorizontal: 20 },
  dateSeparatorLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dateSeparatorText: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, mx: 10, paddingHorizontal: 10 },

  supportLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginLeft: 4 },
  supportLabelText: { fontSize: normalize(9), fontWeight: '800', color: '#E21D25', letterSpacing: 1 },

  messageBubble: { maxWidth: '78%', paddingHorizontal: 16, paddingVertical: 10 },
  myMessage: {
    alignSelf: 'flex-end',
    shadowColor: '#E21D25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: { fontSize: normalize(13), lineHeight: 19, fontWeight: '500' },
  metaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  timestamp: { fontSize: 8, fontWeight: '700' },

  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(248,250,252,0.8)',
    borderTopWidth: 1,
    borderColor: '#E2E8F0'
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    minHeight: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center'
  },
  textInput: { flex: 1, fontSize: normalize(13), fontWeight: '500', color: '#0F172A', paddingVertical: 8 },
  sendButton: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  toastContainer: { position: "absolute", top: 0, flexDirection: "row", alignItems: "center", backgroundColor: "#0F172A", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, gap: 10, zIndex: 9999, alignSelf: 'center', width: '90%', maxWidth: 450, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  toastText: { color: "#FFF", fontWeight: "700", fontSize: 13 }
});
