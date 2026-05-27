import Message from '../models/Message.js';

export function buildConversationId(userIdA, userIdB) {
  const ids = [userIdA.toString(), userIdB.toString()].sort();
  return `conv_${ids[0]}_${ids[1]}`;
}

export async function getConversations(req, res) {
  try {
    const userId = req.user._id;
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    const convMap = new Map();

    for (const msg of messages) {
      if (convMap.has(msg.conversationId)) continue;
      const isSender = msg.sender._id.toString() === userId.toString();
      const participant = isSender ? msg.receiver : msg.sender;
      convMap.set(msg.conversationId, {
        id: msg.conversationId,
        participant: {
          id: participant._id,
          name: participant.name,
          avatar:
            participant.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`,
          online: false,
        },
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        unread: 0,
        otherUserId: participant._id,
      });
    }

    return res.json(Array.from(convMap.values()));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getMessages(req, res) {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function sendMessage(req, res) {
  try {
    const { conversationId, receiver, content, attachments } = req.body;
    let convId = conversationId;
    if (!convId && receiver) {
      convId = buildConversationId(req.user._id, receiver);
    }
    if (!convId) {
      return res.status(400).json({ message: 'conversationId or receiver is required' });
    }

    const message = await Message.create({
      conversationId: convId,
      sender: req.user._id,
      receiver,
      content,
      attachments,
    });

    const populated = await message.populate([
      { path: 'sender', select: 'name avatar' },
      { path: 'receiver', select: 'name avatar' },
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${convId}`).emit('new_message', {
        id: populated._id,
        conversationId: convId,
        sender: populated.sender,
        receiver: populated.receiver,
        content: populated.content,
        timestamp: populated.createdAt,
      });
    }

    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
