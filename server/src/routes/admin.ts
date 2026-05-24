import { Router, Request, Response } from 'express';
import { requireAuth, getAuth, clerkClient } from '@clerk/express';
import { requireAdmin } from '../middleware/requireAdmin';
import { db } from '../db';
import { UserSummary } from '../types';

const router = Router();

router.use(requireAuth());
router.use(requireAdmin);

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const { data: users } = await clerkClient.users.getUserList({ limit: 100 });
    const allIssues = db.allIssues();

    const userSummaries: UserSummary[] = users.map(user => {
      const primaryEmail = user.emailAddresses.find(
        e => e.id === user.primaryEmailAddressId
      );
      return {
        id: user.id,
        email: primaryEmail?.emailAddress ?? '',
        firstName: user.firstName,
        lastName: user.lastName,
        role: (user.publicMetadata?.role as 'admin') ?? null,
        issueCount: allIssues.filter(i => i.user_id === user.id).length,
        createdAt: new Date(user.createdAt).toISOString(),
      };
    });

    res.json({
      users: userSummaries,
      totalIssues: allIssues.length,
      totalUsers: users.length,
      adminCount: userSummaries.filter(u => u.role === 'admin').length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:targetUserId/role', async (req: Request, res: Response) => {
  const { targetUserId } = req.params;
  const { role } = req.body;

  if (role !== 'admin' && role !== null) {
    res.status(400).json({ error: 'role must be "admin" or null' });
    return;
  }

  const { userId: requestingUserId } = getAuth(req);
  if (targetUserId === requestingUserId) {
    res.status(400).json({ error: 'Cannot change your own role' });
    return;
  }

  try {
    const updatedUser = await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role: role ?? undefined },
    });
    const primaryEmail = updatedUser.emailAddresses.find(
      e => e.id === updatedUser.primaryEmailAddressId
    );
    res.json({
      id: updatedUser.id,
      email: primaryEmail?.emailAddress ?? '',
      role: (updatedUser.publicMetadata?.role as 'admin') ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
