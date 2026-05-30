import { createClient } from '@supabase/supabase-js';
import { Issue } from './types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const db = {
  async all(userId: string): Promise<Issue[]> {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('user_id', userId)
      .order('status')
      .order('position');
    if (error) throw error;
    return (data ?? []) as Issue[];
  },

  async get(id: string, userId: string): Promise<Issue | undefined> {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error) return undefined;
    return data as Issue;
  },

  async insert(issue: Issue): Promise<Issue> {
    const { data, error } = await supabase
      .from('issues')
      .insert(issue)
      .select()
      .single();
    if (error) throw error;
    return data as Issue;
  },

  async update(id: string, userId: string, patch: Partial<Issue>): Promise<Issue | undefined> {
    const { data, error } = await supabase
      .from('issues')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) return undefined;
    return data as Issue;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  },

  async saveForUser(userId: string, userIssues: Issue[]): Promise<void> {
    const { error: delError } = await supabase
      .from('issues')
      .delete()
      .eq('user_id', userId);
    if (delError) throw delError;
    if (userIssues.length > 0) {
      const { error: insError } = await supabase
        .from('issues')
        .insert(userIssues);
      if (insError) throw insError;
    }
  },

  async allIssues(): Promise<Issue[]> {
    const { data, error } = await supabase
      .from('issues')
      .select('*');
    if (error) throw error;
    return (data ?? []) as Issue[];
  },
};
