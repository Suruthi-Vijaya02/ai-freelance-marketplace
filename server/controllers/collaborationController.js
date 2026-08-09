import CollaborationSession from '../models/CollaborationSession.js';

export async function getSession(req, res) {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ message: 'roomId is required' });
    }

    let session = await CollaborationSession.findOne({ roomId });
    if (!session) {
      session = await CollaborationSession.create({
        roomId,
        code: `// Real-Time Coding Session: ${roomId}\n\nfunction helloWorld() {\n  console.log("Welcome to Antigravity's editor!");\n}\n`,
        language: 'javascript',
      });
    }

    return res.json(session);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function saveSession(req, res) {
  try {
    const { roomId } = req.params;
    const { code, language } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: 'roomId is required' });
    }

    const session = await CollaborationSession.findOneAndUpdate(
      { roomId },
      { code, language },
      { new: true, upsert: true }
    );

    return res.json({ message: 'Session saved successfully', session });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
