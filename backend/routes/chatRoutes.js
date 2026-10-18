import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/user.js';
import { protect } from '../middleware/authMiddleware.js';
import { decryptMessage, generateRoomKey } from '../utils/cryptoUtils.js';

const router = express.Router();

// GET /api/chat/history/:userId — Fetch chat history with decryption
router.get('/history/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id || req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId }
      ]
    }).sort({ createdAt: 1 });

    const roomKey = generateRoomKey(myId.toString(), userId);

    const decryptedMessages = messages.map(msg => {
      if (msg.isEncrypted && msg.encrypted) {
        const decrypted = decryptMessage({
          encrypted: msg.encrypted,
          iv: msg.iv,
          authTag: msg.authTag
        }, roomKey);

        return {
          _id: msg._id,
          sender: msg.sender,
          receiver: msg.receiver,
          message: decrypted || msg.message,
          createdAt: msg.createdAt
        };
      }
      return {
        _id: msg._id,
        sender: msg.sender,
        receiver: msg.receiver,
        message: msg.message,
        createdAt: msg.createdAt
      };
    });

    res.json(decryptedMessages);
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chat/contacts — Users the current user has chatted with
router.get('/contacts', protect, async (req, res) => {
  try {
    const myId = req.user._id || req.user.id;

    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }]
    });

    const contactIds = new Set();
    messages.forEach(msg => {
      if (msg.sender.toString() !== myId.toString()) contactIds.add(msg.sender.toString());
      if (msg.receiver.toString() !== myId.toString()) contactIds.add(msg.receiver.toString());
    });

    const contacts = await User.find({ _id: { $in: Array.from(contactIds) } }).select('name email role');
    
    res.json(contacts);
  } catch (error) {
    console.error('Contacts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chat/conversations — Get conversation list with last message for each contact
router.get('/conversations', protect, async (req, res) => {
  try {
    const rawId = req.user._id || req.user.id;
    const myId = new mongoose.Types.ObjectId(rawId);

    // Aggregate to get the last message for each conversation partner
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: myId },
            { receiver: myId }
          ]
        }
      },
      {
        // Determine the "other" user in the conversation
        $addFields: {
          contactId: {
            $cond: {
              if: { $eq: ['$sender', myId] },
              then: '$receiver',
              else: '$sender'
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$contactId',
          lastMessage: { $first: '$message' },
          lastMessageTime: { $first: '$createdAt' },
          lastSender: { $first: '$sender' },
          messageCount: { $sum: 1 }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    // Populate contact details
    const contactIds = conversations.map(c => c._id);
    const contacts = await User.find({ _id: { $in: contactIds } }).select('name email role');
    const contactMap = {};
    contacts.forEach(c => { contactMap[c._id.toString()] = c; });

    const result = conversations.map(conv => ({
      contact: contactMap[conv._id.toString()] || { _id: conv._id, name: 'Unknown', email: '' },
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      lastSender: conv.lastSender,
      messageCount: conv.messageCount
    }));

    res.json(result);
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chat/users — All users except the current one
router.get('/users', protect, async (req, res) => {
  try {
    const myId = req.user._id || req.user.id;
    const users = await User.find({ _id: { $ne: myId } }).select('name email role');
    res.json(users);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;