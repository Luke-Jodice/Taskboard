import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import Card from './Card';
import type { Issue, Status } from '../types';

interface ColumnProps {
  id: Status;
  label: string;
  issues: Issue[];
  onCardClick: (issue: Issue) => void;
  onAddCard: (status: Status) => void;
}

const columnAccentColors: Record<Status, string> = {
  todo: 'bg-gray-500',
  'in-progress': 'bg-blue-500',
  'in-review': 'bg-purple-500',
  done: 'bg-green-500',
};

export default function Column({ id, label, issues, onCardClick, onAddCard }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-72 flex-shrink-0 bg-gray-900 rounded-xl border border-gray-800">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${columnAccentColors[id]}`} />
          <h3 className="text-sm font-semibold text-gray-200">{label}</h3>
          <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full font-medium">
            {issues.length}
          </span>
        </div>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-2 overflow-y-auto min-h-[120px] transition-colors duration-150 ${
          isOver ? 'bg-gray-800/50' : ''
        }`}
      >
        <AnimatePresence mode="popLayout">
          {issues.map((issue) => (
            <Card key={issue.id} issue={issue} onClick={onCardClick} />
          ))}
        </AnimatePresence>

        {issues.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 border border-dashed border-gray-700 rounded-lg">
            <p className="text-xs text-gray-600">Drop cards here</p>
          </div>
        )}
      </div>

      {/* Add card button */}
      <div className="px-3 pb-3">
        <button
          onClick={() => onAddCard(id)}
          className="flex items-center gap-1.5 w-full text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add card
        </button>
      </div>
    </div>
  );
}
