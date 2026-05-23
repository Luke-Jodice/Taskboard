export type Status = 'todo' | 'in-progress' | 'in-review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

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
