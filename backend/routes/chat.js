const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Admin = require('../models/Admin');
const chatAuth = require('../middleware/chatAuth'); // Changed from auth to chatAuth
// IMPORT DECRYPT to fix aggregation and lean queries
const { decrypt } = require('../utils/EncryptionService');
const validate = require('../middleware/validate');
const schemas = require('../utils/validationSchemas');

// Ultra-efficient in-memory cache for chat operations
const chatCache = new Map();
const CHAT_CACHE_DURATION = 30 * 1000; // 30 seconds for chat data

// Cache management functions
const getChatCached = (key) => {
  const cached = chatCache.get(key);
  if (cached && Date.now() - cached.timestamp < CHAT_CACHE_DURATION) {
    return cached.data;
  }
  chatCache.delete(key);
  return null;
};

const setChatCached = (key, data) => {
  chatCache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leaks - limit cache size
  if (chatCache.size > 100) {
    const firstKey = chatCache.keys().next().value;
    chatCache.delete(firstKey);
  }
};

// @route   POST api/chat/send
// @desc    Send a chat message
// @access  Private
router.post('/send', chatAuth, validate(schemas.sendChat), async (req, res) => {
  const { receiverId, message, appType } = req.body;
  console.log('Chat Send Triggered - Receiver:', receiverId, 'App:', appType);

  try {
    const sender = req.user.id; // From auth middleware

    // Check if receiver is a User or an Admin
    let receiver = await User.findById(receiverId);
    if (!receiver) {
      receiver = await Admin.findById(receiverId);
    }

    if (!receiver) {
      console.log('Receiver not found in User or Admin collections:', receiverId);
      return res.status(404).json({ msg: 'Receiver not found' });
    }

    // Mongoose setter automatically encrypts the message here
    const newChatMessage = new ChatMessage({
      sender,
      receiver: receiverId,
      message,
      appType,
    });

    await newChatMessage.save();
    console.log('Chat message saved successfully');
    res.json(newChatMessage);
  } catch (err) {
    console.error('CRITICAL CHAT ERROR:', err); // Log the full error object
    res.status(500).json({
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/chat/:receiverId
// @desc    Get chat history between current user and a specific receiver (ultra-optimized with caching)
router.get('/:receiverId', chatAuth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.receiverId;
    const cacheKey = `chat_${senderId}_${receiverId}`;

    const cached = getChatCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // FIXED: Removed .lean() so Mongoose automatically decrypts the messages
    const messages = await ChatMessage.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    })
      .sort({ timestamp: 1 }); // Sort by timestamp ascending

    setChatCached(cacheKey, messages);
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/chat/support-id
// @desc    Get the ID of the main support admin
// @access  Public
router.get('/support-id', async (req, res) => {
  try {
    // Find a superadmin to act as the default support contact
    const admin = await Admin.findOne({ role: 'superadmin' }).select('_id');
    if (!admin) {
      return res.status(404).json({ msg: 'Support admin not found' });
    }
    res.json({ adminId: admin._id });
  } catch (err) {
    console.error('Error fetching support ID:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/chat/admin/conversations
// @desc    Get a list of all users who have chatted with the admin
// @access  Private (Admin only)
router.get('/admin/conversations', chatAuth, async (req, res) => {
  try {
    const adminId = req.user.id;
    console.log('📩 Admin conversations requested by:', adminId);

    // Aggregation pipeline (returns encrypted raw data)
    const rawConversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { receiver: new mongoose.Types.ObjectId(adminId) },
            { sender: new mongoose.Types.ObjectId(adminId) },
          ],
        },
      },
      {
        // Add a field to identify the "other user" (not the admin)
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ['$sender', new mongoose.Types.ObjectId(adminId)] },
              then: '$receiver',
              else: '$sender'
            }
          }
        }
      },
      {
        $group: {
          _id: '$otherUser', // Group by the other user, not the sender
          lastMessage: { $last: '$message' },
          timestamp: { $last: '$timestamp' },
          appType: { $last: '$appType' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $project: {
          _id: '$userInfo._id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          lastMessage: 1,
          timestamp: 1,
          appType: 1,
        },
      },
      {
        $sort: { timestamp: -1 },
      },
    ]);

    console.log(`✅ Found ${rawConversations.length} raw conversations`);

    // FIXED: Manually decrypt the aggregated data with error handling
    // Aggregations bypass Mongoose getters, so we must decrypt 'name' and 'lastMessage'
    const conversations = rawConversations.map((conv, index) => {
      try {
        // Safely decrypt name
        let decryptedName = 'Unknown User';
        if (conv.name) {
          try {
            decryptedName = decrypt(conv.name);
          } catch (e) {
            console.error(`Failed to decrypt name for conversation ${index}:`, e.message);
          }
        }

        // Safely decrypt last message
        let decryptedMessage = '';
        if (conv.lastMessage) {
          try {
            decryptedMessage = decrypt(conv.lastMessage);
          } catch (e) {
            console.error(`Failed to decrypt message for conversation ${index}:`, e.message);
          }
        }

        // Handle email - it might be encrypted or an object
        let emailValue = '';
        if (conv.email) {
          if (typeof conv.email === 'string') {
            try {
              emailValue = decrypt(conv.email);
            } catch (e) {
              emailValue = conv.email; // Use as is if decryption fails
            }
          } else if (typeof conv.email === 'object') {
            emailValue = conv.email.email || conv.email.value || '';
          }
        }

        return {
          _id: conv._id,
          name: decryptedName,
          email: emailValue,
          lastMessage: decryptedMessage,
          timestamp: conv.timestamp,
          appType: conv.appType,
        };
      } catch (err) {
        console.error(`Error processing conversation ${index}:`, err.message);
        // Return a safe fallback
        return {
          _id: conv._id,
          name: 'Unknown User',
          email: '',
          lastMessage: '',
          timestamp: conv.timestamp,
          appType: conv.appType,
        };
      }
    });

    console.log(`✅ Successfully processed ${conversations.length} conversations`);
    res.json(conversations);
  } catch (err) {
    console.error('❌ CRITICAL ERROR in /admin/conversations:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      msg: 'Failed to load conversations',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;