import axios from 'axios';
import type { Issue, Status, Priority } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

let _getToken: (() => Promise<string | null>) | null = null;

api.interceptors.request.use(async (config) => {
  if (_getToken) {
    const token = await _getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
  }
  return config;
});

export function initAuth(getToken: () => Promise<string | null>) {
  _getToken = getToken;
}

/** @deprecated Use initAuth instead */
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

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

export interface UserSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | null;
  issueCount: number;
  createdAt: string;
}

export interface DashboardData {
  users: UserSummary[];
  totalIssues: number;
  totalUsers: number;
  adminCount: number;
}

export async function getAdminDashboard(): Promise<DashboardData> {
  const res = await api.get<DashboardData>('/admin/dashboard');
  return res.data;
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | null
): Promise<{ id: string; email: string; role: 'admin' | null }> {
  const res = await api.patch(`/admin/users/${userId}/role`, { role });
  return res.data;
}
