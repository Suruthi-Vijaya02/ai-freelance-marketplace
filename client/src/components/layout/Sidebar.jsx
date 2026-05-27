import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/helpers';

export default function Sidebar({ links, title }) {
  return (
    <aside className="w-64 shrink-0 bg-card border-r border-border min-h-[calc(100vh-4rem)] hidden lg:block">
      {title && (
        <div className="p-5 border-b border-border">
          <h2 className="font-bold text-text text-sm uppercase tracking-wider">{title}</h2>
        </div>
      )}
      <nav className="p-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-muted hover:text-text hover:bg-surface'
              )
            }
          >
            <link.icon className="w-5 h-5 shrink-0" />
            {link.label}
            {link.badge != null && (
              <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
