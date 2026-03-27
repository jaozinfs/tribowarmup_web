import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { HamburgerNav } from '../../components/HamburgerNav';
import './FantasyShared.css';

export default function FantasyLayout() {
  const auth = useAuth();
  const profile = useProfile();

  return (
    <div className="fantasy-shell">
      <header className="header home-header fantasy-header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">SnapFantasy CS2</div>
          </div>
        </div>
        <HamburgerNav activePath="/fantasy" auth={auth} profile={profile} returnTo="/fantasy" />
      </header>

      <main className="fantasy-main-wrap">
        <section className="fantasy-top-nav">
          <NavLink to="/fantasy" end className={({ isActive }) => `fantasy-tab ${isActive ? 'active' : ''}`}>Fantasy Home</NavLink>
          <NavLink to="/fantasy/time" className={({ isActive }) => `fantasy-tab ${isActive ? 'active' : ''}`}>Meu Time</NavLink>
          <NavLink to="/fantasy/ranking" className={({ isActive }) => `fantasy-tab ${isActive ? 'active' : ''}`}>Ranking</NavLink>
        </section>
        <Outlet />
      </main>
    </div>
  );
}

