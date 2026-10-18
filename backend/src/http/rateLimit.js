// Tiny in-memory limiter so the grade route cannot be hammered.
export function rateLimit({ windowMs, max }) {
  const hits = new Map();

  return (req, res, next) => {
    const key = req.ip || 'local';
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);
    if (recent.length >= max) {
      res.status(429).json({ error: 'Too many grading requests. Please wait a moment.' });
      return;
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
