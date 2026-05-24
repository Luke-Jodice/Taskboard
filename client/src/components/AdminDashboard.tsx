import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Users, LayoutList, Crown } from 'lucide-react';
import { getAdminDashboard, updateUserRole, DashboardData, UserSummary } from '../api';

interface Props {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleToggle = async (user: UserSummary) => {
    const newRole = user.role === 'admin' ? null : 'admin';
    setUpdatingId(user.id);
    try {
      const updated = await updateUserRole(user.id, newRole);
      setData(prev => {
        if (!prev) return prev;
        const updatedUsers = prev.users.map(u =>
          u.id === updated.id ? { ...u, role: updated.role } : u
        );
        return {
          ...prev,
          users: updatedUsers,
          adminCount: updatedUsers.filter(u => u.role === 'admin').length,
        };
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        />

        <motion.div
          className="relative z-10 w-full max-w-3xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', duration: 0.28, bounce: 0.15 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-violet-400" />
              <h2 className="text-white font-semibold text-base">Admin Dashboard</h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <StatCard icon={<Users size={16} />} label="Total Users" value={data.totalUsers} />
                  <StatCard icon={<LayoutList size={16} />} label="Total Issues" value={data.totalIssues} />
                  <StatCard icon={<Crown size={16} />} label="Admins" value={data.adminCount} />
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-800/50">
                        <th className="text-left px-4 py-2.5 text-gray-400 font-medium">User</th>
                        <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Issues</th>
                        <th className="text-left px-4 py-2.5 text-gray-400 font-medium">Role</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map(user => (
                        <tr key={user.id} className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">
                              {user.firstName || user.lastName
                                ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                                : '—'}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{user.issueCount}</td>
                          <td className="px-4 py-3">
                            {user.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 bg-violet-500/15 px-2 py-0.5 rounded-full">
                                <Crown size={10} /> admin
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">user</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRoleToggle(user)}
                              disabled={updatingId === user.id}
                              className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40
                                bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              {updatingId === user.id
                                ? '...'
                                : user.role === 'admin'
                                ? 'Demote'
                                : 'Make Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="text-violet-400">{icon}</div>
      <div>
        <p className="text-white font-semibold text-lg leading-none">{value}</p>
        <p className="text-gray-500 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}
