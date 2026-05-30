import { Tag } from 'lucide-react';
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
  onToggleProject: (project: string) => void;
  onTogglePriority: (priority: Priority) => void;
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

export default function FilterBar({
  projects,
  tags,
  selectedProjects,
  selectedPriorities,
  selectedTags,
  onToggleProject,
  onTogglePriority,
  onToggleTag,
  onClearAll,
}: FilterBarProps) {
  const hasFilters = selectedProjects.length > 0 || selectedPriorities.length > 0 || selectedTags.length > 0;

  return (
    <div className="flex items-center gap-x-5 gap-y-1.5 px-6 py-2 border-b border-gray-800 bg-gray-900/50 flex-shrink-0 flex-wrap">
      {projects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">Project</span>
          {projects.map((project) => (
            <button
              key={project}
              onClick={() => onToggleProject(project)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                selectedProjects.includes(project)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              {project}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">Priority</span>
        {PRIORITY_CONFIG.map((p) => (
          <button
            key={p.value}
            onClick={() => onTogglePriority(p.value)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
              selectedPriorities.includes(p.value) ? p.activeClass : p.inactiveClass + ' hover:opacity-80'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">Tags</span>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-violet-600 text-white'
                  : 'bg-violet-900/40 text-violet-300 hover:bg-violet-800/50'
              }`}
            >
              <Tag size={9} />
              {tag}
            </button>
          ))}
        </div>
      )}

      {hasFilters && (
        <button
          onClick={onClearAll}
          className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
