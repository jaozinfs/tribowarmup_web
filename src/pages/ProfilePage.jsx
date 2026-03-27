import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { AuthButton } from '../components/AuthButton';
import { Avatar } from '../components/Avatar';
import { HamburgerNav } from '../components/HamburgerNav';
import { PlayerDetailsCard } from '../components/PlayerDetailsCard';
import { getLevelStyle } from '../utils/levelStyle';
import { getProfileAffiliates, saveMarketingContact } from '../services/profileService';
import ContactProfileModal from '../components/ContactProfileModal';
import '../index.css';
import { TrackedButton } from '../components/TrackedButton';

const FIRE_COLORS = ['#ff4500', '#ff6b35', '#f5a623', '#ffd700', '#ff8c00', '#c9a227', '#e85d04'];
const FIRE_COUNT = 48;

function formatVipRemaining(expiresAtIso) {
  if (!expiresAtIso) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const end = new Date(expiresAtIso).getTime();
  const now = Date.now();
  if (now >= end) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  let ms = end - now;
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  ms -= days * 24 * 60 * 60 * 1000;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  ms -= hours * 60 * 60 * 1000;
  const minutes = Math.floor(ms / (60 * 1000));
  ms -= minutes * 60 * 1000;
  const seconds = Math.floor(ms / 1000);
  return { days, hours, minutes, seconds, done: false };
}

function VipCountdown({ vipExpiresAt }) {
  const hasExpiry = vipExpiresAt != null && String(vipExpiresAt).length > 0;
  const [remaining, setRemaining] = useState(() => (hasExpiry ? formatVipRemaining(vipExpiresAt) : { done: true }));
  useEffect(() => {
    if (!hasExpiry) return;
    setRemaining(formatVipRemaining(vipExpiresAt));
    const t = setInterval(() => setRemaining(formatVipRemaining(vipExpiresAt)), 1000);
    return () => clearInterval(t);
  }, [vipExpiresAt, hasExpiry]);
  if (!hasExpiry) return null;
  if (remaining.done) return <span className="profile-vip-countdown-done">Expirado</span>;
  return (
    <div className="profile-vip-countdown-wrap">
      <div className="profile-vip-countdown-label">Tempo restante</div>
      <div className="profile-vip-countdown" role="timer" aria-live="polite">
        <span className="profile-vip-countdown-block"><span className="profile-vip-countdown-n">{remaining.days}</span><span className="profile-vip-countdown-u">d</span></span>
        <span className="profile-vip-countdown-sep"> </span>
        <span className="profile-vip-countdown-block"><span className="profile-vip-countdown-n">{String(remaining.hours).padStart(2, '0')}</span><span className="profile-vip-countdown-u">h</span></span>
        <span className="profile-vip-countdown-sep"> </span>
        <span className="profile-vip-countdown-block"><span className="profile-vip-countdown-n">{String(remaining.minutes).padStart(2, '0')}</span><span className="profile-vip-countdown-u">min</span></span>
        <span className="profile-vip-countdown-sep"> </span>
        <span className="profile-vip-countdown-block"><span className="profile-vip-countdown-n">{String(remaining.seconds).padStart(2, '0')}</span><span className="profile-vip-countdown-u">s</span></span>
      </div>
    </div>
  );
}

function VipCelebration({ profile, onEnd }) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState('before');
  const displayName = (profile?.displayName && String(profile.displayName).trim()) || 'Jogador';

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('evolve'), 1400);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onEnd?.();
    }, 5200);
    return () => clearTimeout(t);
  }, [onEnd]);

  if (!visible) return null;
  return (
    <div className="vip-celebration" aria-hidden>
      <div className="vip-celebration-center">
        <div className="vip-celebration-blur" />
        <div className={`vip-celebration-content ${phase === 'evolve' ? 'vip-celebration-content--evolved' : ''}`}>
          <div className="vip-celebration-player">
            <div className="vip-celebration-avatar-wrapper">
              <div className={`vip-celebration-fire ${phase === 'evolve' ? 'vip-celebration-fire--on' : ''}`}>
                {Array.from({ length: FIRE_COUNT }, (_, i) => {
                  const xOffset = ((i / (FIRE_COUNT - 1)) - 0.5) * 120;
                  return (
                    <div
                      key={i}
                      className="vip-fire-particle"
                      style={{
                        '--x': `${xOffset}px`,
                        '--sway': `${(i % 5 - 2) * 8}px`,
                        '--delay': `${(i % 14) * 0.04}s`,
                        '--color': FIRE_COLORS[i % FIRE_COLORS.length],
                        '--size': `${6 + (i % 12)}px`,
                      }}
                    />
                  );
                })}
              </div>
              <Avatar avatarUrl={profile?.avatarUrl} className="vip-celebration-avatar" loading="eager" />
            </div>
            <span className={`vip-celebration-player-name ${phase === 'evolve' ? 'vip-celebration-player-name--vip' : ''}`}>
              {displayName}
            </span>
          </div>
          {phase === 'evolve' && (
            <>
              <span className="vip-celebration-badge">VIP</span>
              <h2 className="vip-celebration-title">Você evoluiu para VIP!</h2>
              <p className="vip-celebration-sub">Agora você pode criar lobbies PUG e MIX.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TwitchLinkSection() {
  const [twitchStatus, setTwitchStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/twitch/status', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setTwitchStatus(data))
      .catch(() => setTwitchStatus({ linked: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleUnlink = async () => {
    try {
      await fetch('/api/twitch/unlink', { method: 'DELETE', credentials: 'include' });
      setTwitchStatus({ linked: false, twitch_username: null });
    } catch { /* ignore */ }
  };

  if (loading) return null;

  return (
    <div className="profile-twitch-section" style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(145, 70, 255, 0.08)', border: '1px solid rgba(145, 70, 255, 0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>&#127909;</span>
        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '1px', color: '#9146ff' }}>TWITCH</strong>
      </div>
      {twitchStatus?.linked ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            Linkada: <strong style={{ color: '#9146ff' }}>{twitchStatus.twitch_username}</strong>
          </span>
          <TrackedButton
            type="button"
            className="pug-btn pug-btn-secondary"
            style={{ fontSize: '10px', padding: '4px 10px' }}
            onClick={handleUnlink}
          >
            DESLINKAR
          </TrackedButton>
        </div>
      ) : (
        <a
          href="/api/twitch/link"
          className="pug-btn pug-btn-primary"
          style={{ fontSize: '11px', padding: '6px 14px', display: 'inline-block', textDecoration: 'none', background: '#9146ff' }}
        >
          LINKAR CONTA TWITCH
        </a>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('session_id') ?? '';
  const vipSuccessFromUrl = searchParams.get('vip') === 'success';
  const profile = useProfile({
    sessionIdFromUrl: sessionIdFromUrl || undefined,
    vipSuccessFromUrl,
  });
  const { steamId: routeSteamId } = useParams();
  const [showVipCelebration, setShowVipCelebration] = useState(false);
  const [vipError, setVipError] = useState(null);
  const hasTriggeredCelebration = useRef(false);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicLoading, setPublicLoading] = useState(!!routeSteamId);
  const [publicError, setPublicError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [affiliatesData, setAffiliatesData] = useState(null);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);
  const [affiliatesPage, setAffiliatesPage] = useState(1);
  const [affiliateLinkCopied, setAffiliateLinkCopied] = useState(false);
  const [profileTab, setProfileTab] = useState('usuario');
  const [showContactEdit, setShowContactEdit] = useState(false);

  const sessionId = searchParams.get('session_id');
  const vipSuccess = searchParams.get('vip') === 'success';
  const isPublicView = Boolean(routeSteamId);

  useEffect(() => {
    if (isPublicView || !auth.steamId) return;
    setAffiliatesLoading(true);
    getProfileAffiliates(affiliatesPage, 20)
      .then((data) => setAffiliatesData(data))
      .catch(() => setAffiliatesData(null))
      .finally(() => setAffiliatesLoading(false));
  }, [isPublicView, auth.steamId, affiliatesPage]);

  const copyAffiliateLink = () => {
    if (affiliatesData?.link) {
      navigator.clipboard?.writeText(affiliatesData.link).then(() => {
        setAffiliateLinkCopied(true);
        setTimeout(() => setAffiliateLinkCopied(false), 2000);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (isPublicView && routeSteamId) {
      setPublicLoading(true);
      setPublicError(null);
      setNotFound(false);
      fetch(`/api/profile/${encodeURIComponent(routeSteamId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data || !data.steamId || data.displayName === null) {
            setNotFound(true);
          } else {
            setPublicProfile(data);
          }
          setPublicLoading(false);
        })
        .catch(() => {
          setPublicError('Erro ao carregar perfil público.');
          setPublicLoading(false);
        });
    }
  }, [isPublicView, routeSteamId]);

  useEffect(() => {
    if (isPublicView) return;
    if (auth.steamId && sessionId && vipSuccess) {
      profile.refresh(sessionId);
    }
  }, [auth.steamId, sessionId, vipSuccess, isPublicView]);

  // Mostra celebração VIP apenas na visão do próprio usuário
  useEffect(() => {
    if (isPublicView) return;
    if (hasTriggeredCelebration.current || !vipSuccess || !sessionId) return;
    if (!auth.steamId) return;
    hasTriggeredCelebration.current = true;
    const t = setTimeout(() => setShowVipCelebration(true), 150);
    return () => clearTimeout(t);
  }, [vipSuccess, sessionId, auth.steamId, isPublicView]);

  if (!isPublicView && (auth.loading || (auth.steamId && profile.loading))) {
    return (
      <div className="app">
        <div className="scanlines" />
        <div className="grid-bg" />
        <header className="header">
          <div className="header-left">
            <div className="logo-hex" />
            <div>
              <div className="header-title">PERFIL</div>
              <div className="header-sub">CONTA</div>
            </div>
          </div>
          <HamburgerNav activePath="/profile" auth={auth} profile={profile} returnTo="/profile" />
        </header>
        <main className="profile-main">
          <div className="spinner" />
          <span>Carregando...</span>
        </main>
      </div>
    );
  }

  if (!auth.steamId) {
    return (
      <div className="app">
        <div className="scanlines" />
        <div className="grid-bg" />
        <header className="header">
          <div className="header-left">
            <div className="logo-hex" />
            <div>
              <div className="header-title">PERFIL</div>
              <div className="header-sub">CONTA</div>
            </div>
          </div>
          <HamburgerNav activePath="/profile" auth={auth} profile={profile} returnTo="/profile" />
        </header>
        <main className="profile-main profile-main--guest">
          <div className="profile-guest">
            <div className="profile-guest-icon">👤</div>
            <h2 className="profile-guest-title">Perfil</h2>
            <p className="profile-guest-desc">Faça login com Steam para ver seu perfil, estatísticas e assinar VIP.</p>
            <TrackedButton type="button" className="profile-guest-steam-btn" onClick={() => auth.login('/profile')}>
              <span className="profile-guest-steam-icon" />
              ENTRAR COM STEAM
            </TrackedButton>
          </div>
        </main>
        <style>{`
          .profile-main {
            flex: 1;
            padding: 40px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            z-index: 10;
          }
          .profile-main--guest { justify-content: center; }
          .profile-guest {
            max-width: 420px; margin: 0 auto; text-align: center;
            background: linear-gradient(135deg, #10121a 0%, #151820 50%, #11131c 100%);
            border: 1px solid rgba(245, 166, 35, 0.15); border-radius: 12px;
            padding: 56px 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.3);
          }
          .profile-guest-icon { font-size: 56px; margin-bottom: 20px; opacity: 0.8; }
          .profile-guest-title { font-family: var(--font-head); font-size: 24px; letter-spacing: 3px; color: var(--gold); margin: 0 0 12px; }
          .profile-guest-desc { font-family: var(--font-body); font-size: 15px; color: var(--text-dim); line-height: 1.5; margin: 0 0 28px; }
          .profile-guest-steam-btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 10px;
            background: linear-gradient(135deg, #1b2838 0%, #2a475e 50%, #1b2838 100%);
            border: 1px solid #66c0f4; color: #c7d5e0; padding: 14px 28px; border-radius: 6px;
            font-family: var(--font-mono); font-size: 13px; letter-spacing: 2px; cursor: pointer;
            transition: all 0.25s; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.06);
          }
          .profile-guest-steam-btn:hover {
            background: linear-gradient(135deg, #2a475e 0%, #1b2838 100%);
            color: #fff; border-color: #8bb4d4;
            box-shadow: 0 0 20px rgba(102, 192, 244, 0.3); transform: translateY(-1px);
          }
          .profile-guest-steam-icon {
            display: inline-block; width: 22px; height: 22px;
            background: url('https://store.steampowered.com/favicon.ico') center/contain no-repeat; opacity: 0.95;
          }
        `}</style>
      </div>
    );
  }

  if (isPublicView && notFound) {
    return (
      <div className="app">
        <div className="scanlines" />
        <div className="grid-bg" />
        <header className="header">
          <div className="header-left">
            <div className="logo-hex" />
            <div>
              <div className="header-title">PERFIL</div>
              <div className="header-sub">JOGADOR</div>
            </div>
          </div>
          <HamburgerNav activePath="/profile" auth={auth} profile={profile} returnTo="/profile" />
        </header>
        <main className="profile-main profile-main--guest">
          <div className="profile-guest">
            <div className="profile-guest-icon">?</div>
            <h2 className="profile-guest-title">Jogador não encontrado</h2>
            <p className="profile-guest-desc">
              Não encontramos nenhum perfil público para este SteamID. Verifique se o link está correto.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const p = isPublicView ? (publicProfile || {}) : (profile.profile || {});
  const isVip = Boolean(p.isVip);
  const level = Math.max(1, Math.min(100, parseInt(p?.level, 10) || 1));
  const points = Math.max(0, parseInt(p?.points, 10) || 0);
  const giveawayPoints = Math.max(0, parseInt(p?.giveawayPoints, 10) || 0);
  const levelStyle = getLevelStyle(level);
  return (
    <div className="app">
      {showVipCelebration && (
        <VipCelebration
          profile={profile.profile}
          onEnd={() => { setShowVipCelebration(false); setSearchParams({}, { replace: true }); }}
        />
      )}
      {!isPublicView && showContactEdit && (
        <ContactProfileModal
          variant="edit"
          initialValues={{
            fullName: profile.profile?.marketingFullName || '',
            email: profile.profile?.marketingEmail || '',
            phone: profile.profile?.marketingPhone || '',
          }}
          onClose={() => setShowContactEdit(false)}
          onSubmit={async (data) => {
            await saveMarketingContact(data);
            await profile.refresh();
          }}
        />
      )}
      <div className="scanlines" />
      <div className="grid-bg" />
      <header className="header">
        <div className="header-left">
          <div className="logo-hex" />
          <div>
            <div className="header-title">PERFIL</div>
            <div className="header-sub">CONTA</div>
          </div>
        </div>
        <HamburgerNav activePath="/profile" auth={auth} profile={profile} returnTo="/profile" />
      </header>

      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-avatar-row">
            <Avatar avatarUrl={p.avatarUrl} className="profile-avatar" />
            <div className="profile-head">
              <h1 className={`profile-name ${isVip ? 'profile-name--vip' : ''}`}>{p.displayName || `Jogador ${String(p.steamId || '').slice(-6)}`}</h1>
              <p className="profile-steam-id">Steam ID: {p.steamId}</p>
              {isVip && (
                <div className="profile-vip-inline">
                  <span className="profile-vip-badge">VIP</span>
                  {!isPublicView && p.vipExpiresAt && (
                    <VipCountdown vipExpiresAt={p.vipExpiresAt} />
                  )}
                </div>
              )}
              {isPublicView && !isVip && <span className="profile-public-badge">PÚBLICO</span>}
            </div>
          </div>
          <div className="profile-actions">
            {p.steamId && (
              <TrackedButton
                type="button"
                className={`pug-btn pug-btn-secondary profile-btn-share${shareCopied ? ' profile-btn-share--copied' : ''}`}
                onClick={() => {
                  const url = `${window.location.origin}/profile/${encodeURIComponent(p.steamId)}`;
                  navigator.clipboard?.writeText(url).then(() => {
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }).catch(() => {});
                }}
                title="Copiar link do perfil público"
              >
                <span className="profile-btn-share-icon" aria-hidden>{shareCopied ? '✓' : '⧉'}</span>
                {shareCopied ? 'Copiado!' : 'COMPARTILHAR PERFIL'}
              </TrackedButton>
            )}
            {!isPublicView && (
              <TrackedButton type="button" className="pug-btn pug-btn-secondary profile-btn-logout" onClick={auth.logout}>
                SAIR
              </TrackedButton>
            )}
          </div>
          {!isPublicView && (
            <div className="profile-contact-block profile-contact-block--hero">
              <div className="profile-contact-head">
                <h3 className="profile-contact-title">Dados do perfil</h3>
                <TrackedButton
                  type="button"
                  className="pug-btn pug-btn-secondary profile-contact-edit-btn"
                  onClick={() => setShowContactEdit(true)}
                >
                  Editar
                </TrackedButton>
              </div>
              <p className="profile-contact-line">
                <span className="profile-contact-k">Nome</span>
                <span className="profile-contact-v">{p.marketingFullName || '—'}</span>
              </p>
              <p className="profile-contact-line">
                <span className="profile-contact-k">E-mail</span>
                <span className="profile-contact-v">{p.marketingEmail || '—'}</span>
              </p>
              <p className="profile-contact-line">
                <span className="profile-contact-k">Telefone</span>
                <span className="profile-contact-v">{p.marketingPhone || '—'}</span>
              </p>
            </div>
          )}
          {!isPublicView && !isVip && (
            <div className="profile-vip-cta">
              <p>Assine o VIP para criar salas MIX.</p>
              {vipError && (
                <p className="profile-vip-error" role="alert">
                  {vipError}
                </p>
              )}
              <TrackedButton
                type="button"
                className="pug-btn pug-btn-primary"
                onClick={async () => {
                  setVipError(null);
                  try {
                    await profile.buyVip();
                  } catch (e) {
                    setVipError(e?.message || 'Erro ao criar sessão de pagamento.');
                  }
                }}
                disabled={profile.checkoutLoading}
              >
                {profile.checkoutLoading ? 'REDIRECIONANDO...' : 'ASSINAR VIP'}
              </TrackedButton>
            </div>
          )}

          <nav className="profile-tabs" aria-label="Conteúdo do perfil">
          <TrackedButton type="button" className={`profile-tab ${profileTab === 'usuario' ? 'profile-tab--active' : ''}`} onClick={() => setProfileTab('usuario')}>
            Usuário
            </TrackedButton>
            <TrackedButton type="button" className={`profile-tab ${profileTab === 'giveaway' ? 'profile-tab--active' : ''}`} onClick={() => setProfileTab('giveaway')}>
              Pontos do sorteio mensal
            </TrackedButton>
            {!isPublicView && (
              <TrackedButton type="button" className={`profile-tab ${profileTab === 'afiliados' ? 'profile-tab--active' : ''}`} onClick={() => setProfileTab('afiliados')}>
                Afiliados
              </TrackedButton>
            )}
          </nav>

          <div className="profile-tab-panels">
            {profileTab === 'usuario' && (
              <div className="profile-content-card">
                <h2 className="profile-content-card-title">Usuário</h2>
                <div className="profile-content-card-body">
                  <div className="profile-stats profile-stats--in-tab">
                    <div className="profile-stat">
                      <span className="profile-stat-label">LEVEL</span>
                      <span className="profile-stat-value profile-level-badge" style={{ backgroundColor: levelStyle.backgroundColor, color: levelStyle.color }} title={`Level ${level}`}>{String(level)}</span>
                    </div>
                    <div className="profile-stat">
                      <span className="profile-stat-label">PONTOS</span>
                      <span className="profile-stat-value">{String(points)}</span>
                    </div>
                    <div className="profile-stat">
                      <span className="profile-stat-label">VITÓRIAS MIX</span>
                      <span className="profile-stat-value profile-stat-wins">{p.wins ?? 0}</span>
                    </div>
                    <div className="profile-stat">
                      <span className="profile-stat-label">DERROTAS</span>
                      <span className="profile-stat-value profile-stat-losses">{p.losses ?? 0}</span>
                    </div>
                  </div>
                  <p className="profile-resumo-text">
                    Level <strong>{level}</strong>, <strong>{points}</strong> pontos, <strong>{p.wins ?? 0}</strong> vitórias e <strong>{p.losses ?? 0}</strong> derrotas no MIX.
                  </p>
                  {!isPublicView && <TwitchLinkSection />}
                </div>
              </div>
            )}
            {profileTab === 'giveaway' && (
              <div className="profile-content-card">
                <h2 className="profile-content-card-title">Pontos do sorteio mensal</h2>
                <div className="profile-content-card-body profile-giveaway-inner">
                  <p className="profile-giveaway-desc">
                    Jogue PUG/SQUAD para ganhar pontos todo mês. Os pontos e fichas são do mês atual e reiniciam no início de cada mês.
                    A cada 10 pontos você converte em 1 ficha para girar a roda VIP e concorrer a skins, caixas e cupons.
                  </p>
                  <div className="profile-giveaway-value-row">
                    <span className="profile-giveaway-value-label">Pontos atuais</span>
                    <span className="profile-giveaway-value">{giveawayPoints}</span>
                  </div>
                  <TrackedButton type="button" className="pug-btn pug-btn-secondary profile-giveaway-btn" onClick={() => { window.location.href = '/giveaway'; }}>
                    Ir para a roleta VIP
                  </TrackedButton>
                </div>
              </div>
            )}
            {profileTab === 'afiliados' && !isPublicView && (
              <div className="profile-content-card">
                <h2 className="profile-content-card-title">Afiliados</h2>
                <div className="profile-content-card-body">
                  {affiliatesLoading && <p className="profile-affiliates-loading">Carregando...</p>}
                  {!affiliatesLoading && affiliatesData && (
                    <>
                      <div className="profile-affiliates-code-wrap">
                        <p className="profile-affiliates-code-label">Seu código: <strong>{affiliatesData.code || '—'}</strong></p>
                        <p className="profile-affiliates-link-label">Link:</p>
                        <div className="profile-affiliates-link-wrap">
                          <input type="text" readOnly value={affiliatesData.link || ''} className="profile-affiliates-link-input" aria-label="Link de indicação" />
                          <TrackedButton type="button" className={`profile-affiliates-copy-btn${affiliateLinkCopied ? ' profile-affiliates-copy-btn--ok' : ''}`} onClick={copyAffiliateLink} aria-label="Copiar link">
                            {affiliateLinkCopied ? '✓' : '⧉'}
                          </TrackedButton>
                        </div>
                      </div>
                      <div className="profile-affiliates-table-wrap">
                        <table className="profile-affiliates-table">
                          <thead>
                            <tr>
                              <th>Jogador</th>
                              <th>Tempo jogado</th>
                              <th>Status</th>
                              <th>Pontos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(affiliatesData.items || []).length === 0 && (
                              <tr><td colSpan={4} className="profile-affiliates-empty">Nenhum indicado ainda. Compartilhe seu link!</td></tr>
                            )}
                            {(affiliatesData.items || []).map((row) => (
                              <tr key={row.id}>
                                <td>{row.referredDisplayName}</td>
                                <td>{row.playtimeMinutes} min</td>
                                <td>{row.status === 'rewarded' ? 'Recompensado' : row.status === 'pending' ? 'Em progresso' : row.status}</td>
                                <td>{row.rewarded ? `+${row.points}` : '0'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {affiliatesData.total > affiliatesData.perPage && (
                        <div className="profile-affiliates-pagination">
                          <TrackedButton type="button" className="pug-btn pug-btn-secondary" disabled={affiliatesPage <= 1} onClick={() => setAffiliatesPage((p) => Math.max(1, p - 1))}>Anterior</TrackedButton>
                          <span>Página {affiliatesPage} de {Math.ceil(affiliatesData.total / affiliatesData.perPage) || 1}</span>
                          <TrackedButton type="button" className="pug-btn pug-btn-secondary" disabled={affiliatesPage * affiliatesData.perPage >= affiliatesData.total} onClick={() => setAffiliatesPage((p) => p + 1)}>Próxima</TrackedButton>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="profile-details-section" aria-labelledby="profile-details-heading">
          <h2 id="profile-details-heading" className="profile-details-heading">Detalhes do jogador</h2>
          <PlayerDetailsCard steamId={p.steamId} profile={p} showHeader={false} />
        </section>
      </main>

      <style>{`
        .profile-main {
          flex: 1;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          position: relative;
          z-index: 10;
        }
        .profile-tabs {
          display: flex;
          gap: 4px;
          width: 100%;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding-bottom: 0;
        }
        .profile-tab {
          padding: 12px 20px;
          font-size: 13px;
          letter-spacing: 1px;
          color: var(--text-dim);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
        }
        .profile-tab:hover { color: var(--text); }
        .profile-tab--active {
          color: var(--text);
          border-bottom-color: var(--accent);
          font-weight: 600;
        }
        .profile-tab-panels {
          width: 100%;
          margin-top: 16px;
        }
        .profile-content-card {
          width: 100%;
          border-radius: 12px;
          background: rgba(15,23,42,0.96);
          border: 1px solid var(--border);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .profile-content-card-title {
          margin: 0;
          padding: 16px 20px;
          font-family: var(--font-head);
          font-size: 1rem;
          letter-spacing: 2px;
          color: var(--text);
          border-bottom: 1px solid var(--border);
          background: rgba(0,0,0,0.2);
        }
        .profile-content-card-body {
          padding: 20px;
        }
        .profile-resumo-text {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text);
          line-height: 1.5;
        }
        .profile-resumo-text strong { color: var(--accent); }
        .profile-contact-block {
          margin-top: 20px;
          padding: 16px 18px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.2);
        }
        .profile-contact-block--hero {
          margin-top: 18px;
          width: 100%;
          background: rgba(8, 12, 22, 0.55);
          border-color: rgba(245, 166, 35, 0.18);
        }
        .profile-contact-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .profile-contact-title {
          margin: 0;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .profile-contact-edit-btn {
          font-size: 10px;
          padding: 6px 14px;
          letter-spacing: 0.1em;
        }
        .profile-contact-line {
          margin: 0 0 8px;
          font-size: 0.88rem;
          display: flex;
          flex-wrap: wrap;
          gap: 8px 14px;
          align-items: baseline;
        }
        .profile-contact-k {
          min-width: 72px;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-mute);
        }
        .profile-contact-v {
          color: var(--text);
          word-break: break-word;
        }
        .profile-contact-hint {
          margin: 12px 0 0;
          font-size: 0.75rem;
          line-height: 1.5;
          color: var(--text-mute);
        }
        .profile-contact-privacy-link {
          color: var(--accent);
          text-decoration: underline;
        }
        .profile-giveaway-inner {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .profile-giveaway-desc {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text);
          line-height: 1.55;
          max-width: 100%;
        }
        .profile-giveaway-value-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .profile-giveaway-value-label {
          font-size: 0.8rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .profile-giveaway-value {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
        }
        .profile-giveaway-btn {
          align-self: flex-start;
          padding: 10px 18px;
          font-size: 12px;
          letter-spacing: 1.5px;
        }
        .profile-guest {
          max-width: 420px;
          margin: 0 auto;
          text-align: center;
          background: linear-gradient(135deg, #10121a 0%, #151820 50%, #11131c 100%);
          border: 1px solid rgba(245, 166, 35, 0.15);
          border-radius: 12px;
          padding: 56px 40px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        }
        .profile-guest-icon {
          font-size: 56px;
          margin-bottom: 20px;
          opacity: 0.8;
        }
        .profile-guest-title {
          font-family: var(--font-head);
          font-size: 24px;
          letter-spacing: 3px;
          color: var(--gold);
          margin: 0 0 12px;
        }
        .profile-guest-desc {
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--text-dim);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .profile-guest-steam-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #1b2838 0%, #2a475e 50%, #1b2838 100%);
          border: 1px solid #66c0f4;
          color: #c7d5e0;
          padding: 14px 28px;
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .profile-guest-steam-btn:hover {
          background: linear-gradient(135deg, #2a475e 0%, #1b2838 100%);
          color: #fff;
          border-color: #8bb4d4;
          box-shadow: 0 0 20px rgba(102, 192, 244, 0.3);
          transform: translateY(-1px);
        }
        .profile-guest-steam-icon {
          display: inline-block;
          width: 22px;
          height: 22px;
          background: url('https://store.steampowered.com/favicon.ico') center/contain no-repeat;
          opacity: 0.95;
        }
        .profile-card {
          background: linear-gradient(135deg, #10121a 0%, #151820 100%);
          border: 1px solid rgba(245, 166, 35, 0.15);
          border-radius: 12px;
          padding: 32px;
          max-width: 560px;
          width: 100%;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        }
        .profile-avatar-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        .profile-avatar {
          width: 96px;
          height: 96px;
          border-radius: 8px;
          border: 2px solid rgba(245, 166, 35, 0.3);
          object-fit: cover;
        }
        .profile-head {
          flex: 1;
          min-width: 0;
        }
        .profile-name {
          font-family: var(--font-head);
          font-size: 28px;
          letter-spacing: 2px;
          color: #fff;
          margin-bottom: 4px;
        }
        .profile-name--vip {
          background: linear-gradient(135deg, #fff 0%, var(--gold) 50%, #f5a623 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-fill-color: transparent;
          filter: drop-shadow(0 0 12px rgba(245, 166, 35, 0.5));
          animation: profile-vip-shine 3s ease-in-out infinite;
        }
        @keyframes profile-vip-shine {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        .profile-steam-id {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-mute);
          margin-bottom: 8px;
        }
        .profile-vip-inline {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          margin-top: 4px;
        }
        .profile-vip-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 2px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          color: #0a0a0a;
          font-weight: 700;
        }
        .profile-vip-countdown-wrap {
          margin-top: 4px;
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 8px;
          border: 1px solid rgba(250, 204, 21, 0.25);
        }
        .profile-vip-countdown-label {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          color: rgba(245, 245, 244, 0.6);
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .profile-vip-countdown {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 2px 6px;
        }
        .profile-vip-countdown-block {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          min-width: 2em;
        }
        .profile-vip-countdown-n {
          font-family: var(--font-mono);
          font-size: 1.35rem;
          font-weight: 700;
          color: #fef3c7;
          line-height: 1.2;
        }
        .profile-vip-countdown-u {
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: rgba(245, 245, 244, 0.5);
          text-transform: uppercase;
        }
        .profile-vip-countdown-sep { color: rgba(245, 245, 244, 0.3); font-size: 1rem; }
        .profile-vip-countdown-done {
          font-size: 0.9rem;
          color: rgba(248, 113, 113, 0.9);
        }
        .profile-btn-share {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 12px;
          letter-spacing: 2px;
        }
        .profile-btn-share-icon {
          font-size: 1rem;
          opacity: 0.9;
        }
        .profile-btn-share--copied .profile-btn-share-icon { color: var(--green); }
        .profile-stats {
          display: flex;
          gap: 32px;
          margin-bottom: 24px;
          padding: 20px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .profile-stats--in-tab {
          margin-top: 0;
          margin-bottom: 16px;
          padding-top: 0;
          padding-bottom: 16px;
          border-top: none;
          border-bottom: 1px solid var(--border);
        }
        .profile-stat-wins { color: var(--green); font-weight: 600; }
        .profile-stat-losses { color: var(--red); font-weight: 500; }
        .profile-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }
        .profile-affiliates-section { margin-top: 32px; width: 100%; max-width: 560px; }
        .profile-affiliates-loading { color: var(--text-mute); font-size: 0.9rem; margin: 12px 0; }
        .profile-affiliates-code-wrap { margin-bottom: 16px; }
        .profile-affiliates-code-label, .profile-affiliates-link-label { margin: 0 0 6px; font-size: 0.9rem; color: var(--text-dim); }
        .profile-affiliates-link-wrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }
        .profile-affiliates-link-input {
          flex: 1;
          width: 100%;
          padding: 12px 48px 12px 14px;
          margin: 0;
          font-size: 0.9rem;
          color: var(--text);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-sizing: border-box;
        }
        .profile-affiliates-copy-btn {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.8);
          background: rgba(15,23,42,0.95);
          color: #e5e7eb;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .profile-affiliates-copy-btn:hover {
          border-color: rgba(148,163,184,1);
          background: rgba(30,41,59,0.95);
        }
        .profile-affiliates-copy-btn--ok {
          border-color: rgba(34,197,94,0.8);
          background: rgba(22,163,74,0.9);
          color: #ecfdf5;
          box-shadow: 0 0 12px rgba(34,197,94,0.8);
        }
        .profile-affiliates-table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; margin-top: 12px; }
        .profile-affiliates-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .profile-affiliates-table th, .profile-affiliates-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); }
        .profile-affiliates-table th { background: rgba(0,0,0,0.2); color: var(--text-dim); font-weight: 600; }
        .profile-affiliates-empty { color: var(--text-mute); text-align: center; padding: 20px !important; }
        .profile-affiliates-pagination { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
        .profile-details-section { margin-top: 32px; width: 100%; max-width: 560px; }
        .profile-details-heading {
          font-family: var(--font-head);
          font-size: 1rem;
          letter-spacing: 3px;
          color: var(--text-dim);
          margin: 0 0 16px;
        }
        .profile-btn-logout {
          padding: 10px 20px;
          font-size: 12px;
          letter-spacing: 2px;
          background: transparent;
          color: var(--text-mute);
          border: 1px solid var(--border2);
        }
        .profile-btn-logout:hover {
          border-color: var(--red);
          color: var(--red);
          background: rgba(239, 68, 68, 0.08);
        }
        .profile-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .profile-stat-label {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 2px;
          color: var(--text-mute);
        }
        .profile-stat-value {
          font-family: var(--font-head);
          font-size: 32px;
        }
        .profile-level-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          font-weight: 700;
        }
        .profile-vip-cta {
          text-align: center;
          color: var(--text-dim);
          font-size: 14px;
        }
        .profile-vip-cta .pug-btn { margin-top: 12px; }
        .profile-vip-error {
          color: var(--red);
          font-size: 13px;
          margin: 0 0 12px;
          padding: 8px 12px;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 6px;
        }

        .vip-celebration {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
        }
        .vip-celebration-avatar-wrapper {
          position: relative;
          display: inline-block;
          overflow: visible;
        }
        .vip-celebration-fire {
          position: absolute;
          inset: -20px;
          pointer-events: none;
          overflow: visible;
        }
        .vip-fire-particle {
          position: absolute;
          left: 50%;
          bottom: 0;
          width: var(--size, 12px);
          height: var(--size, 12px);
          margin-left: calc(var(--size, 12px) / -2 + var(--x, 0px));
          background: radial-gradient(ellipse 80% 100%, var(--color) 0%, transparent 70%);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          opacity: 0;
          transform: translateY(0) translateX(var(--sway, 0)) scale(0.6);
          animation: vip-fire-rise 2.8s ease-out forwards;
          animation-delay: 999s;
          box-shadow: 0 0 10px var(--color), 0 0 20px rgba(255, 107, 53, 0.6);
        }
        .vip-celebration-fire--on .vip-fire-particle {
          opacity: 0.95;
          animation-delay: var(--delay, 0s);
        }
        @keyframes vip-fire-rise {
          0% {
            transform: translateY(0) translateX(var(--sway, 0)) scale(0.6);
            opacity: 0.95;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: translateY(-140px) translateX(calc(var(--sway, 0) * 2)) scale(1.2);
            opacity: 0;
          }
        }
        .vip-celebration-center {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vip-celebration-blur {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(8px);
          background: rgba(0,0,0,0.4);
        }
        .vip-celebration-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 40px;
          transition: opacity 0.4s ease;
        }
        .vip-celebration-player {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .vip-celebration-avatar {
          position: relative;
          z-index: 1;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          border: 2px solid rgba(245, 166, 35, 0.4);
          object-fit: cover;
        }
        .vip-celebration-content--evolved .vip-celebration-avatar {
          box-shadow: 0 0 24px rgba(245, 166, 35, 0.5), inset 0 0 20px rgba(255, 107, 53, 0.15);
        }
        .vip-celebration-player-name {
          font-family: var(--font-head);
          font-size: 22px;
          letter-spacing: 2px;
          color: #fff;
        }
        .vip-celebration-player-name--vip {
          background: linear-gradient(135deg, #fff 0%, var(--gold) 50%, #f5a623 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 10px rgba(245, 166, 35, 0.5));
        }
        .vip-celebration-content--evolved .vip-celebration-badge,
        .vip-celebration-content--evolved .vip-celebration-title,
        .vip-celebration-content--evolved .vip-celebration-sub {
          animation: vip-evolve-in 0.5s ease forwards;
        }
        @keyframes vip-evolve-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .vip-celebration-badge {
          display: inline-block;
          padding: 8px 24px;
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 18px;
          letter-spacing: 4px;
          background: linear-gradient(135deg, var(--gold), #c9a227);
          color: #0a0a0a;
          font-weight: 700;
          margin-bottom: 16px;
          box-shadow: 0 0 30px rgba(245, 166, 35, 0.6);
          animation: vip-badge-pulse 1s ease-in-out infinite alternate;
        }
        @keyframes vip-badge-pulse {
          from { box-shadow: 0 0 20px rgba(245, 166, 35, 0.5); transform: scale(1); }
          to { box-shadow: 0 0 40px rgba(245, 166, 35, 0.8); transform: scale(1.05); }
        }
        .vip-celebration-title {
          font-family: var(--font-head);
          font-size: 32px;
          letter-spacing: 3px;
          color: #fff;
          margin: 0 0 8px;
          text-shadow: 0 0 20px rgba(245, 166, 35, 0.5);
        }
        .vip-celebration-sub {
          font-size: 14px;
          color: var(--text-dim);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
