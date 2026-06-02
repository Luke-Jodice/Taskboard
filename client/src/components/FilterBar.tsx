import { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, Check, Tag, X } from 'lucide-react';
import type { Priority } from '../types';

const PRIORITY_CONFIG: { value: Priority; label: string; inactiveClass: string; activeClass: string }[] = [
  { value: 'low',    label: 'Low',    inactiveClass: 'bg-gray-700 text-gray-300',         activeClass: 'bg-gray-500 text-white' },
  { value: 'medium', label: 'Medium', inactiveClass: 'bg-blue-900/60 text-blue-300',      activeClass: 'bg-blue-600 text-white' },
  { value: 'high',   label: 'High',   inactiveClass: 'bg-orange-900/60 text-orange-300',  activeClass: 'bg-orange-600 text-white' },
  { value: 'urgent', label: 'Urgent', inactiveClass: 'bg-red-900/60 text-red-300',        activeClass: 'bg-red-600 text-white' },
];

interface FilterBarProps {
  projects: string[];
  tags: string[];
  selectedProjects: string[];
  selectedPriorities: Priority[];
  selectedTags: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleProject: (project: string) => void;
  onTogglePriority: (priority: Priority) => void;
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

type OpenDropdown = 'project' | 'tag' | null;

export default function FilterBar({
  projects,
  tags,
  selectedProjects,
  selectedPriorities,
  selectedTags,
  searchQuery,
  onSearchChange,
  onToggleProject,
  onTogglePriority,
  onToggleTag,
  onClearAll,
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasFilters =
    searchQuery.length > 0 ||
    selectedProjects.length > 0 ||
    selectedPriorities.length > 0 ||
    selectedTags.length > 0;

  const toggleDropdown = (name: OpenDropdown) =>
    setOpenDropdown((prev) => (prev === name ? null : name));

  return (
    <div ref={containerRef} className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-gray-900/50 flex-shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-64">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tasks…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-gray-800 text-sm text-gray-200 pl-8 pr-3 py-1.5 rounded-md border border-gray-700 focus:outline-none focus:border-gray-600 placeholder:text-gray-600"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="w-px h-4 bg-gray-700 flex-shrink-0" />

      {/* Priority pills */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {PRIORITY_CONFIG.map((p) => (
          <button
            key={p.value}
            onClick={() => onTogglePriority(p.value)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              selectedPriorities.includes(p.value) ? p.activeClass : p.inactiveClass + ' hover:opacity-80'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Projects dropdown */}
      {projects.length > 0 && (
        <>
          <div className="w-px h-4 bg-gray-700 flex-shrink-0" />
          <div className="relative flex-shrink-0">
            <button
              onClick={() => toggleDropdown('project')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                selectedProjects.length > 0
                  ? 'border-blue-500 text-blue-300 bg-blue-900/30'
                  : 'border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              Project
              {selectedProjects.length > 0 && (
                <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none">
                  {selectedProjects.length}
                </span>
              )}
              <ChevronDown size={11} className={`transition-transform ${openDropdown === 'project' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'project' && (
              <div className="absolute top-full left-0 mt-1.5 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[160px]">
                {projects.map((project) => (
                  <button
                    key={project}
                    onClick={() => onToggleProject(project)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left hover:bg-gray-700/70 transition-colors"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                        selectedProjects.includes(project) ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                      }`}
                    >
                      {selectedProjects.includes(project) && <Check size={9} className="text-white" />}
                    </span>
                    <span className={selectedProjects.includes(project) ? 'text-blue-300' : 'text-gray-300'}>
                      {project}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tags dropdown */}
      {tags.length > 0 && (
        <>
          <div className="w-px h-4 bg-gray-700 flex-shrink-0" />
          <div className="relative flex-shrink-0">
            <button
              onClick={() => toggleDropdown('tag')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                selectedTags.length > 0
                  ? 'border-violet-500 text-violet-300 bg-violet-900/30'
                  : 'border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              <Tag size={11} />
              Tags
              {selectedTags.length > 0 && (
                <span className="bg-violet-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none">
                  {selectedTags.length}
                </span>
              )}
              <ChevronDown size={11} className={`transition-transform ${openDropdown === 'tag' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'tag' && (
              <div className="absolute top-full left-0 mt-1.5 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[160px] max-h-56 overflow-y-auto">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left hover:bg-gray-700/70 transition-colors"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                        selectedTags.includes(tag) ? 'bg-violet-600 border-violet-600' : 'border-gray-600'
                      }`}
                    >
                      {selectedTags.includes(tag) && <Check size={9} className="text-white" />}
                    </span>
                    <span className={selectedTags.includes(tag) ? 'text-violet-300' : 'text-gray-300'}>
                      {tag}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={onClearAll}
          className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          Clear
        </button>
      )}
    </div>
  );
}
