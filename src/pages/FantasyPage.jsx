import { useEffect, useMemo, useState } from 'react';
import { fetchFantasyPlayers, fetchFantasyGlobalRanking, fetchMyFantasyTeam, saveFantasyTeam } from '../services/fantasyService';
import './FantasyPage.css';
import { TrackedButton } from '../components/TrackedButton';

const BUDGET_MAX = 100;

export default function FantasyPage() {
  const [weekKey, setWeekKey] = useState('');
  const [players, setPlayers] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [team, setTeam] = useState([]);
  const [benchId, setBenchId] = useState('');
  const [captainId, setCaptainId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [playersData, rankingData] = await Promise.all([
          fetchFantasyPlayers(),
          fetchFantasyGlobalRanking(),
        ]);
        if (!alive) return;
        setWeekKey(playersData.weekKey);
        setPlayers(playersData.players || []);
        setRanking(rankingData || []);
        const myTeam = await fetchMyFantasyTeam(playersData.weekKey);
        if (!alive) return;
        if (myTeam?.players?.length) {
          setTeam(myTeam.players.map((p) => String(p.playerId)));
          setCaptainId(String(myTeam.captainId || ''));
          setBenchId(String(myTeam.benchId || ''));
        }
      } catch (err) {
        if (!alive) return;
        setError(err.message || 'Falha ao carregar fantasy');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  const byId = useMemo(() => new Map(players.map((p) => [String(p.id), p])), [players]);
  const selectedCards = useMemo(() => team.map((id) => byId.get(String(id))).filter(Boolean), [team, byId]);
  const benchCard = useMemo(() => (benchId ? byId.get(String(benchId)) : null), [benchId, byId]);
  const totalCost = useMemo(() => selectedCards.reduce((acc, p) => acc + Number(p.price || 0), 0), [selectedCards]);
  const budgetPct = Math.min(100, (totalCost / BUDGET_MAX) * 100);

  const removeStarter = (playerId) => {
    const key = String(playerId);
    setTeam((prev) => {
      const next = prev.filter((p) => p !== key);
      if (captainId === key) setCaptainId(next[0] || '');
      return next;
    });
  };

  const addStarter = (playerId) => {
    const key = String(playerId);
    setTeam((prev) => {
      if (prev.includes(key) || prev.length >= 5) return prev;
      const next = [...prev, key];
      if (!captainId) setCaptainId(key);
      return next;
    });
    if (benchId === key) setBenchId('');
  };

  const toggleBench = (playerId) => {
    const key = String(playerId);
    if (team.includes(key)) return;
    setBenchId((prev) => (prev === key ? '' : key));
  };

  const onDropToStarterSlot = (slotIndex, ev) => {
    ev.preventDefault();
    const playerId = String(ev.dataTransfer.getData('text/player-id') || '');
    if (!playerId) return;
    setTeam((prev) => {
      if (prev.includes(playerId)) return prev;
      if (prev.length < 5) {
        const next = [...prev];
        next[slotIndex] = playerId;
        return next.filter(Boolean).slice(0, 5);
      }
      const next = [...prev];
      next[slotIndex] = playerId;
      return next;
    });
    if (!captainId) setCaptainId(playerId);
    if (benchId === playerId) setBenchId('');
  };

  const onDropToBench = (ev) => {
    ev.preventDefault();
    const playerId = String(ev.dataTransfer.getData('text/player-id') || '');
    if (!playerId || team.includes(playerId)) return;
    setBenchId(playerId);
  };

  const onSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveFantasyTeam({ weekKey, players: team, captainId, benchId: benchId || null });
    } catch (err) {
      setError(err.message || 'Erro ao salvar time');
    } finally {
      setSaving(false);
    }
  };

  const canSave = team.length === 5 && !!captainId && totalCost <= BUDGET_MAX;

  return (
    <main className="fantasy-page">
      <section className="fantasy-hero">
        <h1>SnapFantasy CS2</h1>
        <p>Monte seu time com 5 pro players, escolha capitão e dispute o ranking semanal.</p>
      </section>

      {error && <div className="fantasy-error">{error}</div>}
      {loading && <div className="fantasy-loading">Carregando fantasy...</div>}

      {!loading && (
        <>
          <section className="fantasy-team-builder">
            <div className="fantasy-budget">
              <div className="fantasy-budget-header">
                <span>Budget</span>
                <strong>{totalCost.toFixed(1)} / {BUDGET_MAX}</strong>
              </div>
              <div className="fantasy-budget-bar">
                <div className="fantasy-budget-fill" style={{ width: `${budgetPct}%` }} />
              </div>
            </div>

            <div className="fantasy-selected fantasy-drop-grid">
              {Array.from({ length: 5 }).map((_, idx) => {
                const player = selectedCards[idx] || null;
                return (
                  <div
                    key={`slot-${idx}`}
                    className={`fantasy-selected-card fantasy-slot${player ? '' : ' fantasy-slot-empty'}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropToStarterSlot(idx, e)}
                  >
                    {player ? (
                      <>
                        <img src={player.image} alt={player.name} />
                        <div>
                          <strong>{player.name}</strong>
                          <small>{player.team}</small>
                        </div>
                        <TrackedButton
                          type="button"
                          className={captainId === String(player.id) ? 'captain active' : 'captain'}
                          onClick={() => setCaptainId(String(player.id))}
                        >
                          {captainId === String(player.id) ? 'CAPTAIN 2x' : 'Definir capitão'}
                        </TrackedButton>
                        <TrackedButton type="button" className="fantasy-remove" onClick={() => removeStarter(player.id)}>x</TrackedButton>
                      </>
                    ) : (
                      <span>Arraste um jogador para Slot {idx + 1}</span>
                    )}
                  </div>
                );
              })}
              <div className="fantasy-selected-card fantasy-bench" onDragOver={(e) => e.preventDefault()} onDrop={onDropToBench}>
                {benchCard ? (
                  <>
                    <img src={benchCard.image} alt={benchCard.name} />
                    <div>
                      <strong>Bench: {benchCard.name}</strong>
                      <small>{benchCard.team}</small>
                    </div>
                    <TrackedButton type="button" className="fantasy-remove" onClick={() => setBenchId('')}>x</TrackedButton>
                  </>
                ) : (
                  <span>Bench (opcional): arraste um jogador reserva</span>
                )}
              </div>
            </div>

            <TrackedButton type="button" className="fantasy-save" onClick={onSave} disabled={!canSave || saving}>
              {saving ? 'Salvando...' : 'Salvar Time da Semana'}
            </TrackedButton>
          </section>

          <section className="fantasy-grid">
            {players.map((player) => {
              const selected = team.includes(String(player.id));
              return (
                <article
                  key={player.id}
                  className={`fantasy-card ${selected ? 'selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' ? addStarter(player.id) : null)}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/player-id', String(player.id))}
                >
                  <img src={player.image} alt={player.name} className="fantasy-avatar" />
                  <div className="fantasy-card-content">
                    <h3>{player.name}</h3>
                    <p>{player.team}</p>
                    <div className="fantasy-meta">
                      <span>Rating {Number(player.rating || 0).toFixed(2)}</span>
                      <span>${Number(player.price || 0).toFixed(1)}</span>
                      <span className={`trend ${player.trend || 'steady'}`}>{player.trend || 'steady'}</span>
                    </div>
                    <div className="fantasy-card-actions">
                      <TrackedButton type="button" onClick={(e) => { e.stopPropagation(); addStarter(player.id); }} disabled={selected || team.length >= 5}>
                        Add Starter
                      </TrackedButton>
                      <TrackedButton type="button" onClick={(e) => { e.stopPropagation(); toggleBench(player.id); }} disabled={selected}>
                        {benchId === String(player.id) ? 'Bench ✓' : 'Set Bench'}
                      </TrackedButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="fantasy-ranking">
            <h2>Ranking Global</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jogador</th>
                  <th>Weekly</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row) => (
                  <tr key={row.userId}>
                    <td>{row.position}</td>
                    <td>{row.displayName}</td>
                    <td>{row.weeklyPoints}</td>
                    <td>{row.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

