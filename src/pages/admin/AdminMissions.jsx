import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminToken } from '../../services/adminWheelApi';
import {
  addMissionAntiFarmBypass,
  adminFillMissionProgressFull,
  createAdminMission,
  deleteAdminMission,
  fetchAdminMissions,
  fetchMissionAntiFarmBypass,
  removeMissionAntiFarmBypass,
  resetAllUserMissions,
  resetDailyLoginMission,
  updateAdminMission,
} from '../../services/adminMissionsApi';
import AdminTabs from '../../components/admin/AdminTabs';
import '../../index.css';
import { TrackedButton } from '../../components/TrackedButton';

function clamp(n, min = 0, max = 1_000_000_000) {
  const x = Math.floor(Number(n) || 0);
  return Math.max(min, Math.min(max, x));
}

export default function AdminMissions() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authError, setAuthError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [missions, setMissions] = useState([]);

  const [draft, setDraft] = useState({
    name: '',
    description: '',
    type: 'kills',
    mission_mode: 'TODOS',
    target: 50,
    reward_points: 120,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState(null);

  const [bypassList, setBypassList] = useState([]);
  const [bypassSteamInput, setBypassSteamInput] = useState('');
  const [testSteamInput, setTestSteamInput] = useState('');
  const [dailyResetSteamInput, setDailyResetSteamInput] = useState('');
  const [missionsSubTab, setMissionsSubTab] = useState('geral');

  const loadBypass = async () => {
    try {
      const data = await fetchMissionAntiFarmBypass();
      setBypassList(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setBypassList([]);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await fetchAdminMissions();
      setMissions(Array.isArray(data?.missions) ? data.missions : []);
      await loadBypass();
    } catch (e) {
      setError(e?.message || 'Falha ao carregar missões.');
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
        return load();
      })
      .catch(() => {
        setAdminToken(null);
        setAuthorized(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        load();
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
    setMissions([]);
    setMessage('');
    setError('');
  };

  const typeOptions = useMemo(() => ([
    'kills', 'hs', 'damage', 'rounds_played', 'matches_played', 'wins',
    'rifle_kills', 'awp_kills', 'double_kills', 'plants', 'defuses', 'round_wins_bomb_planted',
    'win_streak', 'clutch_1v1', 'clutch_1v2', 'mvp_rounds', 'survive_round_end',
    'hs_single_match', 'kills_single_match', 'matches_in_day',
  ]), []);
  const modeOptions = useMemo(() => (['TODOS', 'PUG', 'DM']), []);

  const resetDraft = () => setDraft({ name: '', description: '', type: 'kills', mission_mode: 'TODOS', target: 50, reward_points: 120 });

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        name: String(draft.name || '').trim(),
        description: String(draft.description || '').trim(),
        type: String(draft.type || '').trim(),
        mission_mode: String(draft.mission_mode || 'TODOS').trim(),
        target: clamp(draft.target, 1),
        reward_points: clamp(draft.reward_points, 0),
      };
      if (!payload.name || !payload.type) throw new Error('Informe name e type.');
      await createAdminMission(payload);
      setMessage('Missão criada.');
      resetDraft();
      await load();
    } catch (e2) {
      setError(e2?.message || 'Falha ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setMessage('');
    setError('');
    setEditDraft({
      id: m.id,
      name: m.name || '',
      description: m.description || '',
      type: m.type || 'kills',
      mission_mode: m.mission_mode || 'TODOS',
      target: clamp(m.target, 1),
      reward_points: clamp(m.reward_points, 0),
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editDraft?.id) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        name: String(editDraft.name || '').trim(),
        description: String(editDraft.description || '').trim(),
        type: String(editDraft.type || '').trim(),
        mission_mode: String(editDraft.mission_mode || 'TODOS').trim(),
        target: clamp(editDraft.target, 1),
        reward_points: clamp(editDraft.reward_points, 0),
      };
      if (!payload.name || !payload.type) throw new Error('Informe name e type.');
      await updateAdminMission(editDraft.id, payload);
      setMessage('Missão atualizada.');
      setEditOpen(false);
      setEditDraft(null);
      await load();
    } catch (e2) {
      setError(e2?.message || 'Falha ao salvar edição.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('Deletar missão? Isso remove do pool global.')) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await deleteAdminMission(id);
      setMessage('Missão deletada.');
      await load();
    } catch (e) {
      setError(e?.message || 'Falha ao deletar.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Resetar missões de TODOS os usuários? Eles vão receber novas missões ao abrir o site.')) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await resetAllUserMissions();
      setMessage(`Reset enviado. Semana atual: ${res?.weekKey || '-'}`);
    } catch (e) {
      setError(e?.message || 'Falha ao resetar.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBypass = async (e) => {
    e.preventDefault();
    const sid = bypassSteamInput.trim();
    if (!sid) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await addMissionAntiFarmBypass(sid);
      setMessage(`Bypass adicionado: ${sid}`);
      setBypassSteamInput('');
      await loadBypass();
    } catch (err) {
      setError(err?.message || 'Falha ao adicionar bypass.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBypass = async (steamId) => {
    if (!steamId) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await removeMissionAntiFarmBypass(steamId);
      setMessage(`Bypass removido: ${steamId}`);
      await loadBypass();
    } catch (err) {
      setError(err?.message || 'Falha ao remover.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillProgress = async (e) => {
    e.preventDefault();
    const sid = testSteamInput.trim();
    if (!sid) return;
    if (!window.confirm(`Colocar progresso MÁXIMO nas 3 missões ativas da semana para ${sid}?`)) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await adminFillMissionProgressFull(sid);
      setMessage(`Progresso full: ${res?.missionsUpdated ?? 0} missão(ões) — semana ${res?.weekKey || ''}`);
    } catch (err) {
      setError(err?.message || 'Falha ao preencher progresso.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDailyLogin = async (e) => {
    e.preventDefault();
    const sid = dailyResetSteamInput.trim();
    if (!sid) return;
    if (!window.confirm(
      `Remover o estado da missão Login diário (week_key LOGIN) para ${sid}? Na próxima visita à página /missions o progresso será recriado como se fosse um primeiro acesso ao dia.`
    )) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await resetDailyLoginMission(sid);
      const n = res?.deletedRows ?? 0;
      setMessage(
        n > 0
          ? `Login diário resetado para ${sid} (${n} linha removida). Abra /missions logado com essa conta para testar.`
          : `Nenhuma linha removida (talvez o usuário ainda não tinha estado de login diário). Steam: ${sid}`
      );
    } catch (err) {
      setError(err?.message || 'Falha ao resetar login diário.');
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="wheel-admin-page">
        <div className="wheel-admin-gate">
          <h1 className="wheel-admin-gate-title">Admin — Missões</h1>
          <p className="wheel-admin-gate-desc">Digite o token de administrador para continuar.</p>
          {authError && <p className="wheel-admin-gate-error" role="alert">{authError}</p>}
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
          <h1 className="wheel-admin-title">Admin — Missões</h1>
          <TrackedButton type="button" className="wheel-admin-logout" onClick={handleLogout}>Sair</TrackedButton>
        </div>
      </header>
      <AdminTabs />

      <main className="admin-endpoints-main">
        <div className="admin-missions-subtabs" role="tablist" aria-label="Seções Missões">
          <TrackedButton
            type="button"
            role="tab"
            aria-selected={missionsSubTab === 'geral'}
            className={`admin-missions-subtab${missionsSubTab === 'geral' ? ' admin-missions-subtab--active' : ''}`}
            onClick={() => setMissionsSubTab('geral')}
          >
            Visão geral
          </TrackedButton>
          <TrackedButton
            type="button"
            role="tab"
            aria-selected={missionsSubTab === 'daily'}
            className={`admin-missions-subtab${missionsSubTab === 'daily' ? ' admin-missions-subtab--active' : ''}`}
            onClick={() => setMissionsSubTab('daily')}
          >
            Login diário
          </TrackedButton>
        </div>

        {(message || error) ? (
          <div className="admin-missions-feedback">
            {message ? <div className="admin-endpoints-ok" role="status">{message}</div> : null}
            {error ? <div className="admin-endpoints-err" role="alert">{error}</div> : null}
          </div>
        ) : null}

        {missionsSubTab === 'daily' ? (
          <section className="admin-endpoints-section">
            <h2 className="admin-endpoints-section-title">Resetar missão Login diário (teste)</h2>
            <p className="admin-endpoints-section-desc">
              Remove a linha em <code className="admin-missions-code">user_missions</code> com a missão <strong>daily_login</strong> e{' '}
              <code className="admin-missions-code">week_key = LOGIN</code> para o Steam informado. Na próxima
              abertura de <strong>/missions</strong> (logado) o estado é recriado — útil para testar resgate e
              fluxo do dia sem esperar virar a meia-noite.
            </p>
            <form onSubmit={handleResetDailyLogin} className="admin-endpoints-form admin-endpoints-form--stretch">
              <label className="admin-endpoints-field admin-endpoints-field--grow">
                <span>Steam ID (17 dígitos)</span>
                <input
                  className="admin-endpoints-input"
                  placeholder="7656119..."
                  value={dailyResetSteamInput}
                  onChange={(ev) => setDailyResetSteamInput(ev.target.value)}
                  autoComplete="off"
                />
              </label>
              <TrackedButton type="submit" className="admin-endpoints-btn admin-endpoints-btn--danger" disabled={loading}>
                Resetar login diário
              </TrackedButton>
            </form>
          </section>
        ) : null}

        {missionsSubTab === 'geral' ? (
          <>
        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Teste (QA) — progresso full</h2>
          <p className="admin-endpoints-section-desc">
            Define progresso = alvo e marca como concluídas as missões ativas da semana para um Steam ID (útil para testar claim/UI sem jogar).
          </p>
          <form onSubmit={handleFillProgress} className="admin-endpoints-form admin-endpoints-form--stretch">
            <label className="admin-endpoints-field admin-endpoints-field--grow">
              <span>Steam ID (17 dígitos)</span>
              <input
                className="admin-endpoints-input"
                placeholder="7656119..."
                value={testSteamInput}
                onChange={(ev) => setTestSteamInput(ev.target.value)}
                autoComplete="off"
              />
            </label>
            <TrackedButton type="submit" className="admin-endpoints-btn admin-endpoints-btn--success" disabled={loading}>
              Progresso full
            </TrackedButton>
          </form>
        </section>

        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Teste (QA) — bypass anti-farm (player-based)</h2>
          <p className="admin-endpoints-section-desc">
            <strong>PUG:</strong> contabiliza missão mesmo sem 2 times com humanos (ex.: só bots). <strong>DM/Warmup:</strong> kills contra bots passam a contar para o progresso.
            Remova o Steam ID quando terminar os testes.
          </p>
          <form onSubmit={handleAddBypass} className="admin-endpoints-form admin-endpoints-form--stretch">
            <label className="admin-endpoints-field admin-endpoints-field--grow">
              <span>Steam ID</span>
              <input
                className="admin-endpoints-input"
                placeholder="7656119..."
                value={bypassSteamInput}
                onChange={(ev) => setBypassSteamInput(ev.target.value)}
                autoComplete="off"
              />
            </label>
            <TrackedButton type="submit" className="admin-endpoints-btn" disabled={loading}>
              Adicionar bypass
            </TrackedButton>
          </form>
          <div className="admin-missions-table-wrap">
            <table className="admin-missions-table">
              <thead>
                <tr>
                  <th>Steam ID</th>
                  <th>Desde</th>
                  <th className="admin-missions-table__actions" />
                </tr>
              </thead>
              <tbody>
                {bypassList.map((row) => (
                  <tr key={row.steam_id}>
                    <td className="admin-missions-table__mono">{row.steam_id}</td>
                    <td className="admin-missions-table__muted">{row.created_at ? String(row.created_at) : '—'}</td>
                    <td className="admin-missions-table__actions">
                      <TrackedButton type="button" className="admin-endpoints-btn admin-endpoints-btn--danger" onClick={() => handleRemoveBypass(row.steam_id)} disabled={loading}>
                        Remover
                      </TrackedButton>
                    </td>
                  </tr>
                ))}
                {bypassList.length === 0 ? (
                  <tr><td colSpan={3} className="admin-missions-table__empty">Nenhum Steam ID em bypass.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Pool global</h2>
          <p className="admin-endpoints-section-desc">Criar/editar/deletar missões do pool global. O usuário recebe 3 missões por semana.</p>

          <div className="admin-endpoints-form">
            <TrackedButton type="button" className="admin-endpoints-btn" onClick={load} disabled={loading}>Recarregar</TrackedButton>
            <TrackedButton type="button" className="admin-endpoints-btn admin-endpoints-btn--danger" onClick={handleResetAll} disabled={loading}>
              Resetar missões de todos
            </TrackedButton>
          </div>
        </section>

        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Criar missão</h2>
          <form onSubmit={handleCreate} className="admin-endpoints-form admin-endpoints-form--stretch">
            <label className="admin-endpoints-field admin-endpoints-field--wide">
              <span>Name</span>
              <input className="admin-endpoints-input" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label className="admin-endpoints-field admin-endpoints-field--wide">
              <span>Description</span>
              <input className="admin-endpoints-input" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
            </label>
            <label className="admin-endpoints-field">
              <span>Type</span>
              <select className="admin-endpoints-input" value={draft.type} onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}>
                {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="admin-endpoints-field">
              <span>Modo</span>
              <select className="admin-endpoints-input" value={draft.mission_mode} onChange={(e) => setDraft((p) => ({ ...p, mission_mode: e.target.value }))}>
                {modeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="admin-endpoints-field admin-endpoints-field--narrow">
              <span>Target</span>
              <input type="number" className="admin-endpoints-input" value={draft.target} onChange={(e) => setDraft((p) => ({ ...p, target: e.target.value }))} />
            </label>
            <label className="admin-endpoints-field admin-endpoints-field--narrow">
              <span>Reward points</span>
              <input type="number" className="admin-endpoints-input" value={draft.reward_points} onChange={(e) => setDraft((p) => ({ ...p, reward_points: e.target.value }))} />
            </label>
            <TrackedButton type="submit" className="admin-endpoints-btn" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar'}
            </TrackedButton>
          </form>
        </section>

        <section className="admin-endpoints-section">
          <h2 className="admin-endpoints-section-title">Missões ({missions.length})</h2>
          <div className="admin-missions-table-wrap">
            <table className="admin-missions-table admin-missions-table--full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Type</th>
                  <th>Modo</th>
                  <th>Target</th>
                  <th>Reward</th>
                  <th className="admin-missions-table__actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {missions.map((m) => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>
                      <div className="admin-missions-table__name">{m.name}</div>
                      <div className="admin-missions-table__desc">{m.description}</div>
                    </td>
                    <td className="admin-missions-table__mono">{m.type}</td>
                    <td className="admin-missions-table__mono admin-missions-table__mode">{m.mission_mode || 'TODOS'}</td>
                    <td>{m.target}</td>
                    <td className="admin-missions-table__reward">{m.reward_points}</td>
                    <td className="admin-missions-table__actions">
                      <div className="admin-missions-table__btn-row">
                        <TrackedButton type="button" className="admin-endpoints-btn" onClick={() => handleEdit(m)} disabled={loading}>Editar</TrackedButton>
                        <TrackedButton type="button" className="admin-endpoints-btn admin-endpoints-btn--danger" onClick={() => handleDelete(m.id)} disabled={loading}>
                          Deletar
                        </TrackedButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {missions.length === 0 ? (
                  <tr><td colSpan={7} className="admin-missions-table__empty">Nenhuma missão encontrada.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
          </>
        ) : null}

        {editOpen && editDraft ? (
          <div className="admin-missions-modal-overlay" role="presentation">
            <form onSubmit={handleSaveEdit} className="admin-missions-modal">
              <h2 className="admin-endpoints-section-title">Editar missão #{editDraft.id}</h2>
              <div className="admin-endpoints-form admin-endpoints-form--stretch">
                <label className="admin-endpoints-field admin-endpoints-field--wide">
                  <span>Name</span>
                  <input className="admin-endpoints-input" value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))} />
                </label>
                <label className="admin-endpoints-field admin-endpoints-field--wide">
                  <span>Description</span>
                  <input className="admin-endpoints-input" value={editDraft.description} onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))} />
                </label>
                <label className="admin-endpoints-field">
                  <span>Type</span>
                  <select className="admin-endpoints-input" value={editDraft.type} onChange={(e) => setEditDraft((p) => ({ ...p, type: e.target.value }))}>
                    {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="admin-endpoints-field">
                  <span>Modo</span>
                  <select className="admin-endpoints-input" value={editDraft.mission_mode || 'TODOS'} onChange={(e) => setEditDraft((p) => ({ ...p, mission_mode: e.target.value }))}>
                    {modeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="admin-endpoints-field admin-endpoints-field--narrow">
                  <span>Target</span>
                  <input type="number" className="admin-endpoints-input" value={editDraft.target} onChange={(e) => setEditDraft((p) => ({ ...p, target: e.target.value }))} />
                </label>
                <label className="admin-endpoints-field admin-endpoints-field--narrow">
                  <span>Reward points</span>
                  <input type="number" className="admin-endpoints-input" value={editDraft.reward_points} onChange={(e) => setEditDraft((p) => ({ ...p, reward_points: e.target.value }))} />
                </label>
              </div>
              <div className="admin-endpoints-form admin-missions-modal__footer">
                <TrackedButton type="submit" className="admin-endpoints-btn" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</TrackedButton>
                <TrackedButton type="button" className="admin-endpoints-btn admin-endpoints-btn--ghost" onClick={() => { setEditOpen(false); setEditDraft(null); }}>Cancelar</TrackedButton>
              </div>
            </form>
          </div>
        ) : null}
      </main>

      <style>{`
        .wheel-admin-page { min-height: 100vh; background: #0f172a; color: #e2e8f0; padding-bottom: 40px; }
        .wheel-admin-header { border-bottom: 1px solid #334155; }
        .wheel-admin-header-inner { max-width: 1200px; margin: 0 auto; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
        .wheel-admin-title { font-size: 1.2rem; margin: 0; }
        .wheel-admin-logout { padding: 6px 12px; border-radius: 6px; border: 1px solid #475569; background: transparent; color: #94a3b8; cursor: pointer; font-size: 0.85rem; }
        .admin-endpoints-main { max-width: 1200px; margin: 0 auto; padding: 24px 20px; }
        .admin-missions-feedback { margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px; }
        .admin-missions-feedback .admin-endpoints-ok,
        .admin-missions-feedback .admin-endpoints-err { margin-top: 0; }
        .admin-endpoints-section { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
        .admin-endpoints-section-title { font-size: 1.1rem; margin: 0 0 8px; color: #f59e0b; }
        .admin-endpoints-section-desc { color: #94a3b8; font-size: 0.9rem; margin: 0 0 16px; line-height: 1.45; }
        .admin-endpoints-section-desc strong { color: #cbd5e1; }
        .admin-endpoints-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
        .admin-endpoints-form--stretch { align-items: stretch; }
        .admin-endpoints-field { display: flex; flex-direction: column; gap: 4px; }
        .admin-endpoints-field span { font-size: 0.8rem; color: #94a3b8; }
        .admin-endpoints-field--grow { flex: 1 1 220px; min-width: 200px; }
        .admin-endpoints-field--wide { flex: 1 1 280px; min-width: 240px; }
        .admin-endpoints-field--narrow { flex: 0 1 120px; min-width: 100px; }
        .admin-endpoints-input { padding: 8px 12px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 0.9rem; min-width: 0; width: 100%; box-sizing: border-box; }
        select.admin-endpoints-input { min-width: 160px; }
        .admin-endpoints-btn { padding: 8px 16px; border-radius: 6px; background: #f59e0b; color: #0f172a; font-weight: 600; border: none; cursor: pointer; font-size: 0.9rem; }
        .admin-endpoints-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .admin-endpoints-btn--danger { background: #ef4444 !important; color: #fff !important; }
        .admin-endpoints-btn--success { background: #22c55e !important; color: #0f172a !important; }
        .admin-endpoints-btn--ghost { background: transparent !important; border: 1px solid #475569 !important; color: #94a3b8 !important; font-weight: 500 !important; }
        .admin-endpoints-ok { margin-top: 12px; padding: 10px 14px; background: rgba(34,197,94,0.2); border: 1px solid #22c55e; border-radius: 6px; color: #86efac; font-size: 0.9rem; }
        .admin-endpoints-err { margin-top: 12px; padding: 10px 14px; background: rgba(239,68,68,0.2); border: 1px solid #ef4444; border-radius: 6px; color: #fca5a5; font-size: 0.9rem; }
        .admin-missions-table-wrap { overflow-x: auto; margin-top: 4px; -webkit-overflow-scrolling: touch; }
        .admin-missions-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .admin-missions-table th { color: #94a3b8; text-align: left; padding: 10px 8px; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #334155; }
        .admin-missions-table td { padding: 12px 8px; color: #e2e8f0; border-top: 1px solid rgba(148,163,184,0.12); vertical-align: top; }
        .admin-missions-table__name { font-weight: 700; color: #f1f5f9; }
        .admin-missions-table__desc { color: #94a3b8; font-size: 0.82rem; margin-top: 4px; line-height: 1.35; }
        .admin-missions-table__mono { font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 0.85rem; }
        .admin-missions-table__mode { color: #cbd5e1; }
        .admin-missions-table__reward { color: #f59e0b; font-weight: 800; }
        .admin-missions-table__muted { color: #94a3b8; font-size: 0.88rem; }
        .admin-missions-table__actions { white-space: nowrap; width: 1%; }
        .admin-missions-table__btn-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .admin-missions-table__empty { color: #94a3b8 !important; padding: 16px 8px !important; font-size: 0.9rem; }
        .admin-missions-modal-overlay { position: fixed; inset: 0; background: rgba(2,6,23,0.88); display: grid; place-items: center; z-index: 1000; padding: 16px; }
        .admin-missions-modal { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 24px; width: min(860px, 100%); max-height: 90vh; overflow-y: auto; box-sizing: border-box; }
        .admin-missions-modal__footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #334155; }
        .admin-missions-subtabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .admin-missions-subtab {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid #334155;
          background: #0f172a;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .admin-missions-subtab:hover { color: #e2e8f0; border-color: #475569; }
        .admin-missions-subtab--active {
          border-color: #f59e0b;
          color: #f59e0b;
          background: rgba(245,158,11,0.14);
        }
        .admin-missions-code {
          font-family: ui-monospace, 'Cascadia Code', monospace;
          font-size: 0.85em;
          color: #cbd5e1;
          background: #0f172a;
          padding: 0 4px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

