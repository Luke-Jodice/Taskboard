import { Router, Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Status } from '../types';

const router = Router();

function resolveUserId(req: Request): string | null {
  const localKey = process.env.LOCAL_API_KEY;
  if (localKey && req.headers.authorization === `Bearer ${localKey}`) {
    return process.env.LOCAL_USER_ID ?? null;
  }
  return getAuth(req).userId ?? null;
}

router.use((req, res, next) => {
  if (!resolveUserId(req)) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const issues = await db.all(userId!);
    res.json(issues);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { title, description = '', status = 'todo', priority = 'medium', file_refs = [], tags = [] } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const colIssues = (await db.all(userId!)).filter(i => i.status === status);
    const position = colIssues.length;

    const issue = await db.insert({
      id: uuidv4(),
      user_id: userId!,
      title: title.trim(),
      description,
      status: status as Status,
      priority,
      file_refs: Array.isArray(file_refs) ? file_refs : [],
      tags: Array.isArray(tags) ? tags : [],
      position,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.status(201).json(issue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { id } = req.params;
    const existing = await db.get(id, userId!);
    if (!existing) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const { title, description, status, priority, file_refs, tags } = req.body;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) patch.title = title.trim();
    if (description !== undefined) patch.description = description;
    if (status !== undefined) patch.status = status;
    if (priority !== undefined) patch.priority = priority;
    if (file_refs !== undefined) patch.file_refs = Array.isArray(file_refs) ? file_refs : [];
    if (tags !== undefined) patch.tags = Array.isArray(tags) ? tags : [];

    const updated = await db.update(id, userId!, patch as any);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { id } = req.params;
    if (!(await db.get(id, userId!))) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }
    await db.delete(id, userId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/move', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { id } = req.params;
    const { status, position } = req.body;

    const existing = await db.get(id, userId!);
    if (!existing) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const all = await db.all(userId!);
    const now = new Date().toISOString();

    if (existing.status === status) {
      const col = all.filter(i => i.status === status && i.id !== id)
        .sort((a, b) => a.position - b.position);
      col.splice(position, 0, { ...existing, status, position, updated_at: now });
      col.forEach((issue, idx) => { issue.position = idx; });
      const others = all.filter(i => i.status !== status);
      await db.saveForUser(userId!, [...others, ...col]);
    } else {
      const oldCol = all.filter(i => i.status === existing.status && i.id !== id)
        .sort((a, b) => a.position - b.position);
      oldCol.forEach((issue, idx) => { issue.position = idx; });

      const newCol = all.filter(i => i.status === status)
        .sort((a, b) => a.position - b.position);
      const moved = { ...existing, status: status as Status, position, updated_at: now };
      newCol.splice(position, 0, moved);
      newCol.forEach((issue, idx) => { issue.position = idx; });

      const rest = all.filter(i => i.status !== existing.status && i.status !== status);
      await db.saveForUser(userId!, [...rest, ...oldCol, ...newCol]);
    }

    res.json(await db.get(id, userId!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
