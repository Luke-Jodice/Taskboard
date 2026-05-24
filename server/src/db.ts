import fs from 'fs';
import path from 'path';
import { Issue } from './types';

const DATA_DIR = path.join(process.env.HOME || '', '.taskboard');
const DB_FILE = path.join(DATA_DIR, 'issues.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function load(): Issue[] {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function save(issues: Issue[]): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(issues, null, 2));
}

export const db = {
  all(userId: string): Issue[] {
    return load().filter(i => i.user_id === userId);
  },

  get(id: string, userId: string): Issue | undefined {
    return load().find(i => i.id === id && i.user_id === userId);
  },

  insert(issue: Issue): Issue {
    const issues = load();
    issues.push(issue);
    save(issues);
    return issue;
  },

  update(id: string, userId: string, patch: Partial<Issue>): Issue | undefined {
    const issues = load();
    const idx = issues.findIndex(i => i.id === id && i.user_id === userId);
    if (idx === -1) return undefined;
    issues[idx] = { ...issues[idx], ...patch };
    save(issues);
    return issues[idx];
  },

  delete(id: string, userId: string): boolean {
    const issues = load();
    const idx = issues.findIndex(i => i.id === id && i.user_id === userId);
    if (idx === -1) return false;
    issues.splice(idx, 1);
    save(issues);
    return true;
  },

  saveForUser(userId: string, userIssues: Issue[]): void {
    const others = load().filter(i => i.user_id !== userId);
    save([...others, ...userIssues]);
  },

  allIssues(): Issue[] {
    return load();
  },
};
