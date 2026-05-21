import axios from 'axios';
import type { Issue, Status, Priority } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface CreateIssueData {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  file_refs?: string[];
  tags?: string[];
}

export interface UpdateIssueData {
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  file_refs?: string[];
  tags?: string[];
}

export async function getIssues(): Promise<Issue[]> {
  const res = await api.get<Issue[]>('/issues');
  return res.data;
}

export async function createIssue(data: CreateIssueData): Promise<Issue> {
  const res = await api.post<Issue>('/issues', data);
  return res.data;
}

export async function updateIssue(id: string, data: UpdateIssueData): Promise<Issue> {
  const res = await api.patch<Issue>(`/issues/${id}`, data);
  return res.data;
}

export async function deleteIssue(id: string): Promise<void> {
  await api.delete(`/issues/${id}`);
}

export async function moveIssue(id: string, status: Status, position: number): Promise<Issue> {
  const res = await api.patch<Issue>(`/issues/${id}/move`, { status, position });
  return res.data;
}

export interface FileResult {
  path: string;
  display: string;
  type: 'file' | 'directory';
}

export async function searchFiles(q: string): Promise<FileResult[]> {
  const res = await api.get<FileResult[]>('/files/search', { params: { q } });
  return res.data;
}
