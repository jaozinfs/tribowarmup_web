import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../../index.css';

const tabs = [
  { path: '/admin/wheel', label: 'Roda' },
  { path: '/admin/giveaway', label: 'Giveaway' },
  { path: '/admin/points', label: 'Pontos e Fichas' },
  { path: '/admin/warmup-ranking', label: 'Ranking Warmup' },
  { path: '/admin/affiliates', label: 'Affiliates' },
  { path: '/admin/missions', label: 'Missões' },
  { path: '/admin/fantasy', label: 'Fantasy' },
  { path: '/admin/wallet', label: 'Wallet' },
  { path: '/admin/endpoints', label: 'Endpoints' },
];

export default function AdminTabs() {
  const location = useLocation();
  return (
    <nav className="admin-tabs" aria-label="Admin">
      <div className="admin-tabs-inner">
        {tabs.map(({ path, label }) => {
          const isActive = location.pathname === path || (path !== '/admin/wheel' && location.pathname.startsWith(path));
          return (
            <NavLink
              key={path}
              to={path}
              className={`admin-tabs-link${isActive ? ' admin-tabs-link--active' : ''}`}
            >
              {label}
            </NavLink>
          );
        })}
      </div>
      <style>{`
        .admin-tabs { border-bottom: 1px solid #334155; background: #0f172a; }
        .admin-tabs-inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; gap: 2px; }
        .admin-tabs-link {
          padding: 12px 18px;
          font-size: 0.9rem;
          color: #94a3b8;
          text-decoration: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.15s, border-color 0.15s;
        }
        .admin-tabs-link:hover { color: #e2e8f0; }
        .admin-tabs-link--active { color: #f59e0b; border-bottom-color: #f59e0b; }
      `}</style>
    </nav>
  );
}
