import React from 'react';
import { Plus, Kanban } from 'lucide-react';

interface HeaderProps {
  onNewIssue: () => void;
}

export default function Header({ onNewIssue }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <Kanban size={22} className="text-blue-400" />
        <span className="text-lg font-bold text-white tracking-tight">TaskBoard</span>
      </div>

      <button
        onClick={onNewIssue}
        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <Plus size={16} />
        New Issue
      </button>
    </header>
  );
}
