import { RequestHandler } from 'express';
import { getAuth } from '@clerk/express';

export const requireAdmin: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }
  if (auth.sessionClaims?.metadata?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: admin only' });
    return;
  }
  next();
};
