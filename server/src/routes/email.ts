import { Router, Request, Response } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { sendEmail } from '../services/email';

const router = Router();

router.use(requireAuth());

router.post('/test', async (req: Request, res: Response) => {
  const { userId } = getAuth(req);

  try {
    const data = await sendEmail({
      to: 'jodiceluke@gmail.com',
      subject: 'TaskBoard email test',
      html: `<p>Email sending is working. Triggered by user <strong>${userId}</strong>.</p>`,
    });

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
