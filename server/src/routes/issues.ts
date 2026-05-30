import { Router, Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Status } from '../types';

const router = Router();

router.use((req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

router.get('/', (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  const issues = db.all(userId!).sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    return a.position - b.position;
  });
  res.json(issues);
});

router.post('/', (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  const { title, description = '', status = 'todo', priority = 'medium', file_refs = [], tags = [] } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const colIssues = db.all(userId!).filter(i => i.status === status);
  const position = colIssues.length;

  const issue = db.insert({
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
});

router.patch('/:id', (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  const { id } = req.params;
  const existing = db.get(id, userId!);
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

  const updated = db.update(id, userId!, patch as any);
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  const { id } = req.params;
  if (!db.get(id, userId!)) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }
  db.delete(id, userId!);
  res.json({ success: true });
});

router.patch('/:id/move', (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  const { id } = req.params;
  const { status, position } = req.body;

  const existing = db.get(id, userId!);
  if (!existing) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }

  const all = db.all(userId!);
  const now = new Date().toISOString();

  if (existing.status === status) {
    const col = all.filter(i => i.status === status && i.id !== id)
      .sort((a, b) => a.position - b.position);
    col.splice(position, 0, { ...existing, status, position, updated_at: now });
    col.forEach((issue, idx) => { issue.position = idx; });
    const others = all.filter(i => i.status !== status);
    db.saveForUser(userId!, [...others, ...col]);
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
    db.saveForUser(userId!, [...rest, ...oldCol, ...newCol]);
  }

  res.json(db.get(id, userId!));
});

export default router;
