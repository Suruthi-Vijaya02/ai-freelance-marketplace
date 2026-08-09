import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function optionalAuthMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();
    const token = header.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) return next();
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
  } catch {
    // Invalid token — continue without user
  }
  return next();
}
