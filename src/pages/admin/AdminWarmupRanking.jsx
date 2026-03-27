import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminToken } from '../../services/adminWheelApi';
import { getWarmupTop } from '../../services/adminUsersApi';
import AdminTabs from '../../components/admin/AdminTabs';
import '../../index.css';
import { TrackedButton } from '../../components/TrackedButton';

export default function AdminWarmupRanking() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);

  const loadData = async (n = limit) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWarmupTop(n);
      setRows(Array.isArray(data?.top) ? data.top : []);
      setGeneratedAt(data?.generatedAt || null);
    } catch (err) {
      setError(err?.message || 'Erro ao carregar ranking warmup.');
      setRows([]);
      setGeneratedAt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = getAdminToken();
    if (!t) return;
    verifyAdminToken()
      .then(async () => {
        setAuthorized(true);
        await loadData(10);
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
    setError(null);
    setAdminToken(t);
    setTokenInput('');
    verifyAdminToken()
      .then(async () => {
        setAuthorized(true);
        await loadData(10);
      })
      .catch((err) => {
        setAdminToken(null);
        setAuthorized(false);
        setError(err?.message || 'Token inválido. Tente novamente.');
      });
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAuthorized(false);
    setRows([]);
    setGeneratedAt(null);
    setError(null);
  };

  if (!authorized) {
    return (
      <div className="wheel-admin-page">
        <div className="wheel-admin-gate">
          <h1 className="wheel-admin-gate-title">Admin — Ranking Warmup</h1>
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
          <h1 className="wheel-admin-title">Ranking Warmup (DM)</h1>
          <TrackedButton type="button" className="wheel-admin-logout" onClick={handleLogout}>Sair</TrackedButton>
        </div>
      </header>
      <AdminTabs />

      <main className="admin-endpoints-main">
        <section className="admin-endpoints-section">
          <div className="admin-warmup-toolbar">
            <label className="admin-endpoints-field admin-warmup-top-field">
              <span>Top</span>
              <input
                type="number"
                min="1"
                max="50"
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value) || 10)))}
                className="admin-endpoints-input"
              />
            </label>
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={() => loadData(limit)} disabled={loading}>
              {loading ? 'Carregando...' : 'Atualizar'}
            </TrackedButton>
            {generatedAt && (
              <span className="admin-warmup-generated-at">
                Gerado em: {new Date(generatedAt).toLocaleString()}
              </span>
            )}
          </div>
          {error && <div className="admin-endpoints-err" role="alert">{error}</div>}
        </section>

        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Top Warmup (somente kills contra players reais)</h2>
          <div className="admin-warmup-table-wrap">
            <table className="admin-warmup-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jogador</th>
                  <th>K</th>
                  <th>D</th>
                  <th>KD</th>
                  <th>HS%</th>
                  <th>Avg Tiros</th>
                  <th>Reaction</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.steamId}>
                    <td>#{r.rank}</td>
                    <td>{r.displayName}</td>
                    <td>{r.totalKills}</td>
                    <td>{r.totalDeaths}</td>
                    <td>{Number(r.kd).toFixed(2)}</td>
                    <td>{Number(r.hsPercent).toFixed(1)}%</td>
                    <td>{Number(r.avgShotsToKill).toFixed(2)}</td>
                    <td>{r.avgReactionMs ? `${r.avgReactionMs}ms` : '—'}</td>
                    <td>{Number(r.consistencyScore).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        .admin-endpoints-field { display: flex; flex-direction: column; gap: 4px; }
        .admin-endpoints-field span { font-size: 0.8rem; color: #94a3b8; }
        .admin-endpoints-input { padding: 8px 12px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 0.9rem; min-width: 220px; }
        .admin-endpoints-btn { padding: 8px 16px; border-radius: 6px; background: #f59e0b; color: #0f172a; font-weight: 600; border: none; cursor: pointer; font-size: 0.9rem; }
        .admin-endpoints-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .admin-endpoints-err { margin-top: 12px; padding: 10px; background: rgba(239,68,68,0.2); border: 1px solid #ef4444; border-radius: 6px; color: #fca5a5; font-size: 0.9rem; }
        .admin-warmup-toolbar {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          flex-wrap: wrap;
        }
        .admin-warmup-top-field {
          max-width: 120px;
        }
        .admin-warmup-generated-at {
          color: #94a3b8;
          font-size: 0.85rem;
        }
        .admin-warmup-table-wrap {
          overflow-x: auto;
        }
        .admin-warmup-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .admin-warmup-table th,
        .admin-warmup-table td {
          padding: 10px 8px;
        }
        .admin-warmup-table thead tr {
          color: #94a3b8;
          border-bottom: 1px solid #334155;
        }
        .admin-warmup-table tbody tr {
          border-bottom: 1px solid #1f2937;
        }
        .admin-warmup-table tbody tr:nth-child(1) td { color: #fde68a; }
        .admin-warmup-table tbody tr:nth-child(2) td { color: #e2e8f0; }
        .admin-warmup-table tbody tr:nth-child(3) td { color: #fdba74; }
        .admin-warmup-table th:nth-child(1),
        .admin-warmup-table th:nth-child(2),
        .admin-warmup-table td:nth-child(1),
        .admin-warmup-table td:nth-child(2) {
          text-align: left;
        }
        .admin-warmup-table th:nth-child(n+3),
        .admin-warmup-table td:nth-child(n+3) {
          text-align: right;
        }
      `}</style>
    </div>
  );
}
