import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

export default function Sidebar({ links, title }) {
  return (
    <aside className="w-64 shrink-0 bg-white/45 backdrop-blur-[16px] border-r border-[rgba(206,200,232,0.6)] min-h-[calc(100vh-[72px])] hidden lg:block">
      {title && (
        <div className="p-6 pb-2">
          <h2 className="font-display font-bold text-mid text-[11px] uppercase tracking-[0.12em] mb-4">{title}</h2>
        </div>
      )}
      <nav className="px-4 py-2 space-y-1">
        {links.map((link) => (
          <motion.div key={link.to} whileHover={{ x: 3 }}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors font-body border-l-[3px]',
                  isActive
                    ? 'text-btn-blue bg-[rgba(61,71,212,0.12)] border-btn-blue'
                    : 'text-mid hover:text-black hover:bg-white/40 border-transparent'
                )
              }
            >
              <link.icon className="w-5 h-5 shrink-0" />
              {link.label}
              {link.badge != null && (
                <span className="ml-auto text-[10px] font-bold bg-[rgba(61,71,212,0.12)] text-btn-blue px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>
    </aside>
  );
}
