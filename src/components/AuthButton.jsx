import { Link } from 'react-router-dom';
import { getSteamLoginUrl } from '../services/authService';
import { getLevelStyle } from '../utils/levelStyle';
import { Avatar } from './Avatar';
import './AuthButton.css';
import { TrackedButton } from './TrackedButton';

export function AuthButton({ steamId, loading, onLogin, onLogout, returnTo, profile, hideLogout }) {
  if (loading) {
    return <span className="auth-loading">...</span>;
  }
  if (steamId) {
    const displayName = (profile?.displayName && String(profile.displayName).trim()) || 'Jogador';
    const level = Math.max(1, Math.min(100, parseInt(profile?.level, 10) || 1));
    const levelStyle = getLevelStyle(level);
    const isVip = Boolean(profile?.isVip);
    return (
      <div className="auth-logged">
        <Link to="/profile" className="auth-profile-link" title="Ver perfil">
          <Avatar avatarUrl={profile?.avatarUrl} className="auth-avatar" />
          <span className="auth-level auth-level-circle" style={{ backgroundColor: levelStyle.backgroundColor, color: levelStyle.color }} title={`Level ${level}`}>{String(level)}</span>
          <span className={`auth-name ${isVip ? 'auth-name--vip' : ''}`}>{displayName}</span>
          {isVip && <span className="auth-vip-badge" title="VIP">VIP</span>}
        </Link>
        {!hideLogout && (
          <TrackedButton type="button" className="auth-btn-logout" onClick={onLogout}>
            Sair
          </TrackedButton>
        )}
      </div>
    );
  }
  const loginUrl = getSteamLoginUrl(returnTo);
  if (typeof window !== 'undefined') console.log('[AuthButton] Login Steam URL:', loginUrl);

  return (
    <a
      href={loginUrl}
      className="auth-btn-login"
      target="_self"
      rel="noopener noreferrer"
    >
      <span className="auth-steam-icon" />
      Entrar com Steam
    </a>
  );
}
