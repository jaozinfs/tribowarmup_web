import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminToken } from '../../services/adminWheelApi';
import AdminTabs from '../../components/admin/AdminTabs';
import '../../index.css';
import { TrackedButton } from '../../components/TrackedButton';

function adminFetch(path, params = {}) {
  const token = getAdminToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-admin-token'] = token;
  const q = new URLSearchParams(params).toString();
  const url = q ? `${path}?${q}` : path;
  return fetch(`/api${url}`, { credentials: 'include', headers }).then((r) => {
    if (r.status === 403) {
      setAdminToken(null);
      throw new Error('Acesso negado.');
    }
    if (!r.ok) throw new Error('Erro na requisição');
    return r.json();
  });
}

export default function AdminAffiliates() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [data, setData] = useState({ items: [], total: 0, page: 1, perPage: 50 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ steamId: '', code: '', status: '', ip: '', dateFrom: '', dateTo: '', page: 1, per_page: 50 });

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

  const load = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError(null);
    const params = {};
    if (filters.steamId) params.steamId = filters.steamId;
    if (filters.code) params.code = filters.code;
    if (filters.status) params.status = filters.status;
    if (filters.ip) params.ip = filters.ip;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    params.page = filters.page;
    params.per_page = filters.per_page;
    try {
      const res = await adminFetch('/admin/affiliates', params);
      setData(res);
    } catch (e) {
      setError(e?.message || 'Erro ao carregar');
      if (e?.message?.includes('Acesso negado')) setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [authorized, filters.steamId, filters.code, filters.status, filters.ip, filters.dateFrom, filters.dateTo, filters.page, filters.per_page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmitToken = (e) => {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    setError(null);
    setAdminToken(t);
    setTokenInput('');
    verifyAdminToken()
      .then(() => setAuthorized(true))
      .catch((err) => {
        setAdminToken(null);
        setAuthorized(false);
        setError(err?.message || 'Token inválido. Tente novamente.');
      });
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAuthorized(false);
  };

  if (!authorized) {
    return (
      <div className="wheel-admin-page">
        <div className="wheel-admin-gate">
          <h1 className="wheel-admin-gate-title">Admin — Affiliates</h1>
          <p className="wheel-admin-gate-desc">Digite o token de administrador para continuar.</p>
          {error && <p className="wheel-admin-gate-error" role="alert">{error}</p>}
          <form onSubmit={handleSubmitToken} className="wheel-admin-gate-form">
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Token admin" className="wheel-admin-gate-input" autoComplete="off" />
            <TrackedButton type="submit" className="wheel-admin-gate-btn">Entrar</TrackedButton>
          </form>
          <TrackedButton type="button" className="wheel-admin-gate-back" onClick={() => navigate('/')}>Voltar ao site</TrackedButton>
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
          <h1 className="wheel-admin-title">Affiliates</h1>
          <TrackedButton type="button" className="wheel-admin-logout" onClick={handleLogout}>Sair</TrackedButton>
        </div>
      </header>
      <AdminTabs />

      <main className="admin-affiliates-main">
        <section className="admin-affiliates-filters">
          <input type="text" placeholder="SteamID" value={filters.steamId} onChange={(e) => setFilters((f) => ({ ...f, steamId: e.target.value, page: 1 }))} className="wheel-admin-filter-input" />
          <input type="text" placeholder="Código" value={filters.code} onChange={(e) => setFilters((f) => ({ ...f, code: e.target.value, page: 1 }))} className="wheel-admin-filter-input" />
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} className="wheel-admin-filter-select">
            <option value="">Status</option>
            <option value="pending">pending</option>
            <option value="qualified">qualified</option>
            <option value="rewarded">rewarded</option>
            <option value="invalid">invalid</option>
          </select>
          <input type="text" placeholder="IP" value={filters.ip} onChange={(e) => setFilters((f) => ({ ...f, ip: e.target.value, page: 1 }))} className="wheel-admin-filter-input" />
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))} className="wheel-admin-filter-input" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 }))} className="wheel-admin-filter-input" />
          <TrackedButton type="button" className="wheel-admin-filter-refresh" onClick={load}>Atualizar</TrackedButton>
        </section>
        {error && <div className="wheel-admin-error" role="alert">{error}</div>}
        <div className="wheel-table-wrap">
          <table className="wheel-table">
            <thead>
              <tr>
                <th>Referrer</th>
                <th>Código</th>
                <th>Referred</th>
                <th>Tempo</th>
                <th>Status</th>
                <th>Pontos</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="wheel-table-loading">Carregando...</td></tr>}
              {!loading && data.items.length === 0 && <tr><td colSpan={7} className="wheel-table-empty">Nenhum registro.</td></tr>}
              {!loading && data.items.map((r) => (
                <tr key={r.id}>
                  <td title={r.referrerSteamId}>{r.referrerName}</td>
                  <td>{r.code}</td>
                  <td title={r.referredSteamId}>{r.referredName}</td>
                  <td>{r.playtimeMinutes} min</td>
                  <td>{r.status}</td>
                  <td>{r.rewarded ? `+${r.points}` : '0'}</td>
                  <td className="wheel-table-ip">{r.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="wheel-admin-pagination">
          <TrackedButton type="button" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Anterior</TrackedButton>
          <span>Página {data.page} (total {data.total})</span>
          <TrackedButton type="button" disabled={data.page * data.perPage >= data.total} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Próxima</TrackedButton>
        </div>
      </main>

      <style>{`
        .wheel-admin-page { min-height: 100vh; background: #0f172a; color: #e2e8f0; padding-bottom: 40px; }
        .wheel-admin-header { border-bottom: 1px solid #334155; }
        .wheel-admin-header-inner { max-width: 1200px; margin: 0 auto; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
        .wheel-admin-title { font-size: 1.2rem; margin: 0; }
        .wheel-admin-logout { padding: 6px 12px; border-radius: 6px; border: 1px solid #475569; background: transparent; color: #94a3b8; cursor: pointer; font-size: 0.85rem; }
        .admin-affiliates-main { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .admin-affiliates-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; align-items: center; }
        .wheel-admin-filter-input, .wheel-admin-filter-select { padding: 8px 12px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #f1f5f9; font-size: 0.9rem; }
        .wheel-admin-filter-refresh { padding: 8px 14px; border-radius: 6px; background: #334155; color: #f1f5f9; border: none; cursor: pointer; font-size: 0.9rem; }
        .wheel-admin-error { margin-bottom: 12px; padding: 10px 20px; background: rgba(239,68,68,0.2); border: 1px solid #ef4444; border-radius: 8px; color: #fca5a5; }
        .wheel-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #334155; background: #1e293b; }
        .wheel-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .wheel-table th, .wheel-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #334155; }
        .wheel-table th { background: #0f172a; color: #94a3b8; font-weight: 600; }
        .wheel-table-ip { font-family: monospace; font-size: 0.8rem; color: #94a3b8; }
        .wheel-table-loading, .wheel-table-empty { padding: 32px; text-align: center; color: #94a3b8; }
        .wheel-admin-pagination { margin-top: 20px; display: flex; align-items: center; gap: 16px; }
        .wheel-admin-pagination button { padding: 8px 14px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; cursor: pointer; }
        .wheel-admin-pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
