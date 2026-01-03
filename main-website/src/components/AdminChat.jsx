import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

// Icons for a better UI (Assuming you might use a library like 'react-icons')
// For this example, we'll use emojis as placeholders if no icon library is installed.
const ChatIcon = '💬'; 
const SendIcon = '▶️';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'; // Assuming API_URL is configured in .env

export default function AdminChat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(selectedUser); // Ref to hold the latest selectedUser
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  // Admin's own ID (replace with actual admin user ID from your system)
  const adminId = '654a7e1c8e9d7b001f8e9d7b'; // This should be the ID of the admin user in your 'User' model

  // Effect to keep selectedUserRef updated
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    const adminAuthToken = localStorage.getItem('adminAuthToken');
    if (!adminAuthToken) {
      navigate('/login'); // Redirect to login if not authenticated
      return;
    }

    fetchConversations();

    socket.current = io(API_URL, {
      // query: { token: adminAuthToken },
    });

    socket.current.on('connect', () => {
      console.log('Admin Socket connected');
      socket.current.emit('joinChat', { userId: adminId, receiverId: 'all' });
    });

    socket.current.on('message', (message) => {
      // Use the ref to get the latest selectedUser
      const currentSelectedUser = selectedUserRef.current;
      if (currentSelectedUser && (message.sender === currentSelectedUser._id || message.receiver === currentSelectedUser._id)) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
      fetchConversations(); // Always update conversations list
    });

    socket.current.on('disconnect', () => {
      console.log('Admin Socket disconnected');
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [navigate]); // Empty dependency array to ensure socket connects only once

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const adminAuthToken = localStorage.getItem('adminAuthToken'); // Replace with actual token retrieval
      const response = await axios.get(`${API_URL}/api/chat/admin/conversations`, { // New endpoint needed
        headers: {
          'x-auth-token': adminAuthToken, // Keep header for now, but it might be empty
        },
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const adminAuthToken = localStorage.getItem('adminAuthToken');
      const response = await axios.get(`${API_URL}/api/chat/${userId}`, {
        headers: {
          'x-auth-token': adminAuthToken, // Keep header for now, but it might be empty
        },
      });
      setMessages(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchMessages(user._id);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedUser) return;

    const messageData = {
      sender: adminId, // Admin is the sender
      receiverId: selectedUser._id,
      message: newMessage,
      appType: 'main-website',
    };

    try {
      const adminAuthToken = localStorage.getItem('adminAuthToken');
      const response = await axios.post(`${API_URL}/api/chat/send`, messageData, {
        headers: {
          'x-auth-token': adminAuthToken, // Keep header for now, but it might be empty
        },
      });

      // Update local state immediately for instant display
      setMessages((prevMessages) => [...prevMessages, response.data]);

      socket.current.emit('sendMessage', response.data); // Emit to the room
      setNewMessage('');
      scrollToBottom(); // Scroll to bottom after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>{ChatIcon} Support Desk</h2>
        <div style={styles.conversationsList}>
        {conversations.map((conv) => (
          <div
            key={conv._id}
            style={{
              ...styles.conversationItem,
              // Use a primary color for selection
              backgroundColor: selectedUser?._id === conv._id ? styles.colors.primaryLight : 'transparent',
              borderLeft: selectedUser?._id === conv._id ? `4px solid ${styles.colors.primary}` : '4px solid transparent',
            }}
            onClick={() => handleUserSelect(conv)}
          >
            <p style={styles.conversationName}>{conv.name}</p>
            <span style={styles.appTypeTag}>{conv.appType}</span>
            <p style={styles.lastMessage}>{conv.lastMessage}</p>
          </div>
        ))}
        </div>
      </div>
      <div style={styles.chatWindow}>
        {selectedUser ? (
          <>
            <div style={styles.chatHeader}>
              <h3 style={styles.chatHeaderTitle}>Chat with {selectedUser.name}</h3>
              <span style={styles.chatHeaderSubtitle}>User from {selectedUser.appType}</span>
            </div>
            <div style={styles.messagesContainer}>
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  style={{
                    ...styles.messageBubble,
                    alignSelf: msg.sender === adminId ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === adminId ? styles.colors.primaryLight : styles.colors.white,
                    color: msg.sender === adminId ? styles.colors.textDark : styles.colors.textDark,
                    borderBottomRightRadius: msg.sender === adminId ? '4px' : '20px',
                    borderBottomLeftRadius: msg.sender === adminId ? '20px' : '4px',
                  }}
                >
                  <p style={styles.messageText}>{msg.message}</p>
                  <span style={styles.messageTimestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputContainer}>
              <input
                type="text"
                style={styles.textInput}
                placeholder="Type your reply..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button style={styles.sendButton} onClick={handleSendMessage}>{SendIcon}</button>
            </div>
          </>
        ) : (
          <div style={styles.noChatSelected}>
            <div>
              {ChatIcon}
              <p style={{marginTop: "10px"}}>Select a conversation from the sidebar to begin support.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- UPDATED STYLES FOR PROFESSIONAL LOOK ---

const styles = {
  // Define a color palette for a professional look
  colors: {
    primary: '#4f46e5', // Indigo 600 - Good startup primary color
    primaryLight: '#eef2ff', // Indigo 50 - Very light primary tint
    secondary: '#10b981', // Emerald 500
    textDark: '#1f2937', // Gray 800
    textMuted: '#6b7280', // Gray 500
    backgroundLight: '#f9fafb', // Gray 50
    white: '#ffffff',
    border: '#e5e7eb', // Gray 200
  },

  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Inter, sans-serif', // Modern font
    backgroundColor: '#f5f7fb', // Off-white main background
  },
  sidebar: {
    width: '320px',
    borderRight: `1px solid #e5e7eb`,
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'hidden',
    boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
  },
  sidebarTitle: {
    fontSize: '1.5rem', // Larger, more prominent
    padding: '20px 20px 10px 20px',
    borderBottom: `1px solid #e5e7eb`,
    color: '#4f46e5',
    margin: 0,
    fontWeight: 700,
  },
  conversationsList: {
    overflowY: 'auto',
    padding: '10px 0',
  },
  conversationItem: {
    padding: '15px 20px',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-left 0.15s',
    borderBottom: `1px solid #e5e7eb`,
    display: 'grid',
    gridTemplateAreas: '"name type" "message message"',
    gridTemplateColumns: '1fr auto',
    gap: '4px',
    '&:hover': {
      backgroundColor: '#eef2ff',
    },
  },
  conversationName: {
    fontWeight: 600,
    margin: '0',
    color: '#1f2937',
    fontSize: '16px',
    gridArea: 'name',
  },
  appTypeTag: {
    fontSize: '11px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6', // Light gray badge
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: 500,
    gridArea: 'type',
    alignSelf: 'center',
  },
  lastMessage: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0',
    gridArea: 'message',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chatWindow: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    margin: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  chatHeader: {
    padding: '15px 20px',
    borderBottom: `1px solid #e5e7eb`,
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  chatHeaderTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#1f2937',
    fontWeight: 600,
  },
  chatHeaderSubtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    // Custom scrollbar (browser-specific might need real CSS)
  },
  messageBubble: {
    padding: '10px 14px',
    borderRadius: '20px',
    maxWidth: '65%',
    wordBreak: 'break-word',
    lineHeight: '1.4',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  messageText: {
    margin: 0,
    fontSize: '15px',
  },
  messageTimestamp: {
    fontSize: '10px',
    color: '#6b7280',
    marginTop: '4px',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    display: 'flex',
    padding: '15px 20px',
    borderTop: `1px solid #e5e7eb`,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    padding: '12px 18px',
    borderRadius: '25px',
    border: `1px solid #e5e7eb`,
    marginRight: '10px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:focus': {
      borderColor: '#4f46e5',
      boxShadow: `0 0 0 2px #eef2ff`,
    },
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'background-color 0.2s, transform 0.1s',
    '&:hover': {
      backgroundColor: '#3730a3', // Darker primary
    },
    '&:active': {
      transform: 'scale(0.95)',
    },
  },
  noChatSelected: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '2rem',
    color: '#6b7280',
    textAlign: 'center',
    padding: '20px',
  },
};
