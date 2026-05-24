export type Status = 'todo' | 'in-progress' | 'in-review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

declare global {
  interface CustomJwtSessionClaims {
    metadata?: { role?: 'admin'; [key: string]: unknown };
  }
}

export interface UserSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | null;
  issueCount: number;
  createdAt: string;
}

export interface Issue {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  file_refs: string[];
  tags: string[];
  position: number;
  created_at: string;
  updated_at: string;
}
