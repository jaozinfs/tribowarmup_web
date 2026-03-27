import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { claimMission, getMyWeeklyMissions } from '../services/missionsService';
import '../index.css';
import '../components/MissionsProgressModal.css';
import { TrackedButton } from '../components/TrackedButton';

function clamp(n, min = 0, max = 1_000_000_000) {
  const x = Math.floor(Number(n) || 0);
  return Math.max(min, Math.min(max, x));
}

function progressPct(progress, target) {
  const t = Math.max(1, clamp(target, 1));
  return Math.max(0, Math.min(100, Math.round((clamp(progress) / t) * 100)));
}

function formatExpires(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function MissionsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const profile = useProfile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [claimLoading, setClaimLoading] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const isVip = profile.profile?.isVip === true;
  const profileReady = !profile.loading && profile.profile;
  const showVipPromo = Boolean(profileReady) && !isVip;

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getMyWeeklyMissions();
      setData(res);
    } catch (e) {
      setErr(e?.message || 'Erro ao carregar missões');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.steamId) {
      setData(null);
      setLoading(false);
      return;
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.steamId]);

  const missions = useMemo(() => {
    const list = data?.missions;
    return Array.isArray(list) ? list : [];
  }, [data]);

  const dailyLogin = useMemo(() => data?.dailyLogin ?? null, [data?.dailyLogin]);

  const dailyRow = useMemo(() => {
    if (!dailyLogin) return null;
    const target = clamp(dailyLogin.target, 1);
    const progress = Math.min(clamp(dailyLogin.progress), target);
    const done = Boolean(dailyLogin.completed) || progress >= target;
    const claimed = Boolean(dailyLogin.claimed);
    return { dl: dailyLogin, target, progress, done, claimed };
  }, [dailyLogin]);

  const expiresLabel = useMemo(() => formatExpires(data?.expiresAt), [data?.expiresAt]);

  const handleClaim = async (userMissionId) => {
    if (!userMissionId) return;
    setClaimLoading(userMissionId);
    setErr(null);
    try {
      const result = await claimMission(userMissionId);
      if (result && typeof result === 'object') {
        setClaimSuccess(result);
      }
      try {
        window.dispatchEvent(new CustomEvent('pug:profile-refresh'));
      } catch {}
      await profile.refresh();
      await load();
    } catch (e) {
      setErr(e?.message || 'Erro ao resgatar');
    } finally {
      setClaimLoading(null);
    }
  };

  if (!auth.steamId) {
    return (
      <div className="app">
        <div className="scanlines" />
        <div className="grid-bg" />
        <header className="header">
          <div className="header-left">
            <div className="logo-hex" />
            <div>
              <div className="header-title">MISSÕES</div>
              <div className="header-sub">BATTLE PASS</div>
            </div>
          </div>
          <HamburgerNav activePath="/missions" auth={auth} profile={profile} returnTo="/missions" />
        </header>
        <main className="missions-main missions-main--guest">
          <div className="missions-guest">
            <div className="missions-guest-icon">⭐</div>
            <h2 className="missions-guest-title">Missões semanais</h2>
            <p className="missions-guest-desc">Faça login com Steam para receber 3 missões por semana e resgatar pontos.</p>
            <TrackedButton type="button" className="missions-guest-steam-btn" onClick={() => auth.login('/missions')}>
              ENTRAR COM STEAM
            </TrackedButton>
          </div>
        </main>
        <style>{`
          .missions-main{
            flex: 1;
            padding: 40px 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            z-index: 10;
          }
          .missions-guest{
            max-width: 520px;
            width: 100%;
            text-align: center;
            padding: 56px 40px;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(2,6,23,0.95));
            border: 1px solid rgba(245,158,11,0.18);
            box-shadow: 0 10px 36px rgba(0,0,0,0.35);
          }
          .missions-guest-icon{ font-size: 56px; opacity: 0.9; margin-bottom: 12px; }
          .missions-guest-title{ margin: 0 0 10px; font-family: var(--font-head); letter-spacing: 3px; color: var(--gold); }
          .missions-guest-desc{ margin: 0 0 18px; color: var(--text-dim); line-height: 1.5; }
          .missions-guest-steam-btn{
            padding: 12px 20px;
            border-radius: 10px;
            border: 1px solid rgba(245,158,11,0.45);
            background: linear-gradient(135deg, #f5a623, #c4851a);
            color: #0b1120;
            font-family: var(--font-mono);
            letter-spacing: 2px;
            cursor: pointer;
            font-weight: 900;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="scanlines" />
      <div className="grid-bg" />
      <div className="glow-orb" />
      <header className="header">
        <div className="header-left">
          <div className="logo-hex" />
          <div>
            <div className="header-title">MISSÕES</div>
            <div className="header-sub">SEMANAL · 3 POR SEMANA</div>
          </div>
        </div>
        <HamburgerNav activePath="/missions" auth={auth} profile={profile} returnTo="/missions" />
      </header>

      <main className="missions-main">
        {claimSuccess?.ok ? (
          <div
            className="missions-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="missions-claim-success-title"
            onClick={() => setClaimSuccess(null)}
          >
            <div className="missions-claim-success" onClick={(e) => e.stopPropagation()}>
              <div className="missions-claim-success-glow" aria-hidden />
              <div className="missions-claim-success-icon" aria-hidden>✦</div>
              <h2 id="missions-claim-success-title" className="missions-claim-success-title">
                Recompensa resgatada
              </h2>
              <p className="missions-claim-success-mission">{claimSuccess.missionName || 'Missão'}</p>
              <div className="missions-claim-success-points">
                <span className="missions-claim-success-delta">+{clamp(claimSuccess.rewardPoints)}</span>
                <span className="missions-claim-success-pts">pontos</span>
                {Number(claimSuccess.vipMultiplier) > 1 ? (
                  <span className="missions-claim-success-vip">VIP ×{claimSuccess.vipMultiplier}</span>
                ) : null}
              </div>
              <p className="missions-claim-success-balance">
                Pontos do sorteio (mês atual): <strong>{clamp(claimSuccess.giveawayPointsAfter)}</strong>
                <span className="missions-claim-success-balance-hint"> — mesmos pontos que você ganha jogando; troque por fichas na roleta.</span>
              </p>
              <TrackedButton
                type="button"
                className="pug-btn pug-btn-primary missions-claim-success-btn"
                onClick={() => setClaimSuccess(null)}
              >
                OK
              </TrackedButton>
            </div>
          </div>
        ) : null}

        <div className="missions-wrap">
          <div className="missions-top">
            <div className="missions-top-left">
              <div className="missions-top-title">Suas missões da semana</div>
              <div className="missions-top-sub">
                {data?.weekKey ? <span>Semana: <strong>{data.weekKey}</strong></span> : null}
                {expiresLabel ? <span>· Reseta: <strong>{expiresLabel}</strong></span> : null}
                {isVip ? <span className="missions-vip-pill">VIP 3x pontos</span> : null}
              </div>
            </div>
          </div>

          {!loading && showVipPromo ? (
            <div className="missions-vip-promo">
              <div className="missions-vip-promo-glow" aria-hidden />
              <div className="missions-vip-promo-left">
                <div className="missions-vip-promo-title">Aproveite o VIP</div>
                <div className="missions-vip-promo-desc">
                  Ative o VIP e resgate missões com <strong>3x mais pontos</strong>. É a forma mais rápida de upar e garantir recompensas com mais frequência.
                </div>
                <div className="missions-vip-promo-bullets">
                  <span className="missions-vip-promo-bullet">• +3x no resgate de missões</span>
                  <span className="missions-vip-promo-bullet">• Melhor ritmo no battle pass</span>
                </div>
              </div>
              <div className="missions-vip-promo-right">
                <TrackedButton
                  type="button"
                  className="pug-btn pug-btn-primary missions-vip-promo-btn"
                  onClick={() => navigate('/vip')}
                >
                  Ativar VIP
                </TrackedButton>
              </div>
            </div>
          ) : null}

          {err ? (
            <div className="missions-error" role="alert">{err}</div>
          ) : null}

          {!loading && dailyRow ? (
            <div className="missions-daily-wrap">
              <div className="missions-daily-head">
                <span className="missions-daily-title">Login diário</span>
                <span className="missions-daily-pill">Todo dia · não reseta com a semana</span>
              </div>
              <div className={`missions-row missions-row--daily ${dailyRow.done ? 'missions-row--done' : ''}`}>
                <div className="missions-row-left">
                  <div className="missions-row-title">
                    <span className="missions-row-index missions-row-index--daily">☀</span>
                    <span className="missions-row-name">{dailyRow.dl.name}</span>
                    {dailyRow.claimed ? (
                      <span className="missions-row-badge missions-row-badge--claimed">RESGATADA HOJE</span>
                    ) : dailyRow.done ? (
                      <span className="missions-row-badge missions-row-badge--done">CONCLUÍDA</span>
                    ) : (
                      <span className="missions-row-badge">EM ANDAMENTO</span>
                    )}
                  </div>
                  <div className="missions-row-desc">{dailyRow.dl.description}</div>
                  <div className="missions-row-bar">
                    <div
                      className="missions-row-bar-fill"
                      style={{ width: `${progressPct(dailyRow.progress, dailyRow.target)}%` }}
                    />
                  </div>
                  <div className="missions-row-meta">
                    <span className="missions-row-progress">
                      {dailyRow.progress}/{dailyRow.target}
                    </span>
                    <span className="missions-row-reward">
                      Recompensa: <strong>+{clamp(dailyRow.dl.reward_points)} pts</strong>
                      {isVip ? <span className="missions-row-mult"> ×3</span> : null}
                    </span>
                  </div>
                </div>
                <div className="missions-row-right">
                  <TrackedButton
                    type="button"
                    className={`pug-btn ${dailyRow.done && !dailyRow.claimed ? 'pug-btn-primary' : 'pug-btn-secondary'}`}
                    disabled={
                      !dailyRow.done
                      || dailyRow.claimed
                      || claimLoading === dailyRow.dl.userMissionId
                    }
                    onClick={() => handleClaim(dailyRow.dl.userMissionId)}
                    title={
                      dailyRow.claimed
                        ? 'Volte amanhã para resgatar de novo'
                        : dailyRow.done
                          ? 'Resgatar recompensa'
                          : 'Faça login no site hoje'
                    }
                  >
                    {dailyRow.claimed
                      ? 'Resgatada hoje'
                      : claimLoading === dailyRow.dl.userMissionId
                        ? 'Resgatando...'
                        : 'Resgatar'}
                  </TrackedButton>
                </div>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="missions-loading">
              <div className="spinner" />
              <span>Carregando missões...</span>
            </div>
          ) : (
            <div className="missions-modal">
              <div className="missions-modal-head">
                <div className="missions-modal-head-row">
                  <div>
                    <div className="missions-modal-title">BATTLE PASS · MISSÕES SEMANAIS</div>
                    <div className="missions-modal-sub">
                      <span>Complete nas partidas automaticamente.</span>
                      {isVip ? <span className="missions-modal-vip">VIP: +3x pontos por missão</span> : <span className="missions-modal-vip missions-modal-vip--off">VIP: 3x pontos</span>}
                    </div>
                  </div>
                  <div className="missions-modal-actions">
                    <TrackedButton type="button" className="pug-btn pug-btn-secondary" onClick={load} disabled={loading}>
                      {loading ? '...' : 'Atualizar'}
                    </TrackedButton>
                  </div>
                </div>
              </div>
              <div className="missions-modal-rows">
                {missions.map((m, idx) => {
                  const target = clamp(m.target, 1);
                  const progress = Math.min(clamp(m.progress), target);
                  const done = Boolean(m.completed) || progress >= target;
                  const claimed = Boolean(m.claimed);
                  const p = progressPct(progress, target);
                  return (
                    <div key={m.userMissionId} className={`missions-row ${done ? 'missions-row--done' : ''}`}>
                      <div className="missions-row-left">
                        <div className="missions-row-title">
                          <span className="missions-row-index">{idx + 1}</span>
                          <span className="missions-row-name">{m.name}</span>
                          {done ? <span className="missions-row-badge missions-row-badge--done">CONCLUÍDA</span> : <span className="missions-row-badge">EM ANDAMENTO</span>}
                        </div>
                        <div className="missions-row-desc">{m.description}</div>
                        <div className="missions-row-bar">
                          <div className="missions-row-bar-fill" style={{ width: `${p}%` }} />
                        </div>
                        <div className="missions-row-meta">
                          <span className="missions-row-progress">{progress}/{target}</span>
                          <span className="missions-row-reward">
                            Recompensa: <strong>+{clamp(m.reward_points)} pts</strong>{isVip ? <span className="missions-row-mult"> ×3</span> : null}
                          </span>
                        </div>
                      </div>
                      <div className="missions-row-right">
                        <TrackedButton
                          type="button"
                          className={`pug-btn ${done ? 'pug-btn-primary' : 'pug-btn-secondary'}`}
                          disabled={!done || claimed || claimLoading === m.userMissionId}
                          onClick={() => handleClaim(m.userMissionId)}
                          title={claimed ? 'Já resgatada' : done ? 'Resgatar recompensa' : 'Complete a missão para resgatar'}
                        >
                          {claimed ? 'Resgatada' : claimLoading === m.userMissionId ? 'Resgatando...' : 'Resgatar'}
                        </TrackedButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .missions-main{
          flex: 1;
          padding: 34px 22px 70px;
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: center;
        }
        .missions-wrap{ width: 100%; max-width: 1200px; }
        .missions-top{
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .missions-top-title{
          font-family: var(--font-head);
          letter-spacing: 3px;
          font-size: 1.05rem;
          color: #fff;
        }
        .missions-top-sub{
          margin-top: 6px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          color: rgba(148,163,184,0.95);
          font-size: 0.85rem;
        }
        .missions-vip-pill{
          padding: 4px 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(245,158,11,0.95), rgba(239,68,68,0.85));
          color: #0b1120;
          font-weight: 900;
          letter-spacing: 0.5px;
        }
        .missions-top-actions{ display: flex; gap: 10px; flex-wrap: wrap; }
        .missions-daily-wrap{
          margin-bottom: 16px;
          padding: 14px 16px 16px;
          border-radius: 16px;
          border: 1px solid rgba(96,165,250,0.35);
          background: linear-gradient(135deg, rgba(30,58,138,0.35), rgba(15,23,42,0.75));
          box-shadow: 0 12px 40px rgba(0,0,0,0.25);
        }
        .missions-daily-head{
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .missions-daily-title{
          font-family: var(--font-head);
          letter-spacing: 2px;
          font-size: 0.95rem;
          color: rgba(191,219,254,0.98);
        }
        .missions-daily-pill{
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.4px;
          background: rgba(59,130,246,0.2);
          border: 1px solid rgba(96,165,250,0.45);
          color: rgba(191,219,254,0.95);
        }
        .missions-row--daily{
          border-color: rgba(96,165,250,0.28);
          background: rgba(15,23,42,0.45);
        }
        .missions-row-index--daily{
          background: rgba(59,130,246,0.2);
          border-color: rgba(96,165,250,0.35);
          color: rgba(191,219,254,0.95);
          font-size: 14px;
        }
        .missions-row-badge--claimed{
          border-color: rgba(148,163,184,0.35);
          background: rgba(148,163,184,0.12);
          color: rgba(226,232,240,0.75);
        }
        .missions-error{
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.12);
          color: rgba(252,165,165,0.95);
          margin-bottom: 12px;
        }
        .missions-vip-promo{
          position: relative;
          display: flex;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          padding: 16px 16px;
          border-radius: 16px;
          border: 1px solid rgba(245,158,11,0.35);
          background: radial-gradient(120% 120% at 10% 0%, rgba(245,158,11,0.18) 0%, rgba(15,23,42,0.85) 55%, rgba(2,6,23,0.95) 100%);
          box-shadow: 0 18px 60px rgba(0,0,0,0.35);
          overflow: hidden;
          margin-bottom: 12px;
        }
        .missions-vip-promo-glow{
          position: absolute;
          inset: -2px;
          border-radius: 16px;
          pointer-events: none;
          background: linear-gradient(135deg, rgba(245,158,11,0.22), transparent 40%, rgba(59,130,246,0.10));
          opacity: 0.9;
        }
        .missions-vip-promo-left{
          position: relative;
          flex: 1 1 520px;
          min-width: 260px;
        }
        .missions-vip-promo-title{
          font-family: var(--font-head);
          letter-spacing: 2px;
          font-size: 0.98rem;
          font-weight: 900;
          color: rgba(253,230,138,0.98);
          margin-bottom: 8px;
        }
        .missions-vip-promo-desc{
          color: rgba(226,232,240,0.9);
          line-height: 1.45;
          font-size: 0.9rem;
          margin-bottom: 10px;
        }
        .missions-vip-promo-bullets{
          display: flex;
          flex-wrap: wrap;
          gap: 8px 14px;
          color: rgba(148,163,184,0.95);
          font-weight: 800;
          font-size: 0.85rem;
        }
        .missions-vip-promo-bullet{
          white-space: nowrap;
        }
        .missions-vip-promo-right{
          position: relative;
          flex: 0 0 auto;
        }
        .missions-vip-promo-btn{
          padding: 12px 20px;
          border-radius: 12px;
          min-width: 170px;
        }
        .missions-loading{
          padding: 24px;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.25);
          background: rgba(15,23,42,0.6);
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(226,232,240,0.9);
        }
        .missions-modal{
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.25);
          background: radial-gradient(120% 120% at 10% 0%, rgba(245,158,11,0.12) 0%, rgba(15,23,42,0.92) 40%, rgba(2,6,23,0.96) 100%);
          box-shadow: 0 18px 60px rgba(0,0,0,0.45);
          overflow: hidden;
        }
        .missions-modal-head{
          padding: 16px 18px 12px;
          border-bottom: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.55);
        }
        .missions-modal-head-row{
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .missions-modal-actions{
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .missions-modal-title{
          font-family: var(--font-head);
          letter-spacing: 3px;
          font-size: 1rem;
          color: rgba(226,232,240,0.95);
        }
        .missions-modal-sub{
          margin-top: 6px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          color: rgba(148,163,184,0.95);
          font-size: 0.85rem;
          align-items: center;
        }
        .missions-modal-vip{
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(245,158,11,0.14);
          border: 1px solid rgba(245,158,11,0.35);
          color: rgba(253,230,138,0.95);
          font-weight: 900;
        }
        .missions-modal-vip--off{
          opacity: 0.8;
          background: rgba(148,163,184,0.10);
          border-color: rgba(148,163,184,0.22);
          color: rgba(226,232,240,0.8);
        }
        .missions-modal-rows{
          display: grid;
          gap: 10px;
          padding: 14px 18px 18px;
        }
        .missions-row{
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.20);
          background: rgba(15,23,42,0.55);
          padding: 12px 12px;
          align-items: center;
        }
        .missions-row--done{
          border-color: rgba(34,197,94,0.45);
          background: rgba(34,197,94,0.06);
          box-shadow: 0 0 0 1px rgba(34,197,94,0.08);
        }
        .missions-row-title{
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .missions-row-index{
          width: 26px;
          height: 26px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-weight: 900;
          font-size: 12px;
          color: rgba(253,230,138,0.95);
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.25);
          flex-shrink: 0;
        }
        .missions-row-name{
          font-weight: 900;
          color: rgba(226,232,240,0.95);
        }
        .missions-row-badge{
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.24);
          background: rgba(148,163,184,0.10);
          font-weight: 900;
          letter-spacing: 0.3px;
          color: rgba(226,232,240,0.78);
          font-size: 12px;
        }
        .missions-row-badge--done{
          border-color: rgba(34,197,94,0.42);
          background: rgba(34,197,94,0.14);
          color: rgba(134,239,172,0.95);
        }
        .missions-row-desc{
          margin-top: 6px;
          color: rgba(148,163,184,0.95);
          font-size: 0.85rem;
          line-height: 1.35;
        }
        .missions-row-bar{
          margin-top: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(148,163,184,0.14);
          overflow: hidden;
        }
        .missions-row-bar-fill{
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(245,158,11,0.92), rgba(59,130,246,0.86));
          box-shadow: 0 0 18px rgba(245,158,11,0.18);
          transition: width 0.35s ease;
        }
        .missions-row-meta{
          margin-top: 8px;
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
          color: rgba(148,163,184,0.95);
          font-size: 0.85rem;
        }
        .missions-row-progress{
          font-family: var(--font-mono);
          color: rgba(226,232,240,0.9);
          font-weight: 900;
        }
        .missions-row-reward strong{ color: rgba(245,158,11,0.95); }
        .missions-row-mult{ color: rgba(253,230,138,0.95); font-weight: 900; }
        @media (max-width: 700px){
          .missions-row{ grid-template-columns: 1fr; }
          .missions-row-right{ display: flex; justify-content: flex-end; }
        }
        .missions-claim-success{
          position: relative;
          width: min(420px, 100%);
          border-radius: 18px;
          border: 1px solid rgba(245,158,11,0.45);
          background: radial-gradient(120% 120% at 50% 0%, rgba(245,158,11,0.22) 0%, rgba(15,23,42,0.96) 55%, rgba(2,6,23,0.98) 100%);
          box-shadow: 0 24px 80px rgba(0,0,0,0.55), 0 0 60px rgba(245,158,11,0.12);
          padding: 28px 22px 22px;
          text-align: center;
          color: #e2e8f0;
        }
        .missions-claim-success-glow{
          position: absolute;
          inset: -1px;
          border-radius: 18px;
          pointer-events: none;
          background: linear-gradient(135deg, rgba(245,158,11,0.15), transparent 40%, rgba(59,130,246,0.08));
          opacity: 0.9;
        }
        .missions-claim-success-icon{
          position: relative;
          font-size: 2.2rem;
          line-height: 1;
          margin-bottom: 8px;
          color: rgba(253,230,138,0.95);
          text-shadow: 0 0 24px rgba(245,158,11,0.5);
        }
        .missions-claim-success-title{
          position: relative;
          margin: 0 0 8px;
          font-family: var(--font-head);
          letter-spacing: 3px;
          font-size: 1rem;
          color: rgba(226,232,240,0.98);
        }
        .missions-claim-success-mission{
          position: relative;
          margin: 0 0 16px;
          color: rgba(148,163,184,0.95);
          font-size: 0.9rem;
          line-height: 1.35;
        }
        .missions-claim-success-points{
          position: relative;
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: center;
          gap: 8px 10px;
          margin-bottom: 12px;
        }
        .missions-claim-success-delta{
          font-family: var(--font-mono);
          font-size: 2.1rem;
          font-weight: 900;
          color: rgba(245,158,11,0.98);
          text-shadow: 0 0 28px rgba(245,158,11,0.35);
        }
        .missions-claim-success-pts{
          font-weight: 800;
          letter-spacing: 1px;
          color: rgba(226,232,240,0.9);
        }
        .missions-claim-success-vip{
          padding: 4px 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(245,158,11,0.95), rgba(239,68,68,0.85));
          color: #0b1120;
          font-weight: 900;
          font-size: 0.75rem;
        }
        .missions-claim-success-balance{
          position: relative;
          margin: 0 0 18px;
          font-size: 0.9rem;
          color: rgba(148,163,184,0.95);
        }
        .missions-claim-success-balance strong{
          color: rgba(226,232,240,0.98);
        }
        .missions-claim-success-balance-hint{
          display: block;
          margin-top: 8px;
          font-size: 0.78rem;
          line-height: 1.4;
          color: rgba(148,163,184,0.88);
          font-weight: 500;
        }
        .missions-claim-success-levelup{
          color: rgba(34,197,94,0.95);
          font-weight: 800;
        }
        .missions-claim-success-btn{
          position: relative;
          width: 100%;
          max-width: 280px;
        }
      `}</style>
    </div>
  );
}

