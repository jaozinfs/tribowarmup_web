import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminToken } from '../../services/adminWheelApi';
import { addPoints } from '../../services/adminUsersApi';
import AdminTabs from '../../components/admin/AdminTabs';
import '../../index.css';
import { TrackedButton } from '../../components/TrackedButton';

export default function AdminPoints() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [gateError, setGateError] = useState(null);
  const [steamId, setSteamId] = useState('');
  const [points, setPoints] = useState('');
  const [tickets, setTickets] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
    setGateError(null);
    setAdminToken(t);
    setTokenInput('');
    verifyAdminToken()
      .then(() => {
        setAuthorized(true);
        setGateError(null);
      })
      .catch((err) => {
        setAdminToken(null);
        setAuthorized(false);
        setGateError(err?.message || 'Token inválido. Tente novamente.');
      });
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAuthorized(false);
    setResult(null);
    setError(null);
  };

  const handleAddPoints = async (e) => {
    e.preventDefault();
    const sid = steamId.trim();
    if (!sid) {
      setError('Informe o Steam ID.');
      return;
    }
    const p = Math.max(0, Math.floor(Number(points) || 0));
    const tk = Math.max(0, Math.floor(Number(tickets) || 0));
    if (p === 0 && tk === 0) {
      setError('Informe pontos e/ou fichas (números ≥ 0).');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await addPoints(sid, p, tk);
      setResult(`Adicionado: ${data.pointsAdded} pontos, ${data.ticketsAdded} fichas. Saldo atual: ${data.current.points} pontos, ${data.current.tickets} fichas.`);
      setSteamId('');
      setPoints('');
      setTickets('');
    } catch (err) {
      setError(err?.message || 'Erro ao adicionar.');
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="wheel-admin-page">
        <div className="wheel-admin-gate">
          <h1 className="wheel-admin-gate-title">Admin — Pontos e Fichas</h1>
          <p className="wheel-admin-gate-desc">Digite o token de administrador para continuar.</p>
          {gateError && <p className="wheel-admin-gate-error" role="alert">{gateError}</p>}
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
      <AdminTabs />
      <header className="wheel-admin-header">
        <div className="wheel-admin-header-inner">
          <h1 className="wheel-admin-title">Adicionar pontos e fichas</h1>
          <TrackedButton type="button" className="wheel-admin-logout" onClick={handleLogout}>
            Sair
          </TrackedButton>
        </div>
      </header>
      <section className="wheel-admin-section" style={{ maxWidth: 480, margin: '24px auto', padding: '0 20px' }}>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>
          Pontos do sorteio mensal e fichas (tickets) para a roleta VIP. O saldo é do mês atual.
        </p>
        {result && (
          <p className="admin-points-result" style={{ color: '#86efac', background: 'rgba(34,197,94,0.2)', border: '1px solid #22c55e', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            {result}
          </p>
        )}
        {error && (
          <p className="admin-points-error" style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            {error}
          </p>
        )}
        <form onSubmit={handleAddPoints} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Steam ID
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="76561198..."
              className="wheel-admin-gate-input"
              style={{ marginTop: 4, width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Pontos (sorteio mensal)
            <input
              type="number"
              min="0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="0"
              className="wheel-admin-gate-input"
              style={{ marginTop: 4, width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Fichas (tickets para roleta)
            <input
              type="number"
              min="0"
              value={tickets}
              onChange={(e) => setTickets(e.target.value)}
              placeholder="0"
              className="wheel-admin-gate-input"
              style={{ marginTop: 4, width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <TrackedButton
            type="submit"
            className="wheel-admin-gate-btn"
            disabled={loading}
            style={{ alignSelf: 'flex-start' }}
          >
            {loading ? 'Adicionando...' : 'Adicionar'}
          </TrackedButton>
        </form>
      </section>
      <style>{`
        .wheel-admin-page { min-height: 100vh; background: #0f172a; color: #e2e8f0; padding-bottom: 40px; }
        .wheel-admin-header { border-bottom: 1px solid #334155; }
        .wheel-admin-header-inner { max-width: 1200px; margin: 0 auto; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
        .wheel-admin-title { font-size: 1.2rem; margin: 0; }
        .wheel-admin-logout { padding: 6px 12px; border-radius: 6px; border: 1px solid #475569; background: transparent; color: #94a3b8; cursor: pointer; font-size: 0.85rem; }
        .wheel-admin-gate-input { padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #f1f5f9; }
        .wheel-admin-gate-btn { padding: 10px 20px; border-radius: 8px; background: #f59e0b; color: #0f172a; font-weight: 600; cursor: pointer; border: none; }
        .wheel-admin-gate-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
