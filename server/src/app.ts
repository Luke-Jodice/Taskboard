import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import issuesRouter from './routes/issues';
import filesRouter from './routes/files';
import emailRouter from './routes/email';
import adminRouter from './routes/admin';

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/issues', issuesRouter);
app.use('/api/files', filesRouter);
app.use('/api/email', emailRouter);
app.use('/api/admin', adminRouter);

export default app;
