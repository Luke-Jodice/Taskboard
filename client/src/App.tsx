import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/react';
import Header from './components/Header';
import Board from './components/Board';
import FilterBar from './components/FilterBar';
import IssueModal from './components/IssueModal';
import CheckoutModal from './components/CheckoutModal';
import AdminDashboard from './components/AdminDashboard';
import DashboardPage from './components/DashboardPage';
import type { Issue, Priority, Status } from './types';
import { getIssues, initAuth } from './api';
import { getProject } from './utils';

export default function App() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<'board' | 'dashboard'>('board');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [createDefaultStatus] = useState<Status>('todo');
  const [filterProjects, setFilterProjects] = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<Priority[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const allProjects = useMemo(() => {
    const seen = new Set<string>();
    for (const issue of issues) {
      for (const ref of issue.file_refs) {
        const p = getProject(ref);
        if (p) seen.add(p);
      }
    }
    return Array.from(seen).sort();
  }, [issues]);

  const allTags = useMemo(() => {
    const seen = new Set<string>();
    for (const issue of issues) {
      for (const tag of issue.tags ?? []) seen.add(tag);
    }
    return Array.from(seen).sort();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return issues.filter((issue) => {
      if (q && !issue.title.toLowerCase().includes(q) && !issue.description.toLowerCase().includes(q)) return false;
      if (filterPriorities.length > 0 && !filterPriorities.includes(issue.priority)) return false;
      if (filterProjects.length > 0) {
        const issueProjects = issue.file_refs
          .map(getProject)
          .filter((p): p is string => p !== null);
        if (!issueProjects.some((p) => filterProjects.includes(p))) return false;
      }
      if (filterTags.length > 0) {
        if (!filterTags.some((t) => issue.tags?.includes(t))) return false;
      }
      return true;
    });
  }, [issues, searchQuery, filterProjects, filterPriorities, filterTags]);

  const toggleProject = (project: string) =>
    setFilterProjects((prev) =>
      prev.includes(project) ? prev.filter((p) => p !== project) : [...prev, project]
    );

  const togglePriority = (priority: Priority) =>
    setFilterPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );

  const toggleTag = (tag: string) =>
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      initAuth(getToken);
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchIssues = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setIssues([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await getIssues();
      setIssues(data);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
      setError('Could not connect to the server. Make sure the backend is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleIssueCreated = (issue: Issue) => {
    setIssues((prev) => [...prev, issue]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      <Header
        currentPage={page}
        onPageChange={setPage}
        onNewIssue={() => setShowCreateModal(true)}
        onUpgrade={() => setShowCheckout(true)}
        onAdminDashboard={() => setShowAdminDashboard(true)}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {isLoaded && !isSignedIn ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Sign in to view your tasks.</p>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading board...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md text-center">
              <p className="text-red-400 font-medium mb-2">Connection Error</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <button
                onClick={fetchIssues}
                className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : page === 'dashboard' ? (
          <DashboardPage issues={issues} />
        ) : (
          <>
            <FilterBar
              projects={allProjects}
              tags={allTags}
              selectedProjects={filterProjects}
              selectedPriorities={filterPriorities}
              selectedTags={filterTags}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggleProject={toggleProject}
              onTogglePriority={togglePriority}
              onToggleTag={toggleTag}
              onClearAll={() => { setFilterProjects([]); setFilterPriorities([]); setFilterTags([]); setSearchQuery(''); }}
            />
            <div className="flex-1 overflow-hidden pt-4">
              <Board issues={filteredIssues} existingTags={allTags} onIssuesChange={setIssues} />
            </div>
          </>
        )}
      </main>

      {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} />}

      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}

      {showCreateModal && (
        <IssueModal
          defaultStatus={createDefaultStatus}
          existingTags={allTags}
          onClose={() => setShowCreateModal(false)}
          onSaved={handleIssueCreated}
        />
      )}
    </div>
  );
}
