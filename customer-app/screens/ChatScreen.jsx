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
  XCircle,
  ShieldCheck,
  Info,
  MoreVertical,
  Zap,
  Command,
  Headphones
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
          <Text style={styles.dateSeparatorText}>{item.message}</Text>
        </View>
      );
    }

    const { isFirstInGroup, isLastInGroup, isConsecutive } = item;

    // Architectural Radii Logic
    const radii = isMyMessage ? {
      borderTopRightRadius: isFirstInGroup ? 16 : 4,
      borderBottomRightRadius: isLastInGroup ? 16 : 4,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
    } : {
      borderTopLeftRadius: isFirstInGroup ? 16 : 4,
      borderBottomLeftRadius: isLastInGroup ? 16 : 4,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
    };

    return (
      <View style={{ marginBottom: isConsecutive ? 4 : 16 }}>
        {!isMyMessage && isFirstInGroup && (
          <View style={styles.supportLabelContainer}>
            <Headphones size={10} color="#9CA3AF" />
            <Text style={styles.supportLabelText}>GLOSSCUT CONCIERGE</Text>
          </View>
        )}

        <Animated.View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.otherMessage,
            radii,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={[styles.messageText, { color: isMyMessage ? "#FFF" : "#000" }]}>
            {item.message}
          </Text>

          {isLastInGroup && (
            <View style={styles.metaContainer}>
              <Text style={[styles.timestamp, { color: isMyMessage ? "rgba(255,255,255,0.5)" : "#9CA3AF" }]}>
                {format(new Date(item.timestamp), 'h:mm a')}
              </Text>
              {isMyMessage && (
                <CheckCircle size={10} color="rgba(255,255,255,0.4)" style={{ marginLeft: 4 }} />
              )}
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
    <View style={styles.introIconCircle}>
      <Command size={20} color="#000" />
    </View>
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
    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.timestamp);
      const dateStr = isToday(msgDate) ? 'TODAY' : isYesterday(msgDate) ? 'YESTERDAY' : format(msgDate, 'MMM d, yyyy').toUpperCase();
      if (dateStr !== lastDate) {
        results.push({ type: 'date_separator', message: dateStr, _id: `sep-${dateStr}` });
        lastDate = dateStr;
      }

      const prevMsg = messages[index - 1];
      const nextMsg = messages[index + 1];
      const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender || (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) > 300000;
      const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender || (new Date(nextMsg.timestamp) - new Date(msg.timestamp)) > 300000;
      const isConsecutive = nextMsg && nextMsg.sender === msg.sender && (new Date(nextMsg.timestamp) - new Date(msg.timestamp)) <= 300000;

      results.push({ ...msg, isFirstInGroup, isLastInGroup, isConsecutive });
    });
    return results;
  }, [messages]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ToastNotification notification={notification} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={20} color="#000" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerMainTitle}>GlossCut</Text>
            <Text style={styles.headerSubTitle}>CONCIERGE</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

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
          />

          <BlurView tint="light" intensity={80} style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.inputInner}>
              <TextInput
                style={styles.textInput}
                placeholder="Message concierge..."
                placeholderTextColor="#9CA3AF"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity onPress={handleSendMessage} disabled={!newMessage.trim()} style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.3 }]}>
                <Send size={20} color="#000" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  keyboardView: { flex: 1 },
  header: { backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#1A1A1A08', zIndex: 100 },
  headerInner: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  moreButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'center' },
  headerMainTitle: { fontSize: 20, fontWeight: '900', color: '#000', letterSpacing: -1 },
  headerSubTitle: { fontSize: 8, fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginTop: -2 },
  listContent: { paddingHorizontal: 20, paddingTop: 30 },
  introContainer: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
  introIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  introTitle: { fontSize: 24, fontWeight: '900', color: '#000', marginBottom: 12, letterSpacing: -1 },
  introSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, fontWeight: '500' },
  introStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginTop: 24 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusText: { fontSize: 8, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  dateSeparatorContainer: { alignItems: 'center', marginVertical: 32 },
  dateSeparatorText: { fontSize: 9, fontWeight: '900', color: '#9CA3AF', letterSpacing: 2 },
  supportLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginLeft: 4 },
  supportLabelText: { fontSize: 8, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
  messageBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 12 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#000' },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3F4F6' },
  messageText: { fontSize: 14.5, lineHeight: 21, fontWeight: '400' },
  metaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 },
  timestamp: { fontSize: 8, fontWeight: '800' },
  inputContainer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderColor: '#1A1A1A05' },
  inputInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#1A1A1A', borderRadius: 8, paddingHorizontal: 16, minHeight: 52 },
  textInput: { flex: 1, fontSize: 15, fontWeight: '500', color: '#000', paddingVertical: 12 },
  sendButton: { paddingLeft: 12 },
  toastContainer: { position: "absolute", top: 0, flexDirection: "row", alignItems: "center", backgroundColor: "#000", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 8, gap: 10, zIndex: 9999, alignSelf: 'center', width: '90%' },
  toastText: { color: "#FFF", fontWeight: "800", fontSize: 13 }
});
