import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrackedButton } from '../../components/TrackedButton';
import {
  getAdminToken,
  setAdminToken,
  verifyAdminToken,
  fetchAdminWheelSpins,
  fetchAdminWheelSpinId,
  fetchAdminWheelStats,
} from '../../services/adminWheelApi';
import { WheelSpinTable } from '../../components/admin/WheelSpinTable';
import AdminTabs from '../../components/admin/AdminTabs';
import '../../index.css';

export default function WheelDashboard() {
  const navigate = useNavigate();
  const [token, setTokenState] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [spins, setSpins] = useState({ items: [], total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ page: 1, per_page: 20 });
  const [detailSpin, setDetailSpin] = useState(null);

  useEffect(() => {
    const t = getAdminToken();
    if (!t) return;
    setTokenState(t);
    verifyAdminToken()
      .then(() => setAuthorized(true))
      .catch(() => {
        setAdminToken(null);
        setTokenState('');
        setAuthorized(false);
      });
  }, []);

  const loadSpins = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminWheelSpins(filters);
      setSpins({ items: data.items || [], total: data.total || 0 });
    } catch (e) {
      setError(e?.message || 'Erro ao carregar spins');
      if (e?.message?.includes('Token inválido')) setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [authorized, filters.user, filters.item, filters.rarity, filters.date_start, filters.date_end, filters.is_redeemed, filters.page, filters.per_page]);

  const loadStats = useCallback(async () => {
    if (!authorized) return;
    try {
      const data = await fetchAdminWheelStats();
      setStats(data);
    } catch {
      // ignore
    }
  }, [authorized]);

  useEffect(() => {
    loadSpins();
  }, [loadSpins]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSubmitToken = (e) => {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    setError(null);
    setAdminToken(t);
    setTokenState(t);
    setTokenInput('');
    verifyAdminToken()
      .then(() => setAuthorized(true))
      .catch((err) => {
        setAdminToken(null);
        setTokenState('');
        setAuthorized(false);
        setError(err?.message || 'Token inválido. Tente novamente.');
      });
  };

  const handleLogout = () => {
    setAdminToken(null);
    setTokenState('');
    setAuthorized(false);
    setDetailSpin(null);
  };

  const handleSelectDetail = async (id) => {
    try {
      const spin = await fetchAdminWheelSpinId(id);
      setDetailSpin(spin);
    } catch (e) {
      setError(e?.message || 'Erro ao carregar detalhe');
    }
  };

  if (!authorized) {
    return (
      <div className="wheel-admin-page">
        <div className="wheel-admin-gate">
          <h1 className="wheel-admin-gate-title">Admin — Roda da Fortuna</h1>
          <p className="wheel-admin-gate-desc">Digite o token de administrador para continuar.</p>
          {error && <p className="wheel-admin-gate-error" role="alert">{error}</p>}
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
      </div>
    );
  }

  return (
    <div className="wheel-admin-page">
      <header className="wheel-admin-header">
        <div className="wheel-admin-header-inner">
          <h1 className="wheel-admin-title">Auditoria — Roda da Fortuna</h1>
          <TrackedButton type="button" className="wheel-admin-logout" onClick={handleLogout}>
            Sair
          </TrackedButton>
        </div>
      </header>
      <AdminTabs />

      {stats && (
        <section className="wheel-admin-stats">
          <div className="wheel-admin-stat">
            <span className="wheel-admin-stat-value">{stats.total_spins ?? 0}</span>
            <span className="wheel-admin-stat-label">Total de spins</span>
          </div>
          <div className="wheel-admin-stat">
            <span className="wheel-admin-stat-value">{stats.total_redeemed ?? 0}</span>
            <span className="wheel-admin-stat-label">Resgatados</span>
          </div>
          <div className="wheel-admin-stat">
            <span className="wheel-admin-stat-value">{stats.spins_today ?? 0}</span>
            <span className="wheel-admin-stat-label">Hoje</span>
          </div>
        </section>
      )}

      <section className="wheel-admin-filters">
        <input
          type="text"
          placeholder="Usuário"
          value={filters.user ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, user: e.target.value || undefined, page: 1 }))}
          className="wheel-admin-filter-input"
        />
        <input
          type="text"
          placeholder="Item"
          value={filters.item ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, item: e.target.value || undefined, page: 1 }))}
          className="wheel-admin-filter-input"
        />
        <input
          type="text"
          placeholder="Raridade"
          value={filters.rarity ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, rarity: e.target.value || undefined, page: 1 }))}
          className="wheel-admin-filter-input"
        />
        <input
          type="date"
          value={filters.date_start ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, date_start: e.target.value || undefined, page: 1 }))}
          className="wheel-admin-filter-input"
        />
        <input
          type="date"
          value={filters.date_end ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, date_end: e.target.value || undefined, page: 1 }))}
          className="wheel-admin-filter-input"
        />
        <select
          value={filters.is_redeemed ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, is_redeemed: e.target.value === '' ? undefined : e.target.value, page: 1 }))}
          className="wheel-admin-filter-select"
        >
          <option value="">Todos</option>
          <option value="true">Resgatados</option>
          <option value="false">Não resgatados</option>
        </select>
        <TrackedButton type="button" className="wheel-admin-filter-refresh" onClick={loadSpins}>
          Atualizar
        </TrackedButton>
      </section>

      {error && (
        <div className="wheel-admin-error" role="alert">
          {error}
        </div>
      )}

      <section className="wheel-admin-table-section">
        <WheelSpinTable
          items={spins.items}
          loading={loading}
          onSelectDetail={handleSelectDetail}
          selectedSpin={detailSpin}
          onCloseDetail={() => setDetailSpin(null)}
        />
      </section>

      <div className="wheel-admin-pagination">
        <TrackedButton
          type="button"
          disabled={filters.page <= 1}
          onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
        >
          Anterior
        </TrackedButton>
        <span>
          Página {filters.page} (total {spins.total})
        </span>
        <TrackedButton
          type="button"
          disabled={filters.page * filters.per_page >= spins.total}
          onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
        >
          Próxima
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
        .wheel-admin-header { border-bottom: 1px solid #334155; }
        .wheel-admin-header-inner { max-width: 1200px; margin: 0 auto; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
        .wheel-admin-title { font-size: 1.2rem; margin: 0; }
        .wheel-admin-logout { padding: 6px 12px; border-radius: 6px; border: 1px solid #475569; background: transparent; color: #94a3b8; cursor: pointer; font-size: 0.85rem; }
        .wheel-admin-stats { display: flex; gap: 24px; max-width: 1200px; margin: 0 auto; padding: 20px; flex-wrap: wrap; }
        .wheel-admin-stat { background: #1e293b; padding: 16px 24px; border-radius: 10px; min-width: 120px; text-align: center; }
        .wheel-admin-stat-value { display: block; font-size: 1.5rem; font-weight: 700; color: #f59e0b; }
        .wheel-admin-stat-label { font-size: 0.8rem; color: #94a3b8; }
        .wheel-admin-filters { max-width: 1200px; margin: 0 auto; padding: 12px 20px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
        .wheel-admin-filter-input, .wheel-admin-filter-select { padding: 8px 12px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #f1f5f9; font-size: 0.9rem; }
        .wheel-admin-filter-refresh { padding: 8px 14px; border-radius: 6px; background: #334155; color: #f1f5f9; border: none; cursor: pointer; font-size: 0.9rem; }
        .wheel-admin-error { max-width: 1200px; margin: 0 auto 12px; padding: 10px 20px; background: rgba(239,68,68,0.2); border: 1px solid #ef4444; border-radius: 8px; color: #fca5a5; }
        .wheel-admin-table-section { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .wheel-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #334155; background: #1e293b; }
        .wheel-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .wheel-table th, .wheel-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #334155; }
        .wheel-table th { background: #0f172a; color: #94a3b8; font-weight: 600; }
        .wheel-table-user { max-width: 120px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .wheel-table-rarity { padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
        .wheel-table-ip { font-family: monospace; font-size: 0.8rem; color: #94a3b8; }
        .wheel-table-btn-detail { padding: 4px 10px; border-radius: 6px; border: 1px solid #475569; background: transparent; color: #94a3b8; cursor: pointer; font-size: 0.8rem; }
        .wheel-table-loading, .wheel-table-empty { padding: 32px; text-align: center; color: #94a3b8; }
        .wheel-admin-pagination { max-width: 1200px; margin: 20px auto; padding: 0 20px; display: flex; align-items: center; gap: 16px; }
        .wheel-admin-pagination button { padding: 8px 14px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; cursor: pointer; }
        .wheel-admin-pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
        .wheel-detail-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .wheel-detail-modal { background: #1e293b; border-radius: 12px; max-width: 520px; width: 100%; max-height: 90vh; overflow: auto; border: 1px solid #334155; }
        .wheel-detail-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #334155; }
        .wheel-detail-title { margin: 0; font-size: 1.1rem; }
        .wheel-detail-close { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; line-height: 1; }
        .wheel-detail-body { padding: 20px; }
        .wheel-detail-dl { margin: 0; display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; font-size: 0.9rem; }
        .wheel-detail-dl dt { color: #94a3b8; }
        .wheel-detail-dl dd { margin: 0; word-break: break-all; }
        .wheel-detail-ua, .wheel-detail-hash { font-size: 0.75rem; font-family: monospace; color: #94a3b8; }
      `}</style>
    </div>
  );
}
