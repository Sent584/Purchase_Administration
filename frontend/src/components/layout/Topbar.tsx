import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { useAuthStore } from '../../state/authStore';
import { authApi } from '../../lib/authApi';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // best-effort: proceed with local logout regardless
      }
    }
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Icon name="menu" />
      </button>

      <div className="flex-1" />

      <button className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100" aria-label="Notifications">
        <Icon name="bell" className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-crimson-600" />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crimson-100 text-xs font-semibold text-crimson-700">
            {initials(user?.full_name ?? 'U')}
          </div>
          <div className="hidden text-left leading-tight sm:block">
            <p className="text-sm font-medium text-ink-900">{user?.full_name}</p>
            <p className="text-xs text-ink-500">{user?.role_codes.join(', ')}</p>
          </div>
          <Icon name="chevronDown" className="h-4 w-4 text-ink-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-ink-200 bg-white p-1.5 shadow-lg">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-ink-900">{user?.email}</p>
                <p className="text-xs text-ink-500">{user?.institution_id ? 'Institution scoped' : 'Group scoped'}</p>
              </div>
              <div className="my-1 border-t border-ink-100" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
              >
                <Icon name="logout" className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
