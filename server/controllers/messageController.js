import Message from '../models/Message.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { emitConversationMessage } from '../utils/emitConversationMessage.js';
import {
  normalizeConversationId,
  buildConversationId,
  getConversationIdVariants,
} from '../utils/conversationId.js';

export { normalizeConversationId, buildConversationId, getConversationIdVariants };

// Get all conversations for the logged-in user
export async function getConversations(req, res) {
  try {
    const userId = req.user._id || req.user.id;

    // Aggregate messages to find all conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $addFields: {
          normalizedConversationId: {
            $cond: [
              { $regexMatch: { input: '$conversationId', regex: '^conv_' } },
              { $arrayElemAt: [{ $split: ['$conversationId', 'conv_'] }, 1] },
              '$conversationId'
            ]
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$normalizedConversationId',
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          lastMessageId: { $first: '$_id' },
          sender: { $first: '$sender' },
          receiver: { $first: '$receiver' }
        }
      },
      {
        $sort: { lastMessageAt: -1 }
      }
    ]);

    // Get participant info for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Find the other user in the conversation
        const otherUserId = conv.sender.toString() === userId.toString() 
          ? conv.receiver 
          : conv.sender;

        const otherUser = await User.findById(otherUserId).select('name avatar role');

        const conversationIds = [conv._id, `conv_${conv._id}`];
        const unreadCount = await Message.countDocuments({
          conversationId: { $in: conversationIds },
          receiver: new mongoose.Types.ObjectId(userId),
          read: false
        });

        return {
          id: conv._id,
          participant: {
            id: otherUser?._id?.toString(),
            name: otherUser?.name || 'Unknown',
            avatar: otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`,
            role: otherUser?.role || 'user'
          },
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
          otherUserId: otherUserId.toString()
        };
      })
    );

    res.json(populatedConversations);
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json({ message: 'Failed to load conversations', error: error.message });
  }
}

// Get messages for a specific conversation
export async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id || req.user.id;

    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID required' });
    }

    const normalizedConversationId = normalizeConversationId(conversationId);
    const conversationIds = [normalizedConversationId, `conv_${normalizedConversationId}`];

    // Verify user is part of this conversation
    const hasAccess = await Message.exists({
      conversationId: { $in: conversationIds },
      $or: [
        { sender: new mongoose.Types.ObjectId(userId) },
        { receiver: new mongoose.Types.ObjectId(userId) }
      ]
    });

    if (!hasAccess) {
      // allow valid conversations that are newly created but have no messages yet
      const [id1, id2] = normalizedConversationId.split('_');
      const userIdString = userId.toString();
      if ([id1, id2].includes(userIdString)) {
        const otherUserId = id1 === userIdString ? id2 : id1;
        const otherUser = await User.findById(otherUserId).select('name avatar role');
        if (otherUser) {
          return res.json([]);
        }
      }
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    const messages = await Message.find({ conversationId: { $in: conversationIds } })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    // Mark messages as read
    await Message.updateMany(
      { conversationId: { $in: conversationIds }, receiver: new mongoose.Types.ObjectId(userId), read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ message: 'Failed to load messages', error: error.message });
  }
}

// Send a new message
export async function sendMessage(req, res) {
  try {
    const { conversationId, receiver, content } = req.body;
    const senderId = req.user._id || req.user.id;

    if (!receiver || !content?.trim()) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    const requestedConversationId = normalizeConversationId(conversationId);
    // Generate a canonical conversation ID if not provided
    const convId = requestedConversationId || [senderId.toString(), receiver.toString()].sort((a, b) => a.localeCompare(b)).join('_');

    const message = new Message({
      conversationId: convId,
      sender: senderId,
      receiver,
      content: content.trim(),
      read: false
    });

    await message.save();
    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      emitConversationMessage(io, convId, {
        _id: message._id,
        id: message._id.toString(),
        conversationId: convId,
        sender: message.sender,
        receiver: message.receiver,
        content: message.content,
        createdAt: message.createdAt,
        timestamp: message.createdAt,
        read: message.read,
      });

      // Notify receiver if not in conversation
      io.to(`user:${receiver}`).emit('notification', {
        type: 'new_message',
        title: 'New Message',
        message: `You have a new message from ${req.user.name}`,
        data: { conversationId: convId, senderId: senderId.toString() }
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
}

// Create or get conversation (for starting new chat)
export async function createConversation(req, res) {
  try {
    const { participantId } = req.body;
    const userId = req.user._id || req.user.id;

    const participant = await User.findById(participantId).select('name avatar role');
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    if (req.user.role === 'freelancer' && participant.role === 'freelancer') {
      return res.status(403).json({ message: 'Freelancers cannot start conversations with other freelancers' });
    }

    const conversationId = normalizeConversationId([userId.toString(), participantId.toString()].sort((a, b) => a.localeCompare(b)).join('_'));
    const conversationIdVariants = getConversationIdVariants(conversationId);

    // Check if conversation already exists
    const existingMessages = await Message.findOne({ conversationId: { $in: conversationIdVariants } });

    if (!existingMessages) {
      await Message.create({
        conversationId,
        sender: userId,
        receiver: participantId,
        content: 'Conversation started.',
        read: true,
      });
    }

    res.json({
      id: conversationId,
      participant: {
        id: participant._id.toString(),
        name: participant.name,
        avatar: participant.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantId}`,
        role: participant.role || 'user'
      },
      isNew: !existingMessages
    });
  } catch (error) {
    console.error('createConversation error:', error);
    res.status(500).json({ message: 'Failed to create conversation', error: error.message });
  }
}


// Utility: Get the other user ID in a conversation
export function getOtherUserId(conversationId, currentUserId) {
  const [id1, id2] = conversationId.split('_');
  return id1 === currentUserId.toString() ? id2 : id1;
}