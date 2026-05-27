const requestCounts = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

export function fraudDetectionMiddleware(req, res, next) {
  const key = req.user?.id?.toString() || req.ip;
  const now = Date.now();
  const entry = requestCounts.get(key) || { count: 0, start: now };

  if (now - entry.start > WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count += 1;
  requestCounts.set(key, entry);

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Suspicious activity detected — rate limit exceeded',
      fraudAlert: true,
    });
  }

  if (req.body?.price && req.body.price < 0) {
    return res.status(400).json({
      message: 'Invalid transaction amount',
      fraudAlert: true,
    });
  }

  return next();
}
