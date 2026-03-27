import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HamburgerNav } from '../components/HamburgerNav';
import { PlayerDetailsCard } from '../components/PlayerDetailsCard';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { getApiBaseUrl } from '../utils/apiBase';
import '../index.css';

export default function PublicProfilePage() {
  const { steamId } = useParams();
  const auth = useAuth();
  const profile = useProfile();
  const [publicProfile, setPublicProfile] = useState(null);
  const [loading, setLoading] = useState(!!steamId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!steamId?.trim()) {
      setLoading(false);
      setError('Perfil não encontrado');
      return;
    }
    const sid = steamId.trim();
    setLoading(true);
    setError(null);
    fetch(`${getApiBaseUrl()}/api/profile/${encodeURIComponent(sid)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setPublicProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar perfil');
        setLoading(false);
      });
  }, [steamId]);

  return (
    <div className="app">
      <div className="scanlines" />
      <div className="grid-bg" />
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">PERFIL PÚBLICO</div>
            <div className="header-sub">COMPARTILHADO</div>
          </div>
        </div>
        <HamburgerNav activePath="/profile" auth={auth} profile={profile} returnTo="/" />
      </header>
      <main className="profile-main public-profile-main">
        {loading && <div className="profile-loading"><span className="spinner" /> Carregando perfil...</div>}
        {error && !loading && <div className="profile-error">{error}</div>}
        {publicProfile && !loading && (
          <PlayerDetailsCard steamId={publicProfile.steamId} profile={publicProfile} />
        )}
      </main>
      <style>{`
        .public-profile-main { padding: 40px 24px; display: flex; flex-direction: column; align-items: center; }
        .profile-loading { display: flex; align-items: center; gap: 12px; color: var(--text-dim); }
        .profile-error { color: var(--red); padding: 20px; }
      `}</style>
    </div>
  );
}
