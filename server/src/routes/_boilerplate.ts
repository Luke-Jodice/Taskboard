import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json([]);
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ id });
});

router.post('/', (req: Request, res: Response) => {
  const body = req.body;
  res.status(201).json(body);
});

router.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ id, ...req.body });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ id, deleted: true });
});

export default router;
