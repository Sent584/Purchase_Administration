import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Icon } from '../ui/Icon';
import { SasurieLogo } from '../brand/SasurieLogo';
import { navSections } from './nav';
import { useAuthStore } from '../../state/authStore';

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden" onClick={onClose} />}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-72 transform border-r border-ink-200 bg-white transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-ink-100 px-5">
          <SasurieLogo className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink-900">Sasurie ERP</p>
            <p className="text-[11px] text-ink-500">Group of Institutions</p>
          </div>
        </div>

        <nav className="flex flex-col gap-5 overflow-y-auto px-3 py-5" style={{ height: 'calc(100% - 4rem)' }}>
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.comingSoon || !item.permission || hasPermission(item.permission));
            if (visibleItems.length === 0) return null;
            return (
            <div key={section.title}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{section.title}</p>
              <div className="flex flex-col gap-0.5">
                {visibleItems.map((item) => {
                  if (item.comingSoon) {
                    return (
                      <div
                        key={item.label}
                        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-400"
                        title="Planned for a future build phase"
                      >
                        <Icon name={item.icon as never} className="h-5 w-5" />
                        <span className="flex-1">{item.label}</span>
                        <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">soon</span>
                      </div>
                    );
                  }
                  return (
                    <NavLink
                      key={item.label}
                      to={item.path!}
                      onClick={onClose}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive ? 'bg-crimson-50 text-crimson-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                        )
                      }
                      end={item.path === '/'}
                    >
                      <Icon name={item.icon as never} className="h-5 w-5" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
