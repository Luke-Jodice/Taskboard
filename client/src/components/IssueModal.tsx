import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Folder, FileText, Search, Tag } from 'lucide-react';
import type { Issue, Status, Priority } from '../types';
import { createIssue, updateIssue, deleteIssue, searchFiles, FileResult } from '../api';

// ─── Sub-components ──────────────────────────────────────────────────────────

function TagPicker({ value, onChange, suggestions }: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s))
    .slice(0, 8);

  const add = (tag: string) => {
    const trimmed = tag.trim().toLowerCase().replace(/,/g, '');
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tags</label>
      <div
        className="flex flex-wrap gap-1.5 min-h-[40px] bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2 focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/40 transition-colors cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-violet-900/50 text-violet-300 border border-violet-700/50 text-xs rounded-lg px-2 py-0.5">
            <Tag size={9} className="shrink-0" />
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(value.filter((t) => t !== tag)); }}
              className="ml-0.5 text-violet-400 hover:text-white transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={value.length === 0 ? 'Add tags…' : ''}
            className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none py-0.5"
          />
          <AnimatePresence>
            {open && (input.trim() || filtered.length > 0) && (
              <motion.ul
                className="absolute z-20 left-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.1 }}
              >
                {input.trim() && !value.includes(input.trim().toLowerCase()) && (
                  <li>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); add(input); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                    >
                      <Tag size={12} className="text-violet-400 shrink-0" />
                      <span>Create <span className="text-violet-300 font-medium">"{input.trim().toLowerCase()}"</span></span>
                    </button>
                  </li>
                )}
                {filtered.map((tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); add(tag); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                    >
                      <Tag size={12} className="text-violet-400 shrink-0" />
                      {tag}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-1.5">Press Enter or comma to add</p>
    </div>
  );
}

function FileRefPicker({ value, onChange }: { value: string[]; onChange: (refs: string[]) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const data = await searchFiles(q);
      setResults(data);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 200);
  };

  const select = (result: FileResult) => {
    if (!value.includes(result.path)) onChange([...value, result.path]);
    setQuery(''); setResults([]); setOpen(false);
    inputRef.current?.focus();
  };

  const displayName = (ref: string) => {
    const parts = ref.split('/').filter(Boolean);
    if (parts.length <= 2) return parts.join(' › ');
    return parts.slice(-2).join(' › ');
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        File / Folder References
      </label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map(ref => (
            <span key={ref} title={ref} className="inline-flex items-center gap-1 bg-gray-700/80 border border-gray-600/80 text-gray-200 text-xs rounded-lg px-2 py-1 max-w-full">
              {ref.endsWith('/') || !ref.includes('.') ? (
                <Folder size={11} className="text-blue-400 shrink-0" />
              ) : (
                <FileText size={11} className="text-gray-400 shrink-0" />
              )}
              <span className="truncate max-w-[220px]">{displayName(ref)}</span>
              <button type="button" onClick={() => onChange(value.filter(r => r !== ref))} className="ml-0.5 text-gray-400 hover:text-white transition-colors shrink-0">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search files or folders in ~/Code…"
          className="w-full bg-gray-800/60 border border-gray-700 rounded-xl pl-8 pr-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/40 transition-colors text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}
        <AnimatePresence>
          {open && results.length > 0 && (
            <motion.div
              className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
            >
              <ul className="max-h-52 overflow-y-auto">
                {results.map(result => {
                  const already = value.includes(result.path);
                  const parts = result.display.split(' › ');
                  const project = parts[0];
                  const rest = parts.slice(1).join(' › ');
                  return (
                    <li key={result.path}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); select(result); }}
                        disabled={already}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${already ? 'text-gray-500 cursor-default' : 'text-gray-200 hover:bg-gray-700 cursor-pointer'}`}
                      >
                        {result.type === 'directory' ? <Folder size={13} className="text-blue-400 shrink-0" /> : <FileText size={13} className="text-gray-400 shrink-0" />}
                        <span className="truncate">
                          <span className="text-blue-300 font-medium">{project}</span>
                          {rest && <span className="text-gray-400"> › {rest}</span>}
                        </span>
                        {already && <span className="ml-auto text-xs text-gray-600 shrink-0">added</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
          {open && !loading && query.length >= 2 && results.length === 0 && (
            <motion.div
              className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl px-3 py-3 text-sm text-gray-500"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
            >
              No matches found in ~/Code
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

interface SegOption<T extends string> {
  value: T;
  label: string;
  dot: string;
  activeBg: string;
  activeText: string;
}

const STATUS_OPTIONS: SegOption<Status>[] = [
  { value: 'todo',        label: 'To Do',       dot: 'bg-gray-400',   activeBg: 'bg-gray-700',    activeText: 'text-white' },
  { value: 'in-progress', label: 'In Progress', dot: 'bg-blue-400',   activeBg: 'bg-blue-950',    activeText: 'text-blue-200' },
  { value: 'in-review',   label: 'In Review',   dot: 'bg-amber-400',  activeBg: 'bg-amber-950',   activeText: 'text-amber-200' },
  { value: 'done',        label: 'Done',        dot: 'bg-green-400',  activeBg: 'bg-green-950',   activeText: 'text-green-200' },
];

const PRIORITY_OPTIONS: SegOption<Priority>[] = [
  { value: 'low',    label: 'Low',    dot: 'bg-gray-400',   activeBg: 'bg-gray-700',    activeText: 'text-white' },
  { value: 'medium', label: 'Medium', dot: 'bg-blue-400',   activeBg: 'bg-blue-950',    activeText: 'text-blue-200' },
  { value: 'high',   label: 'High',   dot: 'bg-orange-400', activeBg: 'bg-orange-950',  activeText: 'text-orange-200' },
  { value: 'urgent', label: 'Urgent', dot: 'bg-red-400',    activeBg: 'bg-red-950',     activeText: 'text-red-200' },
];

function SegmentedControl<T extends string>({ id, options, value, onChange }: {
  id: string;
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-gray-800/50 border border-gray-700/80 rounded-xl p-1 gap-0.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium"
          >
            {active && (
              <motion.div
                layoutId={`seg-${id}`}
                className={`absolute inset-0 rounded-lg ${opt.activeBg}`}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 w-1.5 h-1.5 rounded-full shrink-0 ${opt.dot}`} />
            <span className={`relative z-10 transition-colors ${active ? opt.activeText : 'text-gray-500'}`}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type Tab = 'details' | 'context';
const TABS: { id: Tab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'context', label: 'Context' },
];
const TAB_INDEX: Record<Tab, number> = { details: 0, context: 1 };

// ─── Modal ────────────────────────────────────────────────────────────────────

interface IssueModalProps {
  issue?: Issue | null;
  defaultStatus?: Status;
  existingTags?: string[];
  onClose: () => void;
  onSaved: (issue: Issue) => void;
  onDeleted?: (id: string) => void;
}

export default function IssueModal({ issue, defaultStatus = 'todo', existingTags = [], onClose, onSaved, onDeleted }: IssueModalProps) {
  const isEditing = !!issue;

  const [title, setTitle] = useState(issue?.title ?? '');
  const [description, setDescription] = useState(issue?.description ?? '');
  const [status, setStatus] = useState<Status>(issue?.status ?? defaultStatus);
  const [priority, setPriority] = useState<Priority>(issue?.priority ?? 'medium');
  const [fileRefs, setFileRefs] = useState<string[]>(issue?.file_refs ?? []);
  const [tags, setTags] = useState<string[]>(issue?.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [slideDir, setSlideDir] = useState(1);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const goToTab = (tab: Tab) => {
    setSlideDir(TAB_INDEX[tab] > TAB_INDEX[activeTab] ? 1 : -1);
    setActiveTab(tab);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = { title, description, status, priority, file_refs: fileRefs, tags };
      const saved = isEditing && issue
        ? await updateIssue(issue.id, payload)
        : await createIssue(payload);
      onSaved(saved);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!issue || !onDeleted) return;
    setSaving(true);
    try {
      await deleteIssue(issue.id);
      onDeleted(issue.id);
      onClose();
    } catch {
      setError('Failed to delete issue.');
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        />

        <motion.div
          className="relative z-10 w-full max-w-xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700/60 overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', duration: 0.28, bounce: 0.15 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
              autoFocus
              className="flex-1 bg-transparent text-xl font-semibold text-white placeholder-gray-600 outline-none leading-tight mr-3"
            />
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors rounded-lg p-1 hover:bg-gray-800 shrink-0 mt-0.5">
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 border-b border-gray-800">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => goToTab(tab.id)}
                className={`relative py-2.5 mr-6 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content + footer wrapped in one form so Save is always inside it */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Scrollable tab content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === 'details' ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: slideDir * -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir * 24 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="px-6 py-5 space-y-5"
                  >
                    {error && (
                      <div className="text-red-400 text-sm bg-red-950/50 border border-red-800/60 rounded-xl px-3 py-2">
                        {error}
                      </div>
                    )}

                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description…"
                      rows={3}
                      className="w-full bg-gray-800/50 border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-colors resize-none"
                    />

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
                      <SegmentedControl id="status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Priority</p>
                      <SegmentedControl id="priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="context"
                    initial={{ opacity: 0, x: slideDir * -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir * 24 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="px-6 py-5 space-y-5"
                  >
                    <FileRefPicker value={fileRefs} onChange={setFileRefs} />
                    <TagPicker value={tags} onChange={setTags} suggestions={existingTags} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 shrink-0">
              {isEditing && onDeleted ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-400">Delete this issue?</span>
                    <button type="button" onClick={handleDelete} disabled={saving} className="text-sm bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      Delete
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400 hover:text-white px-2 py-1.5 transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                    Delete
                  </button>
                )
              ) : <div />}

              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Issue'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
