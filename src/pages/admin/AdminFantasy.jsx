import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminToken } from '../../services/adminWheelApi';
import {
  clearAdminFantasyCache,
  fetchAdminFantasyStatus,
  getAdminFantasyJob,
  repairAdminFantasyWeek,
  refreshAdminFantasy,
  refreshNowAdminFantasy,
  resetAdminFantasyTeam,
  simulateAdminFantasyWeek,
  startAdminFantasyRebuildAll,
  syncFullAdminFantasy,
} from '../../services/adminFantasyApi';
import AdminTabs from '../../components/admin/AdminTabs';
import '../../index.css';
import { TrackedButton } from '../../components/TrackedButton';

export default function AdminFantasy() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState(null);
  const [weekKey, setWeekKey] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetSteamId, setResetSteamId] = useState('');
  const [job, setJob] = useState(null);
  const [forceUnsafeRebuild, setForceUnsafeRebuild] = useState(false);

  const loadStatus = async (wk) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminFantasyStatus(wk || undefined);
      setStatus(data);
      if (!weekKey && data.weekKey) setWeekKey(data.weekKey);
    } catch (err) {
      setError(err?.message || 'Falha ao carregar status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = getAdminToken();
    if (!t) return;
    verifyAdminToken()
      .then(() => {
        setAuthorized(true);
        return loadStatus('');
      })
      .catch(() => {
        setAdminToken(null);
        setAuthorized(false);
      });
  }, []);

  const handleSubmitToken = (e) => {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    setAuthError(null);
    setAdminToken(t);
    setTokenInput('');
    verifyAdminToken()
      .then(() => {
        setAuthorized(true);
        loadStatus('');
      })
      .catch((err) => {
        setAdminToken(null);
        setAuthorized(false);
        setAuthError(err?.message || 'Token inválido.');
      });
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAuthorized(false);
    setStatus(null);
    setMessage('');
    setError('');
  };

  const handleClearCache = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await clearAdminFantasyCache();
      setMessage(res.message || 'Cache limpo.');
      await loadStatus(weekKey);
    } catch (err) {
      setError(err?.message || 'Falha ao limpar cache.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await refreshAdminFantasy(weekKey || undefined);
      setMessage(`Atualizado (${res.source}): ${res.playersFetched} players · ${res.packsAvailable} packs`);
      await loadStatus(weekKey);
    } catch (err) {
      setError(err?.message || 'Falha no refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshNow = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await refreshNowAdminFantasy(weekKey || undefined);
      setMessage(`Refresh manual (${res.source}): ${res.playersFetched} players`);
      await loadStatus(weekKey);
    } catch (err) {
      setError(err?.message || 'Falha no refresh manual.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFull = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await syncFullAdminFantasy(weekKey || undefined);
      const parts = [
        res.message || 'Sincronização completa.',
        typeof res.playersMerged === 'number' && `merge: ${res.playersMerged}`,
        typeof res.dbRows === 'number' && `DB: ${res.dbRows}`,
        typeof res.durationMs === 'number' && `${res.durationMs}ms`,
      ].filter(Boolean);
      setMessage(parts.join(' · '));
      await loadStatus(weekKey);
    } catch (err) {
      setError(err?.message || 'Falha na sincronização completa.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateWeek = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await simulateAdminFantasyWeek(weekKey || undefined);
      const parts = [
        res.queued ? `Job enfileirado (${res.jobId})` : 'Semana processada',
        res.weekKey && `week: ${res.weekKey}`,
        typeof res.playersProcessed === 'number' && `players: ${res.playersProcessed}`,
        typeof res.processedTeams === 'number' && `teams: ${res.processedTeams}`,
      ].filter(Boolean);
      setMessage(parts.join(' · '));
      await loadStatus(weekKey);
    } catch (err) {
      setError(err?.message || 'Falha ao simular virada semanal.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetTeam = async () => {
    const sid = resetSteamId.trim();
    if (!sid) return;
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await resetAdminFantasyTeam({ steamId: sid, weekKey: weekKey || undefined });
      setMessage(`Reset: ${res.deleted ? 'ok' : 'nada para deletar'} · steamId ${res.steamId} · week ${res.weekKey}`);
      await loadStatus(weekKey);
    } catch (err) {
      setError(err?.message || 'Falha ao resetar time.');
    } finally {
      setLoading(false);
    }
  };

  const handleRepairWeek = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await repairAdminFantasyWeek(weekKey || undefined);
      setMessage(res?.message || 'Repair da semana concluído.');
      await loadStatus(weekKey);
    } catch (err) {
      setError(err?.message || 'Falha no repair da semana.');
    } finally {
      setLoading(false);
    }
  };

  const pollJob = async (jobId) => {
    let keep = true;
    while (keep) {
      // eslint-disable-next-line no-await-in-loop
      const j = await getAdminFantasyJob(jobId);
      setJob(j);
      if (j.status === 'done' || j.status === 'failed') {
        keep = false;
          if (j.status === 'done') {
          setMessage(`Resync concluído · week ${j.result?.weekKey} · players DB ${j.result?.dbPlayers ?? '-'}`);
          await loadStatus(weekKey);
        } else {
        setError(j.error || 'Resync falhou.');
        }
      } else {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 1100));
      }
    }
  };

  const handleRebuildAll = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    setJob(null);
    try {
      const res = await startAdminFantasyRebuildAll(weekKey || undefined, { forceUnsafe: forceUnsafeRebuild });
      setLoading(false);
      await pollJob(res.jobId);
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Falha ao iniciar rebuild global.');
    }
  };

  if (!authorized) {
    return (
      <div className="wheel-admin-page">
        <div className="wheel-admin-gate">
          <h1 className="wheel-admin-gate-title">Admin — Fantasy</h1>
          <p className="wheel-admin-gate-desc">Digite o token de administrador para continuar.</p>
          {authError && <p className="wheel-admin-gate-error" role="alert">{authError}</p>}
          <form onSubmit={handleSubmitToken} className="wheel-admin-gate-form">
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Token admin" className="wheel-admin-gate-input" autoComplete="off" />
            <TrackedButton type="submit" className="wheel-admin-gate-btn">Entrar</TrackedButton>
          </form>
          <TrackedButton type="button" className="wheel-admin-gate-back" onClick={() => navigate('/')}>Voltar ao site</TrackedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="wheel-admin-page">
      <header className="wheel-admin-header">
        <div className="wheel-admin-header-inner">
          <h1 className="wheel-admin-title">Admin Fantasy</h1>
          <TrackedButton type="button" className="wheel-admin-logout" onClick={handleLogout}>Sair</TrackedButton>
        </div>
      </header>
      <AdminTabs />
      <main className="admin-endpoints-main">
        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Operações</h2>
          <div className="admin-endpoints-form">
            <label className="admin-endpoints-field">
              <span>Week Key</span>
              <input type="text" value={weekKey} onChange={(e) => setWeekKey(e.target.value)} className="admin-endpoints-input" placeholder="2026-W13" />
            </label>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={() => loadStatus(weekKey)} disabled={loading}>Status</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={handleRefresh} disabled={loading}>Refresh dados</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={handleRefreshNow} disabled={loading}>Rodar cron agora</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={handleSyncFull} disabled={loading}>Sync completo (DB)</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={handleRepairWeek} disabled={loading}>Repair semana (HLTV)</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={handleClearCache} disabled={loading}>Limpar cache</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={handleSimulateWeek} disabled={loading}>Simular virada semanal</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={handleRebuildAll} disabled={loading}>Reset cache + resync HLTV</TrackedButton>
          </div>
          <div className="admin-endpoints-form" style={{ marginTop: 8 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={forceUnsafeRebuild}
                onChange={(e) => setForceUnsafeRebuild(e.target.checked)}
              />
              Forçar rebuild mesmo com fonte fraca (modo debug)
            </label>
          </div>
          <div className="admin-endpoints-form" style={{ marginTop: 10 }}>
            <label className="admin-endpoints-field">
              <span>Resetar time (steamId)</span>
              <input type="text" value={resetSteamId} onChange={(e) => setResetSteamId(e.target.value)} className="admin-endpoints-input" placeholder="7656119..." />
            </label>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={handleResetTeam} disabled={loading || !resetSteamId.trim()}>Resetar time da semana</TrackedButton>
          </div>
          {message ? <div className="admin-endpoints-ok">{message}</div> : null}
          {error ? <div className="admin-endpoints-err">{error}</div> : null}
          {job ? (
            <div style={{ marginTop: 10, border: '1px solid rgba(148,163,184,.35)', borderRadius: 8, padding: 10 }}>
              <div><strong>Job:</strong> {job.id}</div>
              <div><strong>Status:</strong> {job.status}</div>
              <div><strong>Progresso:</strong> {job.progress}%</div>
              <div><strong>Etapa:</strong> {job.message}</div>
            </div>
          ) : null}
        </section>

        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Status atual</h2>
          <p className="admin-endpoints-section-desc">Visão rápida da saúde dos dados do fantasy.</p>
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Semana:</strong> {status?.weekKey || '-'}</div>
            <div><strong>Fonte:</strong> {status?.source || '-'}</div>
            <div><strong>Players (fonte remota HLTV):</strong> {status?.playersRemote ?? '-'}</div>
            <div><strong>Players (pool exibido / sync):</strong> {status?.playersFetched ?? '-'}</div>
            <div><strong>Packs disponíveis:</strong> {status?.packsAvailable ?? '-'}</div>
            <div><strong>Players no DB (semana):</strong> {status?.dbPlayers ?? '-'}</div>
          </div>
        </section>
      </main>

      <style>{`
        .wheel-admin-page { min-height: 100vh; background: #0f172a; color: #e2e8f0; padding-bottom: 40px; }
        .wheel-admin-header { border-bottom: 1px solid #334155; }
        .wheel-admin-header-inner { max-width: 1200px; margin: 0 auto; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
        .wheel-admin-title { font-size: 1.2rem; margin: 0; }
        .wheel-admin-logout { padding: 6px 12px; border-radius: 6px; border: 1px solid #475569; background: transparent; color: #94a3b8; cursor: pointer; font-size: 0.85rem; }
        .admin-endpoints-main { max-width: 1200px; margin: 0 auto; padding: 24px 20px; }
        .admin-endpoints-section { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
        .admin-endpoints-section-title { font-size: 1.1rem; margin: 0 0 8px; color: #f59e0b; }
        .admin-endpoints-section-desc { color: #94a3b8; font-size: 0.9rem; margin: 0 0 16px; }
        .admin-endpoints-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
        .admin-endpoints-field { display: flex; flex-direction: column; gap: 4px; }
        .admin-endpoints-field span { font-size: 0.8rem; color: #94a3b8; }
        .admin-endpoints-input { padding: 8px 12px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 0.9rem; min-width: 220px; }
        .admin-endpoints-btn { padding: 8px 16px; border-radius: 6px; background: #f59e0b; color: #0f172a; font-weight: 600; border: none; cursor: pointer; font-size: 0.9rem; }
        .admin-endpoints-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .admin-endpoints-ok { margin-top: 12px; padding: 10px; background: rgba(34,197,94,0.2); border: 1px solid #22c55e; border-radius: 6px; color: #86efac; font-size: 0.9rem; }
        .admin-endpoints-err { margin-top: 12px; padding: 10px; background: rgba(239,68,68,0.2); border: 1px solid #ef4444; border-radius: 6px; color: #fca5a5; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}

