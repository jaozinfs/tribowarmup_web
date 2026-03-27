import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { getSteamLoginUrl } from '../services/authService';
import { getLevelStyle } from '../utils/levelStyle';
import { trackVipClickBeneficios, trackVipClickPerformance, trackVipClickCriarWarmup, trackVipClickGiveaway } from '../utils/analytics';
import { Avatar } from './Avatar';
import './HamburgerNav.css';
import { TrackedButton } from './TrackedButton';

const NAV_ITEMS = [
  { to: '/', label: 'INÍCIO' },
  { to: '/servers', label: 'SERVIDORES' },
  { to: '/loadout', label: 'LOADOUT' },
  { label: 'MIX', submenu: 'mix' },
  { to: '/squad', label: 'SQUAD' },
  { to: '/ranking', label: 'RANKING' },
  { to: '/fantasy', label: 'FANTASY' },
  { label: 'VIP', submenu: 'vip' },
];

function MixDropdown({ activePath, onNavClose }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const isPug = activePath === '/pug' || location.pathname === '/pug';

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="nav-mix-dropdown" ref={ref}>
      <TrackedButton
        type="button"
        className={`nav-mix-trigger ${open ? 'nav-mix-trigger--open' : ''} ${isPug ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="nav-mix-label">MIX</span>
        <span className={`nav-mix-arrow${open ? ' nav-mix-arrow--open' : ''}`} aria-hidden>&#9662;</span>
      </TrackedButton>
      <div className={`nav-mix-menu${open ? ' nav-mix-menu--open' : ''}`}>
        <Link
          to="/pug"
          className="nav-mix-menu-item"
          onClick={() => { setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-mix-menu-icon">&#9918;</span>
          PUG
        </Link>
        <Link
          to="/pug?lobbyType=squad"
          className="nav-mix-menu-item"
          onClick={() => { setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-mix-menu-icon">&#128101;</span>
          SQUAD
        </Link>
        <Link
          to="/pug?lobbyType=snaphack"
          className="nav-mix-menu-item nav-mix-menu-item--snaphack"
          onClick={() => { setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-mix-menu-icon">&#9889;</span>
          SNAPHACK
        </Link>
        <Link
          to="/pug?lobbyType=snaparena"
          className="nav-mix-menu-item nav-mix-menu-item--snaparena"
          onClick={() => { setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-mix-menu-icon">&#128640;</span>
          SNAPARENA
        </Link>
      </div>
    </div>
  );
}

function VipDropdown({ activePath, onNavClose }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const isActive = activePath === '/vip' || location.pathname === '/vip' || location.pathname === '/performance' || location.pathname === '/giveaway' || location.pathname === '/inventory';

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="nav-mix-dropdown nav-vip-dropdown" ref={ref}>
      <TrackedButton
        type="button"
        className={`nav-mix-trigger nav-vip-trigger ${open ? 'nav-mix-trigger--open' : ''} ${isActive ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="nav-mix-label">VIP</span>
        <span className={`nav-mix-arrow${open ? ' nav-mix-arrow--open' : ''}`} aria-hidden>&#9662;</span>
      </TrackedButton>
      <div className={`nav-mix-menu nav-vip-menu${open ? ' nav-mix-menu--open' : ''}`}>
        <Link
          to="/vip"
          className="nav-mix-menu-item nav-vip-menu-item"
          onClick={() => { trackVipClickBeneficios(); setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-mix-menu-icon">&#128081;</span>
          Benefícios VIP
        </Link>
        <Link
          to="/performance"
          className="nav-mix-menu-item nav-vip-menu-item"
          onClick={() => { trackVipClickPerformance(); setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-mix-menu-icon">&#128200;</span>
          Performance
        </Link>
        <Link
          to="/servers"
          className="nav-mix-menu-item nav-vip-menu-item"
          onClick={() => { trackVipClickCriarWarmup(); setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-mix-menu-icon">&#128293;</span>
          Criar warmup
        </Link>
        <Link
          to="/giveaway"
          className="nav-mix-menu-item nav-vip-menu-item"
          onClick={() => { trackVipClickGiveaway(); setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-mix-menu-icon">&#127922;</span>
          Giveaway VIP
        </Link>
      </div>
    </div>
  );
}

function UserDropdown({ auth, profile, returnTo, onNavClose }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (auth?.loading) return <span className="auth-loading">...</span>;

  if (!auth?.steamId) {
    const loginUrl = getSteamLoginUrl(returnTo);
    return (
      <a href={loginUrl} className="auth-btn-login" target="_self" rel="noopener noreferrer">
        <span className="auth-steam-icon" />
        Entrar com Steam
      </a>
    );
  }

  const p = profile?.profile;
  const displayName = (p?.displayName && String(p.displayName).trim()) || 'Jogador';
  const level = Math.max(1, Math.min(100, parseInt(p?.level, 10) || 1));
  const levelStyle = getLevelStyle(level);

  return (
    <div className="nav-user-dropdown" ref={ref}>
      <TrackedButton
        type="button"
        className={`nav-user-trigger${open ? ' nav-user-trigger--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar avatarUrl={p?.avatarUrl} className="nav-user-avatar" />
        <span className="nav-user-level" style={{ backgroundColor: levelStyle.backgroundColor, color: levelStyle.color }}>{level}</span>
        <span className="nav-user-name">{displayName}</span>
        <span className={`nav-user-arrow${open ? ' nav-user-arrow--open' : ''}`}>&#9662;</span>
      </TrackedButton>
      <div className={`nav-user-menu${open ? ' nav-user-menu--open' : ''}`}>
        <TrackedButton
          type="button"
          className="nav-user-menu-item"
          onClick={() => { setOpen(false); onNavClose?.(); navigate('/profile'); }}
        >
          <span className="nav-user-menu-icon">&#128100;</span>
          Perfil
        </TrackedButton>
        <TrackedButton
          type="button"
          className="nav-user-menu-item"
          onClick={() => { setOpen(false); onNavClose?.(); navigate('/inventory'); }}
        >
          <span className="nav-user-menu-icon">&#127922;</span>
          Inventário
        </TrackedButton>
        <TrackedButton
          type="button"
          className="nav-user-menu-item"
          onClick={() => { setOpen(false); onNavClose?.(); navigate('/wallet'); }}
        >
          <span className="nav-user-menu-icon">&#128184;</span>
          Carteira
        </TrackedButton>
        <TrackedButton
          type="button"
          className="nav-user-menu-item"
          onClick={() => { setOpen(false); onNavClose?.(); navigate('/missions'); }}
        >
          <span className="nav-user-menu-icon">&#11088;</span>
          Missões
        </TrackedButton>
        <Link
          to="/privacidade"
          className="nav-user-menu-item nav-user-menu-item--link"
          onClick={() => { setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-user-menu-icon">&#128274;</span>
          Privacidade
        </Link>
        <Link
          to="/sobre"
          className="nav-user-menu-item nav-user-menu-item--link"
          onClick={() => { setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-user-menu-icon">&#8505;</span>
          Sobre nós
        </Link>
        <Link
          to="/contato"
          className="nav-user-menu-item nav-user-menu-item--link"
          onClick={() => { setOpen(false); onNavClose?.(); }}
        >
          <span className="nav-user-menu-icon">&#9993;</span>
          Contato
        </Link>
        <div className="nav-user-menu-sep" />
        <TrackedButton
          type="button"
          className="nav-user-menu-item nav-user-menu-item--logout"
          onClick={() => { setOpen(false); onNavClose?.(); auth?.logout(); }}
        >
          <span className="nav-user-menu-icon">&#8618;</span>
          Sair
        </TrackedButton>
      </div>
    </div>
  );
}

export function HamburgerNav({ activePath, auth, profile, returnTo, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="hamburger-nav-wrap">
      <TrackedButton
        type="button"
        className="hamburger-btn"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="hamburger-bar" />
        <span className="hamburger-bar" />
        <span className="hamburger-bar" />
      </TrackedButton>
      {open && (
        <div className="hamburger-backdrop" onClick={() => setOpen(false)} aria-hidden />
      )}
      <div className={`header-right hamburger-nav ${open ? 'hamburger-nav--open' : ''}`}>
        <nav className="nav-links">
          {NAV_ITEMS.map((item) =>
            item.submenu === 'mix'
              ? (
                <MixDropdown
                  key="mix"
                  activePath={activePath}
                  onNavClose={() => setOpen(false)}
                />
              )
              : item.submenu === 'vip'
                ? (
                  <VipDropdown
                    key="vip"
                    activePath={activePath}
                    onNavClose={() => setOpen(false)}
                  />
                )
                : (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`nav-link ${activePath === item.to ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
          )}
        </nav>
        {children && <div className="hamburger-nav-extra">{children}</div>}
        <span className="nav-auth">
          <UserDropdown auth={auth} profile={profile} returnTo={returnTo} onNavClose={() => setOpen(false)} />
        </span>
      </div>
    </div>
  );
}
