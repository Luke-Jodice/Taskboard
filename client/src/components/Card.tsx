import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Tag } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { Issue, Priority } from '../types';

interface CardProps {
  issue: Issue;
  onClick: (issue: Issue) => void;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-700 text-gray-300' },
  medium: { label: 'Medium', className: 'bg-blue-900/60 text-blue-300' },
  high: { label: 'High', className: 'bg-orange-900/60 text-orange-300' },
  urgent: { label: 'Urgent', className: 'bg-red-900/60 text-red-300' },
};

export default function Card({ issue, onClick }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
    data: { issue },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const priority = priorityConfig[issue.priority];

  // Truncate long file paths to just the last two segments
  const formatPath = (p: string) => {
    const parts = p.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length <= 2) return p;
    return '…/' + parts.slice(-2).join('/');
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layoutId={issue.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`bg-gray-800 rounded-lg p-3 border border-gray-700 cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'shadow-2xl ring-1 ring-blue-500 z-50' : 'hover:border-gray-600'
      }`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only open modal on click, not drag
        if (!isDragging) {
          e.stopPropagation();
          onClick(issue);
        }
      }}
    >
      {/* Priority badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.className}`}>
          {priority.label}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-white leading-snug mb-2">{issue.title}</p>

      {/* Description snippet */}
      {issue.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{issue.description}</p>
      )}

      {/* Tags */}
      {issue.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {issue.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs bg-violet-900/40 text-violet-300 border border-violet-700/40 px-2 py-0.5 rounded-full"
            >
              <Tag size={9} className="flex-shrink-0" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* File refs */}
      {issue.file_refs.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {issue.file_refs.map((ref, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs bg-gray-700/70 text-gray-400 px-2 py-0.5 rounded font-mono truncate max-w-[180px]"
              title={ref}
            >
              <FileText size={10} className="flex-shrink-0" />
              {formatPath(ref)}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
