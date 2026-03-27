import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HamburgerNav } from '../components/HamburgerNav';
import { Avatar } from '../components/Avatar';
import { LevelProgressFloatingModal } from '../components/LevelProgressFloatingModal';
import { TrackedButton } from '../components/TrackedButton';
import {
  getMySquad,
  createSquad,
  leaveSquad,
  dissolveSquad,
  generateInvite,
  joinSquadByInvite,
  updateSquad,
} from '../services/squadService';
import { useProfile } from '../hooks/useProfile';
import '../index.css';

export default function SquadPage() {
  const auth = useAuth();
  const profile = useProfile();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [squad, setSquad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(!!tokenFromUrl);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchSquad = useCallback(async () => {
    if (!auth.steamId) {
      setSquad(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMySquad();
      setSquad(data);
    } catch (e) {
      setError(e.message);
      setSquad(null);
    } finally {
      setLoading(false);
    }
  }, [auth.steamId]);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

  const handleCreate = async (name) => {
    setShowCreateModal(false);
    setActionLoading(true);
    setError(null);
    try {
      const created = await createSquad(name);
      setSquad(created);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Tem certeza que deseja sair do squad?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await leaveSquad();
      setSquad(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDissolve = async () => {
    if (!confirm('Dissolver o squad remove todos os membros. Tem certeza?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await dissolveSquad();
      setSquad(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvite = async (password, expiresInMinutes) => {
    setActionLoading(true);
    setError(null);
    setInviteResult(null);
    try {
      const result = await generateInvite(password, expiresInMinutes);
      setInviteResult(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (token, password) => {
    setActionLoading(true);
    setError(null);
    try {
      const joined = await joinSquadByInvite(token, password);
      setSquad(joined);
      setShowJoinModal(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSquad = async (payload) => {
    setShowEditModal(false);
    setActionLoading(true);
    setError(null);
    try {
      const updated = await updateSquad(payload);
      setSquad(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isLeader = squad && auth.steamId && squad.leaderSteamId === auth.steamId;

  return (
    <div className="app squad-page">
      <div className="scanlines" />
      <div className="grid-bg" />

      <header className="header squad-header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">SQUAD</div>
            <div className="header-sub">TIME · RANKING · CONVITE</div>
          </div>
        </div>
        <HamburgerNav activePath="/squad" auth={auth} profile={profile} returnTo="/squad" />
      </header>

      <main className="squad-main">
        <section className="squad-hero">
          <h1 className="squad-title">MEU TIME</h1>
          <p className="squad-sub">Crie ou entre em um squad para jogar partidas Squad no MIX</p>
        </section>

        {error && (
          <div className="squad-error">
            <span className="squad-error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {!auth.steamId && (
          <div className="squad-card squad-card--empty">
            <div className="squad-empty-icon">👥</div>
            <h3 className="squad-empty-title">Entre para gerenciar seu squad</h3>
            <p className="squad-empty-desc">Faça login com Steam para criar ou entrar em um time.</p>
            <TrackedButton type="button" className="steam-login-btn" onClick={() => auth.login('/squad')}>
              <span className="steam-login-icon" />
              ENTRAR COM STEAM
            </TrackedButton>
          </div>
        )}

        {auth.steamId && loading && (
          <div className="squad-loading">
            <div className="spinner" />
            <span>Carregando...</span>
          </div>
        )}

        {auth.steamId && !loading && !squad && (
          <div className="squad-card squad-card--no-squad">
            <div className="squad-empty-icon">⚔</div>
            <h3 className="squad-empty-title">Você não está em um squad</h3>
            <p className="squad-empty-desc">
              {profile.profile?.isVip
                ? 'Crie um time ou entre por convite.'
                : 'Criar squad é um benefício VIP. Assine para criar o seu clan.'}
            </p>
            <div className="squad-actions-row">
              {profile.profile?.isVip ? (
                <>
                  <TrackedButton
                    type="button"
                    className="pug-btn pug-btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    disabled={actionLoading}
                  >
                    CRIAR SQUAD
                  </TrackedButton>
                  <TrackedButton
                    type="button"
                    className="pug-btn pug-btn-secondary"
                    onClick={() => setShowJoinModal(true)}
                    disabled={actionLoading}
                  >
                    ENTRAR POR CONVITE
                  </TrackedButton>
                </>
              ) : (
                <>
                  <TrackedButton
                    type="button"
                    className="pug-btn pug-btn-primary"
                    onClick={() => window.location.assign('/vip')}
                    disabled={actionLoading}
                  >
                    VER BENEFÍCIOS VIP
                  </TrackedButton>
                  <TrackedButton
                    type="button"
                    className="pug-btn pug-btn-secondary"
                    onClick={() => setShowJoinModal(true)}
                    disabled={actionLoading}
                  >
                    ENTRAR POR CONVITE
                  </TrackedButton>
                </>
              )}
            </div>
          </div>
        )}

        {auth.steamId && !loading && squad && (
          <div className="squad-card squad-card--has-squad">
            <div className="squad-profile">
              <div className="squad-logo-wrap">
                {squad.logoUrl ? (
                  <img src={squad.logoUrl} alt="" className="squad-logo" />
                ) : (
                  <div className="squad-logo-placeholder" aria-hidden>⚔</div>
                )}
              </div>
              <h2 className="squad-name">{squad.name}</h2>
              {(squad.description || '').trim() && (
                <p className="squad-description">{squad.description}</p>
              )}
              {Array.isArray(squad.medals) && squad.medals.length > 0 && (
                <div className="squad-medals">
                  <span className="squad-medals-label">Conquistas</span>
                  <ul className="squad-medals-list">
                    {squad.medals.map((m, i) => (
                      <li key={i} className="squad-medal">
                        {m.icon && <span className="squad-medal-icon" aria-hidden>{m.icon}</span>}
                        <span className="squad-medal-title">{m.title || 'Medalha'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="squad-stats-row">
              <span className="squad-stat" title="Pontos">{squad.points ?? 0} pts</span>
              <span className="squad-stat" title="Vitórias">{squad.wins ?? 0}V</span>
              <span className="squad-stat" title="Derrotas">{squad.losses ?? 0}D</span>
            </div>

            <div className="squad-leader">
              <span className="squad-leader-label">Líder</span>
              <div className="squad-leader-row">
                <Avatar avatarUrl={squad.leaderAvatarUrl} className="squad-leader-avatar" />
                <span className="squad-leader-name">{squad.leaderName || `Jogador ${String(squad.leaderSteamId).slice(-6)}`}</span>
              </div>
            </div>

            <div className="squad-members">
              <span className="squad-members-label">Membros ({squad.members?.length ?? 0}/5)</span>
              <ul className="squad-members-list">
                {(squad.members || []).map((m) => (
                  <li key={m.steamId} className={`squad-member ${m.isLeader ? 'squad-member--leader' : ''}`}>
                    <Avatar avatarUrl={m.avatarUrl} className="squad-member-avatar" />
                    <span className="squad-member-name">{m.displayName || 'Jogador'}</span>
                    {m.isLeader && <span className="squad-member-badge">Líder</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="squad-actions-row">
              {isLeader && (
                <TrackedButton
                  type="button"
                  className="pug-btn pug-btn-secondary"
                  onClick={() => setShowEditModal(true)}
                  disabled={actionLoading}
                >
                  EDITAR PERFIL
                </TrackedButton>
              )}
              {isLeader && (
                <TrackedButton
                  type="button"
                  className="pug-btn pug-btn-primary"
                  onClick={() => { setShowInviteModal(true); setInviteResult(null); }}
                  disabled={actionLoading}
                >
                  GERAR CONVITE
                </TrackedButton>
              )}
              {!isLeader && (
                <TrackedButton
                  type="button"
                  className="pug-btn pug-btn-secondary"
                  onClick={handleLeave}
                  disabled={actionLoading}
                >
                  SAIR DO SQUAD
                </TrackedButton>
              )}
              {isLeader && (
                <TrackedButton
                  type="button"
                  className="pug-btn pug-btn-secondary squad-btn-dissolve"
                  onClick={handleDissolve}
                  disabled={actionLoading}
                >
                  DISSOLVER SQUAD
                </TrackedButton>
              )}
            </div>

            <Link to="/pug" className="squad-link-pug">Criar partida Squad no MIX →</Link>
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateSquadModal
          onConfirm={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {showJoinModal && (
        <JoinSquadModal
          initialToken={tokenFromUrl}
          onConfirm={handleJoin}
          onCancel={() => setShowJoinModal(false)}
          loading={actionLoading}
        />
      )}

      {showInviteModal && (
        <InviteModal
          onGenerate={handleGenerateInvite}
          inviteResult={inviteResult}
          onClose={() => { setShowInviteModal(false); setInviteResult(null); }}
          loading={actionLoading}
        />
      )}

      {showEditModal && squad && (
        <EditSquadModal
          squad={squad}
          onSave={handleUpdateSquad}
          onCancel={() => setShowEditModal(false)}
          loading={actionLoading}
        />
      )}

      <style>{`
        .squad-page { min-height: 100vh; display: flex; flex-direction: column; }
        .squad-main { flex: 1; padding: 28px 24px 80px; max-width: 920px; margin: 0 auto; width: 100%; }
        .squad-hero { text-align: center; padding: 24px 0 32px; }
        .squad-title { font-family: var(--font-head); font-size: 2rem; letter-spacing: 4px; color: #fff; margin: 0 0 8px; }
        .squad-sub { color: rgba(255,255,255,0.7); font-size: 0.95rem; margin: 0; }
        .squad-error { background: rgba(180,60,60,0.2); border: 1px solid rgba(220,80,80,0.6); color: #f88; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .squad-error-icon { font-weight: bold; }
        .squad-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; color: rgba(255,255,255,0.8); }
        .squad-card {
          background: linear-gradient(180deg, rgba(18,22,35,0.97) 0%, rgba(12,16,28,0.99) 100%);
          border: 1px solid rgba(245,166,35,0.18);
          border-radius: 20px;
          padding: 36px 40px;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset, 0 12px 48px rgba(0,0,0,0.35), 0 0 60px rgba(245,166,35,0.06);
        }
        .squad-card--has-squad {
          border-color: rgba(245,166,35,0.28);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.05) inset, 0 16px 56px rgba(0,0,0,0.4), 0 0 80px rgba(245,166,35,0.08);
        }
        .squad-card--empty, .squad-card--no-squad { border-color: rgba(255,255,255,0.1); }
        .squad-card--empty, .squad-card--no-squad { text-align: center; }
        .squad-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .squad-empty-title { color: #fff; font-size: 1.2rem; margin: 0 0 8px; }
        .squad-empty-desc { color: rgba(255,255,255,0.65); margin: 0 0 24px; font-size: 0.95rem; }
        .squad-actions-row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 20px; }
        .squad-name { color: #fff; font-size: 1.5rem; margin: 0 0 16px; text-align: center; }
        .squad-stats-row { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
        .squad-stat { color: var(--accent); font-weight: 600; font-size: 1rem; }
        .squad-leader { margin-bottom: 20px; }
        .squad-leader-label, .squad-members-label { color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
        .squad-leader-row { display: flex; align-items: center; gap: 10px; }
        .squad-leader-avatar { width: 36px; height: 36px; border-radius: 50%; }
        .squad-leader-name { color: #fff; }
        .squad-members-list { list-style: none; padding: 0; margin: 0; }
        .squad-member { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .squad-member-avatar { width: 32px; height: 32px; border-radius: 50%; }
        .squad-member-name { color: #fff; flex: 1; }
        .squad-member-badge { font-size: 0.75rem; color: var(--accent); }
        .squad-btn-dissolve { color: rgba(255,180,180,0.9); border-color: rgba(220,100,100,0.4); }
        .squad-link-pug { display: inline-block; margin-top: 20px; color: var(--accent); text-decoration: none; font-size: 0.95rem; }
        .squad-link-pug:hover { text-decoration: underline; }
        .squad-profile { text-align: center; margin-bottom: 20px; }
        .squad-logo-wrap { margin-bottom: 12px; }
        .squad-logo { width: 80px; height: 80px; border-radius: 16px; object-fit: cover; border: 2px solid rgba(245,166,35,0.25); }
        .squad-logo-placeholder { width: 80px; height: 80px; margin: 0 auto; border-radius: 16px; background: rgba(255,255,255,0.06); border: 2px dashed rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 32px; }
        .squad-description { color: rgba(255,255,255,0.75); font-size: 0.95rem; margin: 0 0 16px; line-height: 1.5; white-space: pre-wrap; max-width: 100%; }
        .squad-medals { margin-top: 16px; }
        .squad-medals-label { color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
        .squad-medals-list { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .squad-medal { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(245,166,35,0.12); border: 1px solid rgba(245,166,35,0.25); border-radius: 8px; font-size: 0.85rem; color: #fff; }
        .squad-medal-icon { font-size: 1rem; }
        .plc-modal-hint { font-size: 12px; color: var(--text-mute); margin-bottom: 8px; }
        .plc-modal-invite-link { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
        .plc-modal-invite-link code { font-size: 11px; word-break: break-all; color: var(--text-dim); }
        .squad-invite-result { display: flex; flex-direction: column; gap: 12px; }
        .squad-invite-link { display: block; font-size: 12px; word-break: break-all; color: var(--text-dim); padding: 12px; background: rgba(255,255,255,0.06); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
        .squad-invite-copy { align-self: flex-start; }

        /* Create Squad modal — card no padrão do app */
        .squad-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .squad-create-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: linear-gradient(180deg, rgba(18, 22, 35, 0.98) 0%, rgba(12, 16, 28, 0.99) 100%);
          border: 1px solid rgba(245, 166, 35, 0.2);
          border-radius: 16px;
          padding: 32px 28px;
          box-shadow: 0 0 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
          overflow: hidden;
        }
        .squad-create-card-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 120px;
          background: radial-gradient(ellipse, rgba(245, 166, 35, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .squad-create-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .squad-create-icon {
          display: block;
          font-size: 40px;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 12px rgba(245, 166, 35, 0.3));
        }
        .squad-create-title {
          font-family: var(--font-head);
          font-size: 1.35rem;
          letter-spacing: 4px;
          color: #fff;
          margin: 0 0 8px;
        }
        .squad-create-desc {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }
        .squad-create-body {
          margin-bottom: 24px;
        }
        .squad-create-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 10px;
        }
        .squad-create-input {
          width: 100%;
          box-sizing: border-box;
          padding: 14px 16px;
          font-size: 1rem;
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .squad-create-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        .squad-create-input:focus {
          border-color: rgba(245, 166, 35, 0.5);
          box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.1);
        }
        .squad-create-char {
          display: block;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 6px;
          text-align: right;
        }
        .squad-create-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        .squad-create-btn-cancel {
          order: 1;
        }
        .squad-create-btn-submit {
          order: 2;
          min-width: 140px;
        }
        .squad-edit-textarea { resize: vertical; min-height: 72px; }
        .squad-edit-medal-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
        .squad-edit-medal-icon { width: 48px; flex-shrink: 0; }
        .squad-edit-medal-title { flex: 1; }
        .squad-edit-medal-remove { width: 36px; height: 36px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); font-size: 1.2rem; cursor: pointer; line-height: 1; padding: 0; }
        .squad-edit-medal-remove:hover { background: rgba(220,80,80,0.3); border-color: rgba(220,80,80,0.5); color: #f88; }
        .squad-edit-add-medal { margin-top: 4px; }
      `}</style>
      {auth.steamId && (
        <LevelProgressFloatingModal
          level={profile.profile?.level ?? 1}
          points={profile.profile?.points ?? 0}
        />
      )}
    </div>
  );
}

function CreateSquadModal({ onConfirm, onCancel }) {
  const [name, setName] = useState('');
  return (
    <div className="squad-modal-backdrop" onClick={onCancel}>
      <div className="squad-create-card" onClick={(e) => e.stopPropagation()}>
        <div className="squad-create-card-glow" aria-hidden />
        <div className="squad-create-header">
          <span className="squad-create-icon" aria-hidden>⚔</span>
          <h3 className="squad-create-title">CRIAR SQUAD</h3>
          <p className="squad-create-desc">Dê um nome ao seu time. Máximo 5 jogadores.</p>
        </div>
        <div className="squad-create-body">
          <label className="squad-create-label" htmlFor="squad-name-input">
            Nome do time
          </label>
          <input
            id="squad-name-input"
            className="squad-create-input"
            type="text"
            placeholder="Ex: Os Caras, Team Alpha..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
            maxLength={128}
            autoFocus
          />
          <span className="squad-create-char">{name.length}/128</span>
        </div>
        <div className="squad-create-actions">
          <TrackedButton type="button" className="pug-btn pug-btn-secondary squad-create-btn-cancel" onClick={onCancel}>
            CANCELAR
          </TrackedButton>
          <TrackedButton
            type="button"
            className="pug-btn pug-btn-primary squad-create-btn-submit"
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
          >
            CRIAR SQUAD
          </TrackedButton>
        </div>
      </div>
    </div>
  );
}

function extractTokenFromInput(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return trimmed;
  try {
    if (trimmed.startsWith('http')) {
      const url = new URL(trimmed);
      return url.searchParams.get('token') || trimmed;
    }
    if (trimmed.includes('token=')) {
      const match = trimmed.match(/token=([^&\s]+)/);
      return match ? decodeURIComponent(match[1]) : trimmed;
    }
  } catch (_) {}
  return trimmed;
}

function JoinSquadModal({ initialToken, onConfirm, onCancel, loading }) {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const handleConfirm = () => {
    const t = extractTokenFromInput(token);
    if (t) onConfirm(t, password);
  };
  return (
    <div className="squad-modal-backdrop" onClick={onCancel}>
      <div className="squad-create-card squad-join-card" onClick={(e) => e.stopPropagation()}>
        <div className="squad-create-card-glow" aria-hidden />
        <div className="squad-create-header">
          <span className="squad-create-icon" aria-hidden>🔗</span>
          <h3 className="squad-create-title">ENTRAR NO SQUAD</h3>
          <p className="squad-create-desc">Cole o link de convite ou o token e digite a senha.</p>
        </div>
        <div className="squad-create-body">
          <label className="squad-create-label" htmlFor="join-token-input">Token ou link</label>
          <input
            id="join-token-input"
            className="squad-create-input"
            type="text"
            placeholder="Token (ou cole o link completo)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <label className="squad-create-label" htmlFor="join-password-input">Senha do convite</label>
          <input
            id="join-password-input"
            className="squad-create-input"
            type="password"
            placeholder="Senha do convite"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && token.trim() && handleConfirm()}
          />
        </div>
        <div className="squad-create-actions">
          <TrackedButton type="button" className="pug-btn pug-btn-secondary" onClick={onCancel}>CANCELAR</TrackedButton>
          <TrackedButton type="button" className="pug-btn pug-btn-primary" onClick={handleConfirm} disabled={!token.trim() || loading}>
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </TrackedButton>
        </div>
      </div>
    </div>
  );
}

function InviteModal({ onGenerate, inviteResult, onClose, loading }) {
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    onGenerate(password, 60 * 24);
  };

  const copyLink = () => {
    if (!inviteResult?.inviteLink) return;
    const fullUrl = `${window.location.origin}${inviteResult.inviteLink}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="squad-modal-backdrop" onClick={onClose}>
      <div className="squad-create-card" onClick={(e) => e.stopPropagation()}>
        <div className="squad-create-card-glow" aria-hidden />
        <div className="squad-create-header">
          <span className="squad-create-icon" aria-hidden>🔗</span>
          <h3 className="squad-create-title">CONVITE PARA O SQUAD</h3>
          <p className="squad-create-desc">
            {!inviteResult
              ? 'Defina uma senha para o convite. Quem entrar precisará informá-la.'
              : 'Compartilhe este link com quem deve entrar. Expira em 24h.'}
          </p>
        </div>
        <div className="squad-create-body">
          {!inviteResult ? (
            <>
              <label className="squad-create-label" htmlFor="invite-password">Senha do convite</label>
              <input
                id="invite-password"
                className="squad-create-input"
                type="password"
                placeholder="Senha do convite"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                autoFocus
              />
            </>
          ) : (
            <div className="squad-invite-result">
              <label className="squad-create-label">Link de convite</label>
              <code className="squad-invite-link">{window.location.origin}{inviteResult.inviteLink}</code>
              <TrackedButton
                type="button"
                className="pug-btn pug-btn-secondary squad-invite-copy"
                onClick={copyLink}
              >
                {copied ? 'COPIADO!' : 'COPIAR LINK'}
              </TrackedButton>
            </div>
          )}
        </div>
        <div className="squad-create-actions">
          {inviteResult ? (
            <TrackedButton type="button" className="pug-btn pug-btn-primary squad-create-btn-submit" onClick={onClose}>
              FECHAR
            </TrackedButton>
          ) : (
            <>
              <TrackedButton type="button" className="pug-btn pug-btn-secondary squad-create-btn-cancel" onClick={onClose}>
                CANCELAR
              </TrackedButton>
              <TrackedButton
                type="button"
                className="pug-btn pug-btn-primary squad-create-btn-submit"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? 'GERANDO...' : 'GERAR LINK'}
              </TrackedButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EditSquadModal({ squad, onSave, onCancel, loading }) {
  const [name, setName] = useState(squad?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(squad?.logoUrl ?? '');
  const [description, setDescription] = useState(squad?.description ?? '');
  const [medals, setMedals] = useState(() => {
    const m = squad?.medals;
    if (Array.isArray(m) && m.length > 0) return m.map((x) => ({ title: x.title || '', icon: x.icon || '' }));
    return [{ title: '', icon: '🏆' }];
  });

  const addMedal = () => setMedals((prev) => [...prev, { title: '', icon: '🏆' }]);
  const removeMedal = (i) => setMedals((prev) => prev.filter((_, idx) => idx !== i));
  const updateMedal = (i, field, value) => setMedals((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  const handleSubmit = () => {
    const payload = {
      name: name.trim(),
      logoUrl: logoUrl.trim() || undefined,
      description: description.trim() || undefined,
      medals: medals.filter((m) => (m.title || '').trim()).map((m) => ({ title: (m.title || '').trim(), icon: (m.icon || '').trim() || null })),
    };
    onSave(payload);
  };

  return (
    <div className="squad-modal-backdrop" onClick={onCancel}>
      <div className="squad-create-card" onClick={(e) => e.stopPropagation()}>
        <div className="squad-create-card-glow" aria-hidden />
        <div className="squad-create-header">
          <span className="squad-create-icon" aria-hidden>✏️</span>
          <h3 className="squad-create-title">EDITAR PERFIL DO SQUAD</h3>
          <p className="squad-create-desc">Logo, descrição e conquistas do time.</p>
        </div>
        <div className="squad-create-body">
          <label className="squad-create-label" htmlFor="edit-squad-name">Nome do time</label>
          <input
            id="edit-squad-name"
            className="squad-create-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={128}
          />
          <span className="squad-create-char">{name.length}/128</span>

          <label className="squad-create-label" htmlFor="edit-squad-logo" style={{ marginTop: '16px' }}>URL do logo</label>
          <input
            id="edit-squad-logo"
            className="squad-create-input"
            type="url"
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />

          <label className="squad-create-label" htmlFor="edit-squad-desc" style={{ marginTop: '16px' }}>Descrição</label>
          <textarea
            id="edit-squad-desc"
            className="squad-create-input squad-edit-textarea"
            placeholder="Descreva seu time..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div style={{ marginTop: '16px' }}>
            <div className="squad-create-label">Conquistas / Medalhas</div>
            {medals.map((m, i) => (
              <div key={i} className="squad-edit-medal-row">
                <input
                  className="squad-create-input squad-edit-medal-icon"
                  type="text"
                  placeholder="🏆"
                  value={m.icon}
                  onChange={(e) => updateMedal(i, 'icon', e.target.value)}
                />
                <input
                  className="squad-create-input squad-edit-medal-title"
                  type="text"
                  placeholder="Ex: Campeão Março 2025"
                  value={m.title}
                  onChange={(e) => updateMedal(i, 'title', e.target.value)}
                />
                <TrackedButton type="button" className="squad-edit-medal-remove" onClick={() => removeMedal(i)} aria-label="Remover">×</TrackedButton>
              </div>
            ))}
            <TrackedButton type="button" className="pug-btn pug-btn-secondary squad-edit-add-medal" onClick={addMedal}>
              + Adicionar medalha
            </TrackedButton>
          </div>
        </div>
        <div className="squad-create-actions">
          <TrackedButton type="button" className="pug-btn pug-btn-secondary squad-create-btn-cancel" onClick={onCancel}>
            CANCELAR
          </TrackedButton>
          <TrackedButton
            type="button"
            className="pug-btn pug-btn-primary squad-create-btn-submit"
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
          >
            {loading ? 'SALVANDO...' : 'SALVAR'}
          </TrackedButton>
        </div>
      </div>
    </div>
  );
}
