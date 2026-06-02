import { useMemo } from 'react';
import { CheckCircle2, Clock, GitPullRequest, Circle, AlertTriangle, TrendingUp, Tag, FolderOpen } from 'lucide-react';
import type { Issue, Priority, Status } from '../types';
import { getProject } from '../utils';

interface Props {
  issues: Issue[];
}

const STATUS_CONFIG: { id: Status; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { id: 'todo',        label: 'To Do',       color: 'bg-gray-400',   bg: 'bg-gray-400/15', icon: <Circle size={14} /> },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-500',   bg: 'bg-blue-500/15', icon: <Clock size={14} /> },
  { id: 'in-review',   label: 'In Review',   color: 'bg-amber-500',  bg: 'bg-amber-500/15', icon: <GitPullRequest size={14} /> },
  { id: 'done',        label: 'Done',        color: 'bg-green-500',  bg: 'bg-green-500/15', icon: <CheckCircle2 size={14} /> },
];

const PRIORITY_CONFIG: { value: Priority; label: string; color: string; text: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500',    text: 'text-red-400' },
  { value: 'high',   label: 'High',   color: 'bg-orange-500', text: 'text-orange-400' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500',   text: 'text-blue-400' },
  { value: 'low',    label: 'Low',    color: 'bg-gray-500',   text: 'text-gray-400' },
];

function completionRingPath(pct: number, r = 36) {
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return { strokeDasharray: `${dash} ${circ}`, strokeDashoffset: 0 };
}

export default function DashboardPage({ issues }: Props) {
  const total = issues.length;

  const byStatus = useMemo(() =>
    STATUS_CONFIG.map((s) => ({ ...s, count: issues.filter((i) => i.status === s.id).length })),
    [issues]
  );

  const byPriority = useMemo(() =>
    PRIORITY_CONFIG.map((p) => ({ ...p, count: issues.filter((i) => i.priority === p.value).length })),
    [issues]
  );

  const doneCount = byStatus.find((s) => s.id === 'done')?.count ?? 0;
  const completionPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const issue of issues) {
      for (const tag of issue.tags ?? []) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [issues]);

  const maxPriorityCount = Math.max(...byPriority.map((p) => p.count), 1);

  const byProject = useMemo(() => {
    const map = new Map<string, { total: number; done: number; inProgress: number }>();
    for (const issue of issues) {
      const projects = issue.file_refs.map(getProject).filter((p): p is string => p !== null);
      const seen = new Set<string>();
      for (const project of projects) {
        if (seen.has(project)) continue;
        seen.add(project);
        const entry = map.get(project) ?? { total: 0, done: 0, inProgress: 0 };
        entry.total += 1;
        if (issue.status === 'done') entry.done += 1;
        if (issue.status === 'in-progress') entry.inProgress += 1;
        map.set(project, entry);
      }
    }
    return Array.from(map.entries())
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => b.total - a.total);
  }, [issues]);

  const maxProjectCount = Math.max(...byProject.map((p) => p.total), 1);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-950">
      <h1 className="text-white font-bold text-xl mb-6">Dashboard</h1>

      {total === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          No tasks yet — create some to see insights here.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Completion ring */}
          <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <svg width="88" height="88" className="-rotate-90">
                <circle cx="44" cy="44" r="36" fill="none" stroke="#1f2937" strokeWidth="8" />
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeLinecap="round"
                  style={completionRingPath(completionPct)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-xl leading-none">{completionPct}%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Completion</p>
              <p className="text-gray-500 text-xs mt-0.5">{doneCount} of {total} done</p>
            </div>
          </div>

          {/* Stat cards for each status */}
          {byStatus.map((s) => (
            <div key={s.id} className={`bg-gray-900 border border-gray-800 rounded-2xl p-5`}>
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${s.bg} ${s.color.replace('bg-', 'text-')}`}>
                {s.icon}
                {s.label}
              </div>
              <p className="text-white font-bold text-3xl mt-3 leading-none">{s.count}</p>
              <p className="text-gray-500 text-xs mt-1">
                {total > 0 ? `${Math.round((s.count / total) * 100)}% of total` : '—'}
              </p>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Status breakdown stacked bar */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-gray-400" />
              <h2 className="text-white font-semibold text-sm">Status Breakdown</h2>
            </div>
            <div className="flex rounded-full overflow-hidden h-3 mb-5">
              {byStatus.map((s) => (
                s.count > 0 && (
                  <div
                    key={s.id}
                    className={`${s.color} transition-all`}
                    style={{ width: `${(s.count / total) * 100}%` }}
                    title={`${s.label}: ${s.count}`}
                  />
                )
              ))}
            </div>
            <div className="space-y-2.5">
              {byStatus.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color} flex-shrink-0`} />
                  <span className="text-gray-400 text-xs w-24">{s.label}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                    <div
                      className={`${s.color} h-1.5 rounded-full transition-all`}
                      style={{ width: total > 0 ? `${(s.count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-gray-300 text-xs w-6 text-right font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={15} className="text-gray-400" />
              <h2 className="text-white font-semibold text-sm">Priority Distribution</h2>
            </div>
            <div className="space-y-3">
              {byPriority.map((p) => (
                <div key={p.value} className="flex items-center gap-3">
                  <span className={`text-xs font-medium w-14 ${p.text}`}>{p.label}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div
                      className={`${p.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(p.count / maxPriorityCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-300 text-xs w-6 text-right font-medium">{p.count}</span>
                </div>
              ))}
            </div>

            {/* Mini donut for priorities */}
            <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-center gap-5">
              {(() => {
                const r = 28;
                const circumference = 2 * Math.PI * r;
                let offset = 0;
                const segments = byPriority
                  .filter((p) => p.count > 0)
                  .map((p) => {
                    const pct = p.count / total;
                    const dash = pct * circumference;
                    const segment = { ...p, dash, offset, gap: circumference - dash };
                    offset += dash;
                    return segment;
                  });

                return (
                  <svg width="72" height="72" className="-rotate-90">
                    <circle cx="36" cy="36" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
                    {segments.map((seg) => (
                      <circle
                        key={seg.value}
                        cx="36" cy="36" r={r}
                        fill="none"
                        strokeWidth="10"
                        className={seg.color}
                        stroke="currentColor"
                        strokeDasharray={`${seg.dash} ${seg.gap}`}
                        strokeDashoffset={-seg.offset}
                      />
                    ))}
                  </svg>
                );
              })()}
              <div className="space-y-1.5">
                {byPriority.filter((p) => p.count > 0).map((p) => (
                  <div key={p.value} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${p.color}`} />
                    <span className="text-gray-400 text-xs">{p.label}</span>
                    <span className={`text-xs font-medium ${p.text} ml-1`}>
                      {Math.round((p.count / total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Projects */}
          {byProject.length > 0 && (
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen size={15} className="text-gray-400" />
                <h2 className="text-white font-semibold text-sm">Projects</h2>
                <span className="ml-auto text-xs text-gray-600">{byProject.length} project{byProject.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {byProject.map((p) => {
                  const donePct = p.total > 0 ? (p.done / p.total) * 100 : 0;
                  const inProgressPct = p.total > 0 ? (p.inProgress / p.total) * 100 : 0;
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 text-xs font-medium truncate max-w-[60%]">{p.name}</span>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                          {p.done > 0 && (
                            <span className="text-green-500">{p.done} done</span>
                          )}
                          {p.inProgress > 0 && (
                            <span className="text-blue-400">{p.inProgress} active</span>
                          )}
                          <span className="text-gray-400 font-medium">{p.total} total</span>
                        </div>
                      </div>
                      <div className="flex rounded-full overflow-hidden h-1.5 bg-gray-800">
                        <div
                          className="bg-green-500 h-full transition-all"
                          style={{ width: `${(p.total / maxProjectCount) * donePct}%` }}
                        />
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: `${(p.total / maxProjectCount) * inProgressPct}%` }}
                        />
                        <div
                          className="bg-gray-600 h-full transition-all"
                          style={{ width: `${(p.total / maxProjectCount) * (100 - donePct - inProgressPct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-800">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-gray-500 text-xs">Done</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-gray-500 text-xs">In Progress</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-600" /><span className="text-gray-500 text-xs">Remaining</span></div>
              </div>
            </div>
          )}

          {/* Tags */}
          {tagCounts.length > 0 && (
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={15} className="text-gray-400" />
                <h2 className="text-white font-semibold text-sm">Top Tags</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {tagCounts.map(([tag, count]) => {
                  const maxCount = tagCounts[0][1];
                  const opacity = 0.4 + (count / maxCount) * 0.6;
                  return (
                    <div
                      key={tag}
                      className="flex items-center gap-1.5 bg-violet-900/40 border border-violet-700/40 text-violet-300 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ opacity }}
                    >
                      <Tag size={10} />
                      {tag}
                      <span className="bg-violet-600/50 text-violet-200 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
