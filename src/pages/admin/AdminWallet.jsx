import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminToken } from '../../services/adminWheelApi';
import { clearAdminWalletCache, clearAdminWalletInventory, fetchAdminWalletStatus, refreshNowAdminWallet, testAdminCsfloat } from '../../services/adminWalletApi';
import AdminTabs from '../../components/admin/AdminTabs';
import { TrackedButton } from '../../components/TrackedButton';
import '../../index.css';

export default function AdminWallet() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [targetSteamId, setTargetSteamId] = useState('');
  const [testSkinName, setTestSkinName] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const s = await fetchAdminWalletStatus();
      setStatus(s);
    } catch (e) {
      setError(e?.message || 'Falha ao carregar status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = getAdminToken();
    if (!t) return;
    verifyAdminToken().then(() => {
      setAuthorized(true);
      load();
    }).catch(() => {
      setAdminToken(null);
      setAuthorized(false);
    });
  }, []);

  const submitToken = (e) => {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    setAuthError('');
    setAdminToken(t);
    setTokenInput('');
    verifyAdminToken().then(() => {
      setAuthorized(true);
      load();
    }).catch((err) => {
      setAdminToken(null);
      setAuthorized(false);
      setAuthError(err?.message || 'Token inválido.');
    });
  };

  if (!authorized) {
    return (
      <div className="wheel-admin-page">
        <div className="wheel-admin-gate">
          <h1 className="wheel-admin-gate-title">Admin — Wallet</h1>
          <p className="wheel-admin-gate-desc">Digite o token de administrador para continuar.</p>
          {authError ? <p className="wheel-admin-gate-error">{authError}</p> : null}
          <form onSubmit={submitToken} className="wheel-admin-gate-form">
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
          <h1 className="wheel-admin-title">Admin Wallet</h1>
          <TrackedButton type="button" className="wheel-admin-logout" onClick={() => { setAdminToken(null); setAuthorized(false); }}>Sair</TrackedButton>
        </div>
      </header>
      <AdminTabs />
      <main className="admin-endpoints-main">
        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Operações</h2>
          <div className="admin-endpoints-form">
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={load} disabled={loading}>Atualizar status</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={async () => {
              setLoading(true); setError(''); setMessage('');
              try {
                const res = await clearAdminWalletCache();
                setMessage(`${res.message} (${res.cleared || 0} entradas removidas)`);
              } catch (e) {
                setError(e?.message || 'Falha ao limpar cache.');
              } finally {
                setLoading(false);
              }
            }} disabled={loading}>Limpar cache CSFloat</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={async () => {
              setLoading(true); setError(''); setMessage('');
              try {
                const res = await refreshNowAdminWallet();
                setMessage(
                  `Refresh executado: scanned ${res.scanned || 0} · attempted ${res.attempted || 0} · updated ${res.updated || 0} · skippedFresh ${res.skippedFresh || 0} · skippedTrack ${res.skippedTrack || 0} · priceNull ${res.skippedPriceNull || 0}`
                );
              } catch (e) {
                setError(e?.message || 'Falha no refresh.');
              } finally {
                setLoading(false);
              }
            }} disabled={loading}>Rodar refresh agora</TrackedButton>
          </div>
          <div className="admin-endpoints-form" style={{ marginTop: 10 }}>
            <label className="admin-endpoints-field">
              <span>SteamID para limpar inventário</span>
              <input
                type="text"
                value={targetSteamId}
                onChange={(e) => setTargetSteamId(e.target.value)}
                className="admin-endpoints-input"
                placeholder="7656119..."
              />
            </label>
            <TrackedButton
              type="button"
              className="admin-endpoints-btn"
              onClick={async () => {
                setLoading(true); setError(''); setMessage('');
                try {
                  const res = await clearAdminWalletInventory(targetSteamId.trim());
                  setMessage(`${res.message} steamId=${res.steamId} · removidos=${res.deleted}`);
                } catch (e) {
                  setError(e?.message || 'Falha ao limpar inventário do usuário.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !targetSteamId.trim()}
            >
              Limpar inventário do usuário
            </TrackedButton>
          </div>
          <div className="admin-endpoints-form" style={{ marginTop: 10 }}>
            <label className="admin-endpoints-field">
              <span>CSFloat test skinName (opcional)</span>
              <input
                type="text"
                value={testSkinName}
                onChange={(e) => setTestSkinName(e.target.value)}
                className="admin-endpoints-input"
                placeholder="Cole aqui (se vazio, pega uma da base)"
              />
            </label>
            <TrackedButton
              type="button"
              className="admin-endpoints-btn"
              onClick={async () => {
                setLoading(true); setError(''); setMessage('');
                try {
                  const out = await testAdminCsfloat(testSkinName.trim());
                  setMessage(`CSFloat test: status=${out?.test?.status ?? '-'} ok=${String(out?.test?.ok)} price=${out?.test?.priceUsd ?? '-'}`);
                } catch (e) {
                  setError(e?.message || 'Falha no teste CSFloat.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              Testar CSFloat
            </TrackedButton>
          </div>
          {message ? <div className="admin-endpoints-ok">{message}</div> : null}
          {error ? <div className="admin-endpoints-err">{error}</div> : null}
        </section>
        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Status</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Total de itens:</strong> {status?.skins ?? '-'}</div>
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
