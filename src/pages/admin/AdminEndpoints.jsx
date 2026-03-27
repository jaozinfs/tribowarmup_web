import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminToken } from '../../services/adminWheelApi';
import { revokeVip, addVip } from '../../services/adminUsersApi';
import AdminTabs from '../../components/admin/AdminTabs';
import '../../index.css';
import { TrackedButton } from '../../components/TrackedButton';

export default function AdminEndpoints() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [steamId, setSteamId] = useState('');
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeResult, setRevokeResult] = useState(null);
  const [revokeError, setRevokeError] = useState(null);
  const [addVipDays, setAddVipDays] = useState('30');
  const [addVipLoading, setAddVipLoading] = useState(false);
  const [addVipResult, setAddVipResult] = useState(null);
  const [addVipError, setAddVipError] = useState(null);

  useEffect(() => {
    const t = getAdminToken();
    if (!t) return;
    verifyAdminToken()
      .then(() => setAuthorized(true))
      .catch(() => {
        setAdminToken(null);
        setAuthorized(false);
      });
  }, []);

  const handleSubmitToken = (e) => {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    setRevokeError(null);
    setAdminToken(t);
    setTokenInput('');
    verifyAdminToken()
      .then(() => {
        setAuthorized(true);
        setRevokeError(null);
      })
      .catch((err) => {
        setAdminToken(null);
        setAuthorized(false);
        setRevokeError(err?.message || 'Token inválido. Tente novamente.');
      });
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAuthorized(false);
    setRevokeResult(null);
    setRevokeError(null);
    setAddVipResult(null);
    setAddVipError(null);
  };

  const handleRevokeVip = async (e) => {
    e.preventDefault();
    const sid = steamId.trim();
    if (!sid) {
      setRevokeError('Informe o Steam ID.');
      return;
    }
    setRevokeLoading(true);
    setRevokeResult(null);
    setRevokeError(null);
    try {
      await revokeVip(sid);
      setRevokeResult(`VIP revogado para ${sid}.`);
      setSteamId('');
    } catch (err) {
      setRevokeError(err?.message || 'Erro ao revogar VIP.');
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleAddVip = async (e) => {
    e.preventDefault();
    const sid = steamId.trim();
    if (!sid) {
      setAddVipError('Informe o Steam ID.');
      return;
    }
    const days = Math.max(1, Math.floor(Number(addVipDays) || 30));
    setAddVipLoading(true);
    setAddVipResult(null);
    setAddVipError(null);
    try {
      const res = await addVip(sid, days);
      const exp = res?.vipExpiresAt ? ` (expira em ${new Date(res.vipExpiresAt).toLocaleString()})` : '';
      setAddVipResult(`VIP adicionado para ${sid} por ${days} dia(s)${exp}.`);
      setSteamId('');
    } catch (err) {
      setAddVipError(err?.message || 'Erro ao adicionar VIP.');
    } finally {
      setAddVipLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="wheel-admin-page">
        <div className="wheel-admin-gate">
          <h1 className="wheel-admin-gate-title">Admin — Endpoints</h1>
          <p className="wheel-admin-gate-desc">Digite o token de administrador para continuar.</p>
          {revokeError && <p className="wheel-admin-gate-error" role="alert">{revokeError}</p>}
          <form onSubmit={handleSubmitToken} className="wheel-admin-gate-form">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Token admin"
              className="wheel-admin-gate-input"
              autoComplete="off"
            />
            <TrackedButton type="submit" className="wheel-admin-gate-btn">Entrar</TrackedButton>
          </form>
          <TrackedButton type="button" className="wheel-admin-gate-back" onClick={() => navigate('/')}>
            Voltar ao site
          </TrackedButton>
        </div>
        <style>{`
          .wheel-admin-page { min-height: 100vh; background: #0f172a; color: #e2e8f0; padding-bottom: 40px; }
          .wheel-admin-gate { max-width: 400px; margin: 80px auto; padding: 32px; text-align: center; }
          .wheel-admin-gate-title { font-size: 1.4rem; margin-bottom: 8px; }
          .wheel-admin-gate-desc { color: #94a3b8; margin-bottom: 20px; font-size: 0.9rem; }
          .wheel-admin-gate-error { color: #fca5a5; background: rgba(239,68,68,0.2); border: 1px solid #ef4444; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.9rem; }
          .wheel-admin-gate-form { display: flex; flex-direction: column; gap: 10px; }
          .wheel-admin-gate-input { padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #f1f5f9; }
          .wheel-admin-gate-btn { padding: 10px; border-radius: 8px; background: #f59e0b; color: #0f172a; font-weight: 600; cursor: pointer; border: none; }
          .wheel-admin-gate-back { margin-top: 16px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.9rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="wheel-admin-page">
      <header className="wheel-admin-header">
        <div className="wheel-admin-header-inner">
          <h1 className="wheel-admin-title">Endpoints auxiliares</h1>
          <TrackedButton type="button" className="wheel-admin-logout" onClick={handleLogout}>
            Sair
          </TrackedButton>
        </div>
      </header>
      <AdminTabs />

      <main className="admin-endpoints-main">
        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Adicionar VIP</h2>
          <p className="admin-endpoints-section-desc">
            Concede VIP manualmente para um usuário por N dias (padrão 30), estendendo a data caso já tenha VIP ativo.
          </p>
          <form onSubmit={handleAddVip} className="admin-endpoints-form">
            <label className="admin-endpoints-field">
              <span>Steam ID</span>
              <input
                type="text"
                value={steamId}
                onChange={(e) => { setSteamId(e.target.value); setAddVipError(null); setAddVipResult(null); }}
                placeholder="76561198084792650"
                className="admin-endpoints-input"
              />
            </label>
            <label className="admin-endpoints-field" style={{ maxWidth: 140 }}>
              <span>Dias</span>
              <input
                type="number"
                min="1"
                value={addVipDays}
                onChange={(e) => { setAddVipDays(e.target.value); setAddVipError(null); setAddVipResult(null); }}
                className="admin-endpoints-input"
              />
            </label>
            <TrackedButton type="submit" className="admin-endpoints-btn" disabled={addVipLoading}>
              {addVipLoading ? 'Adicionando...' : 'Adicionar VIP'}
            </TrackedButton>
          </form>
          {addVipResult && (
            <div className="admin-endpoints-ok" role="status">{addVipResult}</div>
          )}
          {addVipError && (
            <div className="admin-endpoints-err" role="alert">{addVipError}</div>
          )}
        </section>

        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Revogar VIP</h2>
          <p className="admin-endpoints-section-desc">
            Remove o status VIP de um usuário (is_vip, vip_expires_at e stripe_checkout_session_id). Útil para testes.
          </p>
          <form onSubmit={handleRevokeVip} className="admin-endpoints-form">
            <label className="admin-endpoints-field">
              <span>Steam ID</span>
              <input
                type="text"
                value={steamId}
                onChange={(e) => { setSteamId(e.target.value); setRevokeError(null); setRevokeResult(null); }}
                placeholder="76561198084792650"
                className="admin-endpoints-input"
              />
            </label>
            <TrackedButton type="submit" className="admin-endpoints-btn" disabled={revokeLoading}>
              {revokeLoading ? 'Revogando...' : 'Revogar VIP'}
            </TrackedButton>
          </form>
          {revokeResult && (
            <div className="admin-endpoints-ok" role="status">{revokeResult}</div>
          )}
          {revokeError && (
            <div className="admin-endpoints-err" role="alert">{revokeError}</div>
          )}
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
