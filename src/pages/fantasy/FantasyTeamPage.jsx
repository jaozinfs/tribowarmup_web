import { useEffect, useMemo, useState } from 'react';
import { createFantasyLeague, fetchFantasyPlayers, fetchMyFantasyLeagues, fetchMyFantasyTeam, joinFantasyLeague, saveFantasyTeam } from '../../services/fantasyService';
import { FifaPlayerCard } from '../../components/fantasy/FifaPlayerCard';
import { TrackedButton } from '../../components/TrackedButton';

const BUDGET_MAX = 100;

export default function FantasyTeamPage() {
  const [weekKey, setWeekKey] = useState('');
  const [players, setPlayers] = useState([]);
  const [team, setTeam] = useState([]);
  const [captainId, setCaptainId] = useState('');
  const [benchId, setBenchId] = useState('');
  const [leagues, setLeagues] = useState([]);
  const [leagueName, setLeagueName] = useState('');
  const [joinLeagueId, setJoinLeagueId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const playersData = await fetchFantasyPlayers();
        if (!alive) return;
        setWeekKey(playersData.weekKey);
        setPlayers(playersData.players || []);
        const [myTeam, myLeagues] = await Promise.all([
          fetchMyFantasyTeam(playersData.weekKey),
          fetchMyFantasyLeagues(),
        ]);
        if (!alive) return;
        setLeagues(myLeagues || []);
        if (myTeam?.players?.length) {
          setTeam(myTeam.players.map((p) => String(p.playerId)));
          setCaptainId(String(myTeam.captainId || ''));
          setBenchId(String(myTeam.benchId || ''));
        }
      } catch (err) {
        if (alive) setError(err.message || 'Falha ao carregar time fantasy');
      }
    })();
    return () => { alive = false; };
  }, []);

  const byId = useMemo(() => new Map(players.map((p) => [String(p.id), p])), [players]);
  const starters = useMemo(() => team.map((id) => byId.get(id)).filter(Boolean), [team, byId]);
  const bench = useMemo(() => (benchId ? byId.get(benchId) : null), [benchId, byId]);
  const totalCost = useMemo(() => starters.reduce((acc, p) => acc + Number(p.price || 0), 0), [starters]);

  const addStarter = (id) => {
    const key = String(id);
    setTeam((prev) => (prev.includes(key) || prev.length >= 5 ? prev : [...prev, key]));
    if (!captainId) setCaptainId(key);
    if (benchId === key) setBenchId('');
  };

  const removeStarter = (id) => {
    const key = String(id);
    setTeam((prev) => prev.filter((x) => x !== key));
    if (captainId === key) setCaptainId('');
  };

  const onDropStarter = (slotIndex, e) => {
    e.preventDefault();
    const id = String(e.dataTransfer.getData('text/player-id') || '');
    if (!id) return;
    setTeam((prev) => {
      const next = [...prev];
      next[slotIndex] = id;
      return [...new Set(next.filter(Boolean))].slice(0, 5);
    });
    if (!captainId) setCaptainId(id);
    if (benchId === id) setBenchId('');
  };

  const onDropBench = (e) => {
    e.preventDefault();
    const id = String(e.dataTransfer.getData('text/player-id') || '');
    if (!id || team.includes(id)) return;
    setBenchId(id);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await saveFantasyTeam({ weekKey, players: team, captainId, benchId: benchId || null });
    } catch (err) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const createLeague = async () => {
    if (!leagueName.trim()) return;
    try {
      await createFantasyLeague(leagueName.trim());
      setLeagueName('');
      setLeagues(await fetchMyFantasyLeagues());
    } catch (err) {
      setError(err.message || 'Erro ao criar liga');
    }
  };

  const joinLeague = async () => {
    if (!joinLeagueId.trim() || !joinCode.trim()) return;
    try {
      await joinFantasyLeague(joinLeagueId.trim(), joinCode.trim());
      setJoinLeagueId('');
      setJoinCode('');
      setLeagues(await fetchMyFantasyLeagues());
    } catch (err) {
      setError(err.message || 'Erro ao entrar na liga');
    }
  };

  return (
    <section className="fantasy-page-content">
      {error && <div className="fantasy-error-banner">{error}</div>}

      <div className="fantasy-team-shell">
        <div className="fantasy-lineup">
          <div className="fantasy-lineup-head">
            <h2>Meu Time da Semana</h2>
            <span>{totalCost.toFixed(1)} / {BUDGET_MAX}</span>
          </div>
          <div className="fantasy-lineup-pitch">
            {Array.from({ length: 5 }).map((_, idx) => {
              const p = starters[idx];
              return (
                <div key={idx} className={`fantasy-slot ${p ? '' : 'empty'}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropStarter(idx, e)}>
                  {p ? (
                    <>
                      <img src={p.image} alt={p.name} />
                      <div>
                        <strong>{p.name}</strong>
                        <small>{p.team}</small>
                      </div>
                      <TrackedButton type="button" className={captainId === String(p.id) ? 'chip active' : 'chip'} onClick={() => setCaptainId(String(p.id))}>CAP 2x</TrackedButton>
                      <TrackedButton type="button" className="remove" onClick={() => removeStarter(p.id)}>x</TrackedButton>
                    </>
                  ) : <span>Arraste jogador para o slot {idx + 1}</span>}
                </div>
              );
            })}
            <div className="fantasy-slot bench" onDragOver={(e) => e.preventDefault()} onDrop={onDropBench}>
              {bench ? (
                <>
                  <img src={bench.image} alt={bench.name} />
                  <div>
                    <strong>Bench: {bench.name}</strong>
                    <small>{bench.team}</small>
                  </div>
                  <TrackedButton type="button" className="remove" onClick={() => setBenchId('')}>x</TrackedButton>
                </>
              ) : <span>Bench opcional</span>}
            </div>
          </div>
          <TrackedButton type="button" className="fantasy-btn fantasy-btn-primary" disabled={saving || team.length !== 5 || !captainId || totalCost > BUDGET_MAX} onClick={save}>
            {saving ? 'Salvando...' : 'Salvar Time'}
          </TrackedButton>
        </div>

        <div className="fantasy-player-pool">
          <h2>Mercado de Jogadores</h2>
          <div className="fifa-grid">
            {players.map((player) => (
              <FifaPlayerCard
                key={player.id}
                player={player}
                selected={team.includes(String(player.id))}
                isBench={benchId === String(player.id)}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/player-id', String(player.id))}
                onAddStarter={() => addStarter(player.id)}
                onSetBench={() => setBenchId((prev) => (prev === String(player.id) ? '' : String(player.id)))}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="fantasy-leagues-panel">
        <h2>Ligas Privadas</h2>
        <div className="fantasy-league-actions">
          <input value={leagueName} onChange={(e) => setLeagueName(e.target.value)} placeholder="Nome da liga" />
          <TrackedButton type="button" className="fantasy-btn fantasy-btn-glass" onClick={createLeague}>Criar Liga</TrackedButton>
          <input value={joinLeagueId} onChange={(e) => setJoinLeagueId(e.target.value)} placeholder="ID da liga" />
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Código convite" />
          <TrackedButton type="button" className="fantasy-btn fantasy-btn-glass" onClick={joinLeague}>Entrar</TrackedButton>
        </div>
        <div className="fantasy-league-list">
          {leagues.map((league) => (
            <div key={league.id} className="fantasy-league-item">
              <strong>{league.name}</strong>
              <span>ID {league.id}</span>
              <span>Invite: {league.inviteCode}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

