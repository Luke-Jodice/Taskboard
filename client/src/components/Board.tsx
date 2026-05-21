import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import Column from './Column';
import IssueModal from './IssueModal';
import type { Issue, Status } from '../types';
import { moveIssue } from '../api';

interface BoardProps {
  issues: Issue[];
  existingTags: string[];
  onIssuesChange: (issues: Issue[]) => void;
}

const COLUMNS: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'in-review', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

export default function Board({ issues, existingTags, onIssuesChange }: BoardProps) {
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [addingToStatus, setAddingToStatus] = useState<Status | null>(null);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // require 6px drag before activating
      },
    })
  );

  const issuesForColumn = (status: Status) =>
    issues.filter((i) => i.status === status).sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    const dragged = issues.find((i) => i.id === event.active.id);
    setActiveIssue(dragged ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id as string;
    const targetColumnId = over.id as Status;

    const draggedIssue = issues.find((i) => i.id === draggedId);
    if (!draggedIssue) return;

    // Only the droppable columns have ids matching Status values
    const validStatuses: Status[] = ['todo', 'in-progress', 'in-review', 'done'];
    if (!validStatuses.includes(targetColumnId)) return;

    if (draggedIssue.status === targetColumnId) return; // no-op if same column

    // Determine new position: append at end of target column
    const targetColumnIssues = issuesForColumn(targetColumnId);
    const newPosition = targetColumnIssues.length;

    // Optimistic update
    const updatedIssues = issues.map((issue) => {
      if (issue.id === draggedId) {
        return { ...issue, status: targetColumnId, position: newPosition };
      }
      return issue;
    });
    onIssuesChange(updatedIssues);

    try {
      await moveIssue(draggedId, targetColumnId, newPosition);
    } catch (err) {
      console.error('Failed to move issue:', err);
      // Revert optimistic update on error
      onIssuesChange(issues);
    }
  };

  const handleIssueUpdated = (updated: Issue) => {
    onIssuesChange(issues.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleIssueCreated = (created: Issue) => {
    onIssuesChange([...issues, created]);
  };

  const handleIssueDeleted = (id: string) => {
    onIssuesChange(issues.filter((i) => i.id !== id));
  };

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 h-full overflow-x-auto pb-4 px-6">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              issues={issuesForColumn(col.id)}
              onCardClick={setEditingIssue}
              onAddCard={(status) => setAddingToStatus(status)}
            />
          ))}
        </div>

        {/* Drag overlay — ghost card */}
        <DragOverlay>
          {activeIssue && (
            <motion.div
              className="bg-gray-800 rounded-lg p-3 border border-blue-500 shadow-2xl w-72 opacity-90 cursor-grabbing"
              initial={{ scale: 1 }}
              animate={{ scale: 1.04 }}
            >
              <p className="text-sm font-medium text-white">{activeIssue.title}</p>
              {activeIssue.file_refs.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {activeIssue.file_refs.slice(0, 2).map((ref, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded font-mono"
                    >
                      <FileText size={10} />
                      {ref.split('/').slice(-1)[0]}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit modal */}
      {editingIssue && (
        <IssueModal
          issue={editingIssue}
          existingTags={existingTags}
          onClose={() => setEditingIssue(null)}
          onSaved={handleIssueUpdated}
          onDeleted={handleIssueDeleted}
        />
      )}

      {/* Create modal */}
      {addingToStatus && (
        <IssueModal
          defaultStatus={addingToStatus}
          existingTags={existingTags}
          onClose={() => setAddingToStatus(null)}
          onSaved={handleIssueCreated}
        />
      )}
    </>
  );
}
