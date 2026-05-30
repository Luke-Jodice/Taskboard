import { Plus, Kanban, Sparkles, Shield } from 'lucide-react';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react';
import { useAdminRole } from '../hooks/useAdminRole';

interface HeaderProps {
  onNewIssue: () => void;
  onUpgrade: () => void;
  onAdminDashboard: () => void;
}

export default function Header({ onNewIssue, onUpgrade, onAdminDashboard }: HeaderProps) {
  const { isSignedIn } = useUser();
  const isAdmin = useAdminRole();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <Kanban size={22} className="text-blue-400" />
        <span className="text-lg font-bold text-white tracking-tight">TaskBoard</span>
      </div>

      <div className="flex items-center gap-2">
        {isSignedIn && isAdmin && (
          <button
            onClick={onAdminDashboard}
            className="flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-2 rounded-lg transition-colors"
          >
            <Shield size={14} />
            Admin
          </button>
        )}
        {isSignedIn ? (
          <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
        ) : (
          <>
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors">
                Sign up
              </button>
            </SignUpButton>
          </>
        )}
        <button
          onClick={onUpgrade}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all"
        >
          <Sparkles size={14} />
          Upgrade
        </button>
        <button
          onClick={onNewIssue}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Issue
        </button>
      </div>
    </header>
  );
}
