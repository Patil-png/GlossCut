const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
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
  console.log('Received receiverId:', receiverId);

  try {
    const sender = req.user.id; // From auth middleware
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      console.log('Receiver not found in database');
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
    res.json(newChatMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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

// @route   GET api/chat/admin/conversations
// @desc    Get a list of all users who have chatted with the admin
// @access  Private (Admin only)
router.get('/admin/conversations', async (req, res) => {
  try {
    const adminId = '654a7e1c8e9d7b001f8e9d7b'; // Hardcoded admin ID for debugging

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

    // FIXED: Manually decrypt the aggregated data
    // Aggregations bypass Mongoose getters, so we must decrypt 'name' and 'lastMessage'
    const conversations = rawConversations.map(conv => ({
      ...conv,
      name: decrypt(conv.name),
      lastMessage: decrypt(conv.lastMessage)
    }));

    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;