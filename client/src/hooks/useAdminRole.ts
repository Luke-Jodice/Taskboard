import { useUser } from '@clerk/react';

export function useAdminRole(): boolean {
  const { user } = useUser();
  return (user?.publicMetadata as { role?: string } | undefined)?.role === 'admin';
}
