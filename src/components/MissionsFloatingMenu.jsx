import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyWeeklyMissions } from '../services/missionsService';
import './MissionsFloatingMenu.css';
import { TrackedButton } from './TrackedButton';

function clamp(n, min = 0, max = 1_000_000_000) {
  const x = Math.floor(Number(n) || 0);
  return Math.max(min, Math.min(max, x));
}

function pct(progress, target) {
  const t = Math.max(1, clamp(target, 1));
  return Math.max(0, Math.min(100, Math.round((clamp(progress) / t) * 100)));
}

export function MissionsFloatingMenu({ steamId, isVip }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const missions = useMemo(() => (Array.isArray(data?.missions) ? data.missions : []), [data]);
  const dailyLogin = useMemo(() => data?.dailyLogin ?? null, [data]);
  const dailyFloat = useMemo(() => {
    if (!dailyLogin) return null;
    const target = clamp(dailyLogin.target, 1);
    const prog = Math.min(clamp(dailyLogin.progress), target);
    const done = Boolean(dailyLogin.completed) || prog >= target;
    const claimed = Boolean(dailyLogin.claimed);
    const w = pct(prog, target);
    return { dailyLogin, target, prog, done, claimed, w };
  }, [dailyLogin]);
  const completedCount = missions.filter((m) => Boolean(m?.completed) || clamp(m?.progress) >= clamp(m?.target, 1)).length;

  const load = async () => {
    if (!steamId) return;
    setLoading(true);
    try {
      const res = await getMyWeeklyMissions();
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (steamId) return;
    setOpen(false);
    setData(null);
    setLoading(false);
  }, [steamId]);

  useEffect(() => {
    if (!steamId) return;
    load();
    const id = window.setInterval(() => {
      if (!open) load();
    }, 20_000);
    const onFinished = () => load();
    window.addEventListener('pug:match-finished', onFinished);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pug:match-finished', onFinished);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steamId, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!steamId) return null;

  return (
    <div className="missions-float" ref={ref}>
      <TrackedButton
        type="button"
        className={`missions-float-btn ${open ? 'missions-float-btn--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Missões"
        title="Missões semanais"
      >
        <span className="missions-float-icon" aria-hidden>★</span>
        <span className="missions-float-badge" title={`${completedCount}/3 concluídas`}>
          {completedCount}/3
        </span>
      </TrackedButton>

      <div className={`missions-float-pop ${open ? 'missions-float-pop--open' : ''}`}>
        <div className="missions-float-pop-head">
          <div className="missions-float-pop-title">Missões</div>
          {isVip ? <span className="missions-float-vip">VIP 3x</span> : null}
        </div>

        {loading && missions.length === 0 && !dailyLogin ? (
          <div className="missions-float-empty">Carregando...</div>
        ) : missions.length === 0 && !dailyLogin ? (
          <div className="missions-float-empty">Sem missões ativas.</div>
        ) : (
          <div className="missions-float-list">
            {dailyFloat ? (
              <div
                key={`daily-${dailyFloat.dailyLogin.userMissionId}`}
                className={`missions-float-item missions-float-item--daily ${dailyFloat.done ? 'missions-float-item--done' : ''}`}
              >
                <div className="missions-float-item-top">
                  <span className="missions-float-item-name">☀ {dailyFloat.dailyLogin.name}</span>
                  <span className="missions-float-item-num">{dailyFloat.claimed ? '✓' : `${dailyFloat.prog}/${dailyFloat.target}`}</span>
                </div>
                <div className="missions-float-bar">
                  <div className="missions-float-bar-fill" style={{ width: `${dailyFloat.claimed ? 100 : dailyFloat.w}%` }} />
                </div>
                <div className="missions-float-daily-hint">Login diário · novo ciclo a cada dia (fuso do site)</div>
              </div>
            ) : null}
            {missions.slice(0, 3).map((m) => {
              const target = clamp(m.target, 1);
              const prog = Math.min(clamp(m.progress), target);
              const done = Boolean(m.completed) || prog >= target;
              const w = pct(prog, target);
              return (
                <div key={m.userMissionId} className={`missions-float-item ${done ? 'missions-float-item--done' : ''}`}>
                  <div className="missions-float-item-top">
                    <span className="missions-float-item-name">{m.name}</span>
                    <span className="missions-float-item-num">{prog}/{target}</span>
                  </div>
                  <div className="missions-float-bar">
                    <div className="missions-float-bar-fill" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="missions-float-actions">
          <TrackedButton
            type="button"
            className="missions-float-link"
            onClick={() => { setOpen(false); navigate('/missions'); }}
          >
            Abrir página
          </TrackedButton>
          <TrackedButton type="button" className="missions-float-refresh" onClick={load} disabled={loading}>
            {loading ? '...' : 'Atualizar'}
          </TrackedButton>
        </div>
      </div>
    </div>
  );
}

