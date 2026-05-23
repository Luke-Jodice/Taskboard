import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import issuesRouter from './routes/issues';
import filesRouter from './routes/files';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/issues', issuesRouter);
app.use('/api/files', filesRouter);

app.listen(PORT, () => {
  console.log(`TaskBoard server running on http://localhost:${PORT}`);
});
