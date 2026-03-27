import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { TrackedButton } from '../components/TrackedButton';
import {
  createFantasyLeague,
  fetchFantasyGlobalRanking,
  fetchFantasyInventory,
  fetchFantasyPacks,
  fetchFantasyLeagueRanking,
  fetchFantasyPlayers,
  fetchFantasySession,
  fetchFantasyWeekMeta,
  fetchFantasyWeeklyRanking,
  fetchMyFantasyStatement,
  fetchMyFantasySummary,
  fetchMyFantasyLeagues,
  fetchMyFantasyTeam,
  joinFantasyLeague,
  markFantasyTutorialDone,
  openFantasyPack,
  saveFantasyTeam,
} from '../services/fantasyService';
import { FifaPlayerCard } from '../components/fantasy/FifaPlayerCard';
import { FantasyTutorialModal } from '../components/fantasy/FantasyTutorialModal';
import { FantasyPlayerDetailModal } from '../components/fantasy/FantasyPlayerDetailModal';
import { roleForPlayerId, roleSlotIndex, ROLE_LABELS_PT } from '../utils/fantasyRole';
import './FantasyIntegratedPage.css';

const BUDGET_MAX = 100;

const TAB_PACKS = 'packs';
const TAB_HOME = 'home';
const TAB_CARDS = 'cards';
const TAB_TEAM = 'team';
const TAB_RANKING = 'ranking';

const PITCH_SLOTS = [
  { key: 's0', className: 'fantasy-pitch-slot fantasy-pitch-slot--st', role: 'captain', label: 'Capitão' },
  { key: 's1', className: 'fantasy-pitch-slot fantasy-pitch-slot--ml', role: 'support', label: 'Support' },
  { key: 's2', className: 'fantasy-pitch-slot fantasy-pitch-slot--mr', role: 'entry', label: 'Entry' },
  { key: 's3', className: 'fantasy-pitch-slot fantasy-pitch-slot--dl', role: 'lurk', label: 'Lurk' },
  { key: 's4', className: 'fantasy-pitch-slot fantasy-pitch-slot--dr', role: 'anchor', label: 'Âncora' },
];

function formatPackDropPercent(chance) {
  const n = Number(chance);
  if (!Number.isFinite(n) || n < 0) return '—';
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(Math.min(100, pct))}%`;
}

function formatMsToCountdown(ms) {
  const x = Math.max(0, Number(ms || 0));
  const totalSec = Math.floor(x / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function rarityToPackDistributionKey(r) {
  const x = String(r || 'common').toLowerCase();
  if (x === 'uncommon') return 'common';
  if (x === 'mythic') return 'legendary';
  return x;
}

function rarityRank(r) {
  const x = String(r || 'common').toLowerCase();
  if (x === 'mythic') return 5;
  if (x === 'legendary') return 4;
  if (x === 'epic') return 3;
  if (x === 'rare') return 2;
  return 1;
}

function makeInviteHint(leagues) {
  if (!leagues?.length) return 'Crie sua primeira liga para competir com amigos.';
  return `Você está em ${leagues.length} liga(s).`;
}

function mergePlayerIntoCache(cache, player) {
  if (!player?.id) return cache;
  const next = new Map(cache);
  next.set(String(player.id), player);
  return next;
}

export default function FantasyIntegratedPage() {
  const auth = useAuth();
  const profile = useProfile();
  const [tab, setTab] = useState(TAB_HOME);
  const [weekKey, setWeekKey] = useState('');
  const [playerCache, setPlayerCache] = useState(() => new Map());

  const [marketPlayers, setMarketPlayers] = useState([]);
  const [marketTotal, setMarketTotal] = useState(0);
  const [marketPage, setMarketPage] = useState(1);
  const [marketPages, setMarketPages] = useState(1);
  const [marketQ, setMarketQ] = useState('');
  const [marketSort, setMarketSort] = useState('rating');
  const [marketTeam, setMarketTeam] = useState('');

  const [team, setTeam] = useState(['', '', '', '', '']);
  const [benchId, setBenchId] = useState('');
  const [coachId, setCoachId] = useState('');
  const [inventoryIds, setInventoryIds] = useState(() => new Set());
  const [inventoryCards, setInventoryCards] = useState([]);

  const [globalRanking, setGlobalRanking] = useState([]);
  const [weeklyRanking, setWeeklyRanking] = useState([]);
  const [packs, setPacks] = useState([]);
  const [packDistribution, setPackDistribution] = useState([]);
  const [selectedPackId, setSelectedPackId] = useState('');
  const [packView, setPackView] = useState('list');
  const [packPage, setPackPage] = useState(1);
  const [packPages, setPackPages] = useState(1);
  const [packTotal, setPackTotal] = useState(0);
  const [packQ, setPackQ] = useState('');
  const [packTier, setPackTier] = useState('');
  const [packSort, setPackSort] = useState('rank');
  const [cardRarityFilter, setCardRarityFilter] = useState('');
  const [cardTeamFilter, setCardTeamFilter] = useState('');
  const [cardSort, setCardSort] = useState('recent');
  const [marketOwnedOnly, setMarketOwnedOnly] = useState(false);
  const [marketRoleFilter, setMarketRoleFilter] = useState('');
  const [ownedMarketPage, setOwnedMarketPage] = useState(1);
  const [leagueRanking, setLeagueRanking] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [leagueId, setLeagueId] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [joinLeagueId, setJoinLeagueId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [session, setSession] = useState(null);
  const [weekMeta, setWeekMeta] = useState(null);
  const [mySummary, setMySummary] = useState(null);
  const [myStatement, setMyStatement] = useState([]);
  const [toast, setToast] = useState(null);
  const [packOpening, setPackOpening] = useState(false);
  const [packOpeningFlow, setPackOpeningFlow] = useState(null); // { teamName, cards, revealCount, suspense, phase, glowRarity, teamImage }
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [detailPlayer, setDetailPlayer] = useState(null);
  const skipFilterReload = useRef(true);
  const selectedPackIdRef = useRef('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5200);
    return () => clearTimeout(t);
  }, [toast]);

  const loadMarket = useCallback(async (page, wk) => {
    const data = await fetchFantasyPlayers({
      week: wk,
      page,
      limit: 24,
      q: marketQ || undefined,
      sort: marketSort,
      team: marketTeam || undefined,
      role: marketRoleFilter || undefined,
    });
    setWeekKey(data.weekKey || wk);
    setMarketPlayers(data.players || []);
    setMarketTotal(data.total || 0);
    setMarketPage(data.page || page);
    setMarketPages(data.totalPages || 1);
    setPlayerCache((prev) => {
      let next = prev;
      (data.players || []).forEach((p) => { next = mergePlayerIntoCache(next, p); });
      return next;
    });
  }, [marketQ, marketSort, marketTeam, marketRoleFilter]);

  const loadPacks = useCallback(async (wk, page = 1) => {
    const data = await fetchFantasyPacks({
      week: wk,
      page,
      limit: 12,
      q: packQ || undefined,
      tier: packTier || undefined,
      sort: packSort || undefined,
    });
    setPacks(data.packs || []);
    if (data.distribution) setPackDistribution(data.distribution);
    setPackPage(data.page || page);
    setPackPages(data.totalPages || 1);
    setPackTotal(data.total || 0);
    const currentId = selectedPackIdRef.current;
    if ((data.packs || []).length && !(data.packs || []).some((p) => String(p.id) === String(currentId))) {
      setSelectedPackId(String(data.packs[0].id));
    }
    return data;
  }, [packQ, packTier, packSort]);

  useEffect(() => {
    selectedPackIdRef.current = String(selectedPackId || '');
  }, [selectedPackId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const first = await fetchFantasyPlayers({ page: 1, limit: 24, sort: 'rating' });
        if (!alive) return;
        setWeekKey(first.weekKey || '');
        setMarketPlayers(first.players || []);
        setMarketTotal(first.total || 0);
        setMarketPage(first.page || 1);
        setMarketPages(first.totalPages || 1);
        setPlayerCache((prev) => {
          let next = prev;
          (first.players || []).forEach((p) => { next = mergePlayerIntoCache(next, p); });
          return next;
        });

        const wk = first.weekKey || '';

        const promises = [
          fetchMyFantasyTeam(wk),
          fetchMyFantasyLeagues(),
          fetchFantasyGlobalRanking(),
          fetchFantasyWeeklyRanking(wk),
        ];
        if (auth?.steamId) {
          promises.push(
            fetchFantasySession(wk),
            fetchFantasyInventory(wk),
            loadPacks(wk, 1),
            fetchFantasyWeekMeta(),
            fetchMyFantasySummary(),
            fetchMyFantasyStatement(12),
          );
        }

        const results = await Promise.all(promises);
        if (!alive) return;

        let i = 0;
        const myTeam = results[i++];
        const myLeagues = results[i++];
        const gRank = results[i++];
        const wRank = results[i++];
        const sess = auth?.steamId ? results[i++] : null;
        const inv = auth?.steamId ? results[i++] : null;
        const packsData = auth?.steamId ? results[i++] : null;
        const meta = auth?.steamId ? results[i++] : null;
        const summary = auth?.steamId ? results[i++] : null;
        const statement = auth?.steamId ? results[i++] : null;

        if (sess) {
          setSession(sess);
          if (sess.visitReward) setToast(`+${sess.visitReward.packTokens} pacote · +${sess.visitReward.coins} coins`);
          if (sess.starterGranted) setToast('Starter pack: 12 cartas + fichas extras!');
        }
        if (meta) setWeekMeta(meta);
        if (summary) setMySummary(summary);
        if (Array.isArray(statement)) setMyStatement(statement);

        if (inv?.cards?.length) {
          setInventoryIds(new Set(inv.cards.map((c) => String(c.playerId))));
          setInventoryCards((inv.cards || []).filter((c) => c.image));
          setPlayerCache((prev) => {
            let next = prev;
            inv.cards.forEach((c) => {
              next = mergePlayerIntoCache(next, {
                id: c.playerId,
                name: c.name,
                team: c.team,
                image: c.image,
                price: c.price,
                rating: c.rating,
                rarity: c.rarity,
                role: c.role || roleForPlayerId(c.playerId),
                weeklyStats: c.weeklyStats,
                trend: 'steady',
              });
            });
            return next;
          });
        }
        if (!inv?.cards?.length) {
          setInventoryCards([]);
        }
        if (packsData?.packs?.length) {
          setPacks(packsData.packs || []);
          if (packsData.distribution) setPackDistribution(packsData.distribution);
          if (!selectedPackIdRef.current) setSelectedPackId(String(packsData.packs[0]?.id || ''));
          // Mantém INÍCIO como primeira aba; packs ficam acessíveis via CTA dentro do início.
        }

        if (myTeam?.players?.length) {
          const slots = ['', '', '', '', ''];
          for (const p of myTeam.players) {
            const pid = String(p.playerId);
            const idx = roleSlotIndex(roleForPlayerId(pid));
            if (idx >= 0) slots[idx] = pid;
          }
          setTeam(slots);
          setBenchId(String(myTeam.benchId || ''));
          setCoachId(String(myTeam.coachId || ''));
        } else {
          setTeam(['', '', '', '', '']);
          setBenchId('');
          setCoachId('');
        }

        setLeagues(myLeagues || []);
        if ((myLeagues || []).length) setLeagueId(String(myLeagues[0].id));
        setGlobalRanking(gRank || []);
        setWeeklyRanking(wRank || []);

        if (auth?.steamId && sess && !sess.tutorialSeen) {
          setTutorialOpen(true);
        }
      } catch (err) {
        if (alive) setError(err.message || 'Falha ao carregar fantasy');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [auth?.steamId, loadPacks]);

  useEffect(() => {
    if (!weekMeta?.nextResetAt) return undefined;
    const t = setInterval(() => {
      setWeekMeta((prev) => (prev ? { ...prev, msRemaining: Math.max(0, new Date(prev.nextResetAt).getTime() - Date.now()) } : prev));
    }, 1000);
    return () => clearInterval(t);
  }, [weekMeta?.nextResetAt]);

  useEffect(() => {
    if (!weekKey || !auth?.steamId) return;
    const t = setTimeout(() => {
      loadPacks(weekKey, 1).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [weekKey, auth?.steamId, packQ, packTier, packSort, loadPacks]);

  useEffect(() => {
    if (!weekKey || loading) return;
    if (skipFilterReload.current) {
      skipFilterReload.current = false;
      return;
    }
    const t = setTimeout(() => {
      loadMarket(1, weekKey)
        .then(() => setMarketPage(1))
        .catch((err) => setError(err.message));
    }, 320);
    return () => clearTimeout(t);
  }, [marketQ, marketSort, marketTeam, marketRoleFilter, weekKey, loading, loadMarket]);

  useEffect(() => {
    setOwnedMarketPage(1);
  }, [marketOwnedOnly, marketQ, marketTeam, marketRoleFilter, marketSort]);

  useEffect(() => {
    if (!leagueId || !weekKey) {
      setLeagueRanking([]);
      return;
    }
    fetchFantasyLeagueRanking(leagueId, weekKey)
      .then((rows) => setLeagueRanking(Array.isArray(rows) ? rows : []))
      .catch((err) => setError(err.message || 'Erro ao carregar ranking da liga'));
  }, [leagueId, weekKey]);

  const byId = useMemo(() => playerCache, [playerCache]);

  const teamMarketSource = useMemo(() => {
    const PAGE_SIZE = 24;
    if (!marketOwnedOnly) {
      return {
        list: marketPlayers,
        total: marketTotal,
        pages: marketPages,
        page: marketPage,
        setPage: setMarketPage,
        mode: 'api',
      };
    }

    let rows = inventoryCards.map((inv) => {
      const id = String(inv.playerId || inv.id);
      const cached = playerCache.get(id);
      if (cached) return cached;
      return {
        id,
        name: inv.name,
        team: inv.team,
        image: inv.image,
        rating: inv.rating,
        rarity: inv.rarity,
        role: inv.role,
        price: inv.price,
        weeklyStats: inv.weeklyStats || {},
        trend: 'steady',
      };
    });

    if (marketRoleFilter) {
      rows = rows.filter((p) => String(p.role || '').toLowerCase() === marketRoleFilter.toLowerCase());
    }
    const q = marketQ.trim().toLowerCase();
    const tf = marketTeam.trim().toLowerCase();
    if (q) rows = rows.filter((p) => `${p.name} ${p.team}`.toLowerCase().includes(q));
    if (tf) rows = rows.filter((p) => String(p.team || '').toLowerCase().includes(tf));

    rows = [...rows].sort((a, b) => {
      if (marketSort === 'price') return Number(b.price) - Number(a.price);
      if (marketSort === 'name') return String(a.name).localeCompare(String(b.name));
      if (marketSort === 'rarity') {
        const order = { mythic: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1, bronze: 0 };
        return Number(order[String(b.rarity || '').toLowerCase()] || 0) - Number(order[String(a.rarity || '').toLowerCase()] || 0);
      }
      return Number(b.rating) - Number(a.rating);
    });

    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
    const page = Math.min(Math.max(1, ownedMarketPage), pages);
    const start = (page - 1) * PAGE_SIZE;
    const list = rows.slice(start, start + PAGE_SIZE);

    return {
      list,
      total,
      pages,
      page,
      setPage: setOwnedMarketPage,
      mode: 'inventory',
    };
  }, [
    marketOwnedOnly,
    inventoryCards,
    playerCache,
    marketPlayers,
    marketTotal,
    marketPages,
    marketPage,
    marketQ,
    marketTeam,
    marketSort,
    marketRoleFilter,
    ownedMarketPage,
  ]);

  const selectedPack = useMemo(() => packs.find((p) => String(p.id) === String(selectedPackId)) || null, [packs, selectedPackId]);
  const bench = useMemo(() => (benchId ? byId.get(benchId) : null), [benchId, byId]);
  const coach = useMemo(() => (coachId ? byId.get(coachId) : null), [coachId, byId]);
  const totalCost = useMemo(
    () => team.filter(Boolean).reduce((acc, id) => acc + Number(byId.get(id)?.price || 0), 0),
    [team, byId],
  );
  const addStarter = (id) => {
    const key = String(id);
    if (!inventoryIds.has(key)) {
      setError('Adicione este jogador à coleção abrindo pacotes antes de escalar.');
      return;
    }
    if (roleForPlayerId(key) === 'coach') {
      setError('Cartas com posição Técnico só podem ir no slot Técnico.');
      return;
    }
    const slot = roleSlotIndex(roleForPlayerId(key));
    setError('');
    setTeam((prev) => {
      const next = [...prev];
      while (next.length < 5) next.push('');
      if (next[slot] && next[slot] !== key) {
        setError(`Slot ${ROLE_LABELS_PT[PITCH_SLOTS[slot]?.role]} já está ocupado.`);
        return prev;
      }
      next[slot] = key;
      return next;
    });
    if (benchId === key) setBenchId('');
    if (coachId === key) setCoachId('');
  };

  const removeStarter = (id) => {
    const key = String(id);
    setTeam((prev) => prev.map((x) => (x === key ? '' : x)));
  };

  const onDropStarter = (slotIndex, e) => {
    e.preventDefault();
    const id = String(e.dataTransfer.getData('text/player-id') || '');
    if (!id || !inventoryIds.has(id)) {
      setError('Só cartas da sua coleção podem ir ao campo.');
      return;
    }
    const need = PITCH_SLOTS[slotIndex]?.role;
    const got = roleForPlayerId(id);
    if (need && got !== need) {
      setError(`Este slot é só para ${ROLE_LABELS_PT[need]}.`);
      return;
    }
    setError('');
    setTeam((prev) => {
      const next = [...prev];
      while (next.length < 5) next.push('');
      next[slotIndex] = id;
      return next;
    });
    if (benchId === id) setBenchId('');
    if (coachId === id) setCoachId('');
  };

  const onDropBench = (e) => {
    e.preventDefault();
    const id = String(e.dataTransfer.getData('text/player-id') || '');
    if (!id || !inventoryIds.has(id)) {
      setError('Bench precisa ser uma carta da coleção.');
      return;
    }
    if (roleForPlayerId(id) === 'coach') {
      setError('Cartas Técnico não vão no bench; use o slot Técnico.');
      return;
    }
    if (team.includes(id)) return;
    setBenchId(id);
    if (coachId === id) setCoachId('');
  };

  const onDropCoach = (e) => {
    e.preventDefault();
    const id = String(e.dataTransfer.getData('text/player-id') || '');
    if (!id || !inventoryIds.has(id)) {
      setError('O técnico precisa ser uma carta da sua coleção.');
      return;
    }
    if (roleForPlayerId(id) !== 'coach') {
      setError('Somente cartas com posição Técnico podem ir neste slot.');
      return;
    }
    if (team.includes(id)) return;
    setCoachId(id);
    if (benchId === id) setBenchId('');
  };

  const onSaveTeam = async () => {
    setSaving(true);
    setError('');
    try {
      const data = await saveFantasyTeam({
        weekKey,
        players: team,
        captainId: team[0] || '',
        benchId: benchId || null,
        coachId: coachId || null,
      });
      if (data.teamSaveReward) {
        setToast(data.teamSaveReward.message || `+${data.teamSaveReward.coins} coins`);
      }
    } catch (err) {
      setError(err.message || 'Erro ao salvar time');
    } finally {
      setSaving(false);
    }
  };

  const onCreateLeague = async () => {
    if (!leagueName.trim()) return;
    try {
      await createFantasyLeague(leagueName.trim());
      setLeagueName('');
      const refreshed = await fetchMyFantasyLeagues();
      setLeagues(refreshed || []);
      if ((refreshed || []).length) setLeagueId(String(refreshed[0].id));
    } catch (err) {
      setError(err.message || 'Erro ao criar liga');
    }
  };

  const onJoinLeague = async () => {
    if (!joinLeagueId.trim() || !joinCode.trim()) return;
    try {
      await joinFantasyLeague(joinLeagueId.trim(), joinCode.trim());
      setJoinLeagueId('');
      setJoinCode('');
      const refreshed = await fetchMyFantasyLeagues();
      setLeagues(refreshed || []);
      if ((refreshed || []).length) setLeagueId(String(refreshed[0].id));
    } catch (err) {
      setError(err.message || 'Erro ao entrar na liga');
    }
  };

  const handleOpenPack = async () => {
    if (!auth?.steamId) {
      setError('Entre com Steam para abrir pacotes.');
      return;
    }
    if (!selectedPackId) {
      setError('Selecione um pack de time.');
      return;
    }
    setPackOpening(true);
    setError('');
    try {
      const data = await openFantasyPack({ weekKey, packId: selectedPackId });
      const cards = data.cards || [];
      const glowRarity = [...cards]
        .sort((a, b) => rarityRank(b?.rarity) - rarityRank(a?.rarity))[0]?.rarity || 'rare';
      setPackOpeningFlow({
        teamName: data.teamName || packs.find((p) => p.id === selectedPackId)?.teamName || 'Time',
        teamImage: selectedPack?.image || null,
        cards,
        revealCount: 0,
        suspense: true,
        phase: 'tear',
        glowRarity,
      });
      setTimeout(() => {
        setPackOpeningFlow((prev) => (prev ? { ...prev, suspense: false, phase: 'reveal' } : prev));
      }, 3600);
      setTimeout(() => {
        setPackOpeningFlow((prev) => (prev ? { ...prev, revealCount: 1 } : prev));
      }, 3900);
      setTimeout(() => {
        setPackOpeningFlow((prev) => (prev ? { ...prev, revealCount: 2 } : prev));
      }, 4300);
      setToast(`Pacote aberto! +${data.cards?.length || 0} cartas`);
      setInventoryIds((prev) => {
        const next = new Set(prev);
        (data.cards || []).forEach((c) => next.add(String(c.id || c.playerId)));
        return next;
      });
      setInventoryCards((prev) => {
        const map = new Map((prev || []).map((x) => [String(x.playerId || x.id), x]));
        (data.cards || []).forEach((c) => {
          const id = String(c.id || c.playerId);
          map.set(id, { ...c, playerId: id, acquiredAt: new Date().toISOString() });
        });
        return [...map.values()];
      });
      setSession((prev) => (prev ? { ...prev, giveawayTickets: data.giveawayTicketsLeft ?? data.packTokensLeft, packTokens: data.packTokensLeft, shards: data.shards } : prev));
      try {
        const inv = await fetchFantasyInventory(weekKey);
        setInventoryIds(new Set((inv.cards || []).map((c) => String(c.playerId))));
        setInventoryCards((inv.cards || []).filter((c) => c.image));
        setPlayerCache((prev) => {
          let next = prev;
          (inv.cards || []).forEach((c) => {
            next = mergePlayerIntoCache(next, {
              id: c.playerId,
              name: c.name,
              team: c.team,
              image: c.image,
              price: c.price,
              rating: c.rating,
              rarity: c.rarity,
              role: c.role || roleForPlayerId(c.playerId),
              weeklyStats: c.weeklyStats,
              trend: 'steady',
            });
          });
          return next;
        });
      } catch (_) {
        // Keep optimistic state if inventory refresh fails
      }
      loadMarket(marketPage, weekKey).catch(() => {});
    } catch (err) {
      setError(err.message || 'Erro ao abrir pacote');
    } finally {
      setPackOpening(false);
    }
  };

  const finishTutorial = async () => {
    try {
      await markFantasyTutorialDone();
    } catch (_) {}
    setTutorialOpen(false);
    setTutorialStep(0);
  };

  const renderPitchCard = (p, slotIdx) => {
    const slot = PITCH_SLOTS[slotIdx];
    if (!p) {
      return <span className="fantasy-slot-placeholder">{slot?.label || `Slot ${slotIdx + 1}`}</span>;
    }
    return (
      <div className="fantasy-pitch-card-inner">
        <span className="fantasy-pitch-role-tag">{ROLE_LABELS_PT[slot?.role] || slot?.label}</span>
        <img src={p.image} alt="" className="fantasy-pitch-card-img" referrerPolicy="no-referrer" />
        <div className="fantasy-pitch-card-name">{p.name}</div>
        {slotIdx === 0 && <span className="fantasy-cap-badge">CAP 2x</span>}
        <TrackedButton type="button" className="remove" onClick={() => removeStarter(p.id)}>×</TrackedButton>
      </div>
    );
  };

  return (
    <div className="app fantasy-integrated-page">
      <div className="scanlines" />
      <div className="grid-bg" />
      <div className="fantasy-blob fantasy-blob--cyan" />
      <div className="fantasy-blob fantasy-blob--violet" />

      <header className="header home-header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">SnapTap.com.br</div>
            <div className="header-sub">FANTASY · TREINO · LOADOUT · MIX · SQUAD</div>
          </div>
        </div>
        <HamburgerNav activePath="/fantasy" auth={auth} profile={profile} returnTo="/fantasy" />
      </header>

      <main className="fantasy-integrated-main">
        <section className="fantasy-hero-kings">
          <p className="fantasy-kings-badge">SNAPFANTASY WEEKLY</p>
          <h1>Fantasy CS2 integrado ao SnapTap</h1>
          <p>
           Pacotes com raridade por rating HLTV e ranking global.
          </p>
          <div className="fantasy-menu-hero">
            <img src="/fantasy/fantasy-menu.png" alt="Fantasy menu" className="fantasy-menu-hero__img" loading="lazy" />
          </div>
          <Tabs.Root value={tab} onValueChange={setTab}>
            <Tabs.List className="fantasy-top-tabs" aria-label="Navegação do Fantasy">
              <Tabs.Trigger value={TAB_HOME} className="fantasy-top-tab-trigger">Início</Tabs.Trigger>
              <Tabs.Trigger value={TAB_PACKS} className="fantasy-top-tab-trigger">Pacotes</Tabs.Trigger>
              <Tabs.Trigger value={TAB_CARDS} className="fantasy-top-tab-trigger">Meus Jogadores</Tabs.Trigger>
              <Tabs.Trigger value={TAB_TEAM} className="fantasy-top-tab-trigger">Meu Time</Tabs.Trigger>
              <Tabs.Trigger value={TAB_RANKING} className="fantasy-top-tab-trigger">Ranking</Tabs.Trigger>
              <TrackedButton type="button" className="fantasy-ghost-btn fantasy-help" onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}>Tutorial</TrackedButton>
            </Tabs.List>
            <Tabs.Content value={TAB_HOME} className="fantasy-tab-content">
          {!loading && (
          <section className="fantasy-panel fantasy-home-panel">
            <div className="fantasy-panel-head">
              <h2>Seu SnapFantasy</h2>
              <span className="fantasy-home-countdown">
                Reset em <strong>{weekMeta?.msRemaining != null ? formatMsToCountdown(weekMeta.msRemaining) : '—'}</strong>
              </span>
            </div>

            <div className="fantasy-home-grid">
              <div className="fantasy-home-card">
                <span>Rounds (semanas) jogados</span>
                <strong>{mySummary?.weeksPlayed ?? '—'}</strong>
              </div>
              <div className="fantasy-home-card">
                <span>Último reset</span>
                <strong>{mySummary?.lastDeltaLp != null ? `+${mySummary.lastDeltaLp} LP` : '—'}</strong>
              </div>
              <div className="fantasy-home-card">
                <span>Time da semana</span>
                <strong>{mySummary?.hasCompleteTeam ? 'Completo' : 'Incompleto'}</strong>
              </div>
            </div>

            <div className="fantasy-home-cta-row">
              <TrackedButton type="button" className="fantasy-primary-btn" onClick={() => setTab(TAB_TEAM)} disabled={!auth?.steamId}>
                Montar / revisar time
              </TrackedButton>
              <TrackedButton type="button" className="fantasy-ghost-btn" onClick={() => setTab(TAB_PACKS)} disabled={!auth?.steamId}>
                Abrir pacotes
              </TrackedButton>
            </div>

            <div className="fantasy-home-statement">
              <h3>Extrato de LP</h3>
              <div className="fantasy-home-statement-list">
                {(myStatement || []).map((row) => (
                  <div key={row.weekKey} className="fantasy-home-statement-row">
                    <div className="wk">{row.weekKey}</div>
                    <div className="dt">{row.processedAt ? new Date(row.processedAt).toLocaleString('pt-BR') : '—'}</div>
                    <div className="dlp">+{row.deltaLp} <small>LP</small></div>
                  </div>
                ))}
                {!myStatement?.length && <div className="fantasy-home-empty">Sem resets processados ainda.</div>}
              </div>
            </div>
          </section>
        )}
            </Tabs.Content>
          {auth?.steamId && session && (
            <div className="fantasy-wallet-bar">
              <span>Fichas: <strong>{session.giveawayTickets ?? session.packTokens ?? 0}</strong></span>
              <span>Coins: <strong>{session.fantasyCoins ?? 0}</strong></span>
              <span>Shards: <strong>{session.shards ?? 0}</strong></span>
              <span>Coleção: <strong>{inventoryIds.size}</strong> cartas</span>
            </div>
          )}
        {toast && <div className="fantasy-toast">{toast}</div>}
        {error && <div className="fantasy-error-banner">{error}</div>}
        {loading && <div className="fantasy-loading-banner">Carregando SnapFantasy...</div>}

            <Tabs.Content value={TAB_PACKS} className="fantasy-tab-content">
        {!loading && (
          <section className="fantasy-panel fantasy-pack-shop">
            <div className="fantasy-panel-head">
              <h2>Loja de Pacotes</h2>
              <span>{session?.giveawayTickets ?? session?.packTokens ?? 0} fichas</span>
            </div>
            <div className="fantasy-market-toolbar">
              <input className="fantasy-input" placeholder="Buscar pacote por time..." value={packQ} onChange={(e) => setPackQ(e.target.value)} />
              <select className="fantasy-select" value={packTier} onChange={(e) => setPackTier(e.target.value)}>
                <option value="">Tier (todos)</option>
                <option value="S">Tier S</option>
                <option value="A">Tier A</option>
                <option value="B">Tier B</option>
                <option value="C">Tier C</option>
              </select>
              <select className="fantasy-select" value={packSort} onChange={(e) => setPackSort(e.target.value)}>
                <option value="rank">Ranking HLTV</option>
                <option value="cost">Preço</option>
                <option value="name">Nome</option>
              </select>
            </div>
            <p className="fantasy-market-meta">{packTotal} pacotes · página {packPage} / {packPages}</p>

            {packView === 'list' ? (
              <div className="fantasy-pack-store-grid">
                {packs.map((p) => (
                  <TrackedButton
                    key={p.id}
                    type="button"
                    className={`fantasy-pack-store-card fantasy-pack-store-card--glow ${selectedPackId === p.id ? 'active' : ''}`}
                    onClick={() => { setSelectedPackId(String(p.id)); setPackView('detail'); }}
                  >
                    <span className="fantasy-pack-glow-sweep" aria-hidden />
                    <div className="fantasy-pack-sticker-inner">
                      <div className="fantasy-pack-art" aria-hidden>
                        <img src="/fantasy/pack-base.png" alt="" className="fantasy-pack-art__base" />
                        <div className="fantasy-pack-art__center">
                          <span className="fantasy-pack-art__center-bg" aria-hidden />
                          {p.image ? (
                            <img src={p.image} alt="" className="fantasy-pack-art__logo" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="fantasy-pack-art__logo fantasy-pack-art__logo--fallback">?</div>
                          )}
                        </div>
                      </div>
                      <strong>{p.name || `Pack ${p.teamName}`}</strong>
                      <small>Tier {p.tier || 'C'} · {p.possiblePlayers} jogadores</small>
                    </div>
                    <span className="fantasy-pack-store-price fantasy-pack-store-price--corner">{p.costTokens || 10} fichas</span>
                  </TrackedButton>
                ))}
              </div>
            ) : (
              <div className="fantasy-pack-detail-page">
                <TrackedButton type="button" className="fantasy-pack-back-btn" onClick={() => setPackView('list')}>← Voltar</TrackedButton>

                <header className="fantasy-pack-detail-header fantasy-pack-detail-header--gold">
                  <div className="fantasy-pack-detail-sticker fantasy-pack-detail-sticker--gold">
                    <span className="fantasy-pack-gold-shine" aria-hidden />
                    <div className="fantasy-pack-art fantasy-pack-art--detail" aria-hidden>
                      <img src="/fantasy/pack-base.png" alt="" className="fantasy-pack-art__base" />
                      <div className="fantasy-pack-art__center">
                        <span className="fantasy-pack-art__center-bg" aria-hidden />
                        {selectedPack?.image ? (
                          <img src={selectedPack.image} alt="" className="fantasy-pack-art__logo" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="fantasy-pack-art__logo fantasy-pack-art__logo--fallback">?</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3>{selectedPack?.name || 'Pacote'}</h3>
                    <p className="fantasy-pack-detail-sub">Tier {selectedPack?.tier || 'C'} · até {selectedPack?.possiblePlayers} jogadores no pool</p>
                  </div>
                </header>

                <p className="fantasy-pack-flavor">
                  Cada abertura é como rasgar um booster: duas cartas por pacote, com brilho de raridade variável.
                  As chances abaixo valem por carta revelada (como em Yu-Gi-Oh!, Pokémon TCG ou figurinhas de álbum).
                </p>

                <ul className="fantasy-pack-drop-table">
                  {(packDistribution.length ? packDistribution : [{ rarity: 'common', chance: 0.6 }, { rarity: 'rare', chance: 0.25 }, { rarity: 'epic', chance: 0.1 }, { rarity: 'legendary', chance: 0.05 }]).map((row) => (
                    <li key={row.rarity}>
                      <span className={`fifa-rarity-badge fifa-rarity-badge--${row.rarity}`}>{row.rarity}</span>
                      <span className="fantasy-pack-drop-pct">{formatPackDropPercent(row.chance)}</span>
                    </li>
                  ))}
                </ul>

                <div className="fantasy-pack-detail-open-wrap">
                  <TrackedButton
                    type="button"
                    className="fantasy-pack-rip-btn"
                    onClick={handleOpenPack}
                    disabled={packOpening || !auth?.steamId || !selectedPackId}
                  >
                    {packOpening ? 'Abrindo…' : `Rasgar pacote · ${selectedPack?.costTokens || 10} fichas`}
                  </TrackedButton>
                </div>

                <h4 className="fantasy-pack-pool-title">Pode sair neste pacote</h4>
                <div className="fantasy-pack-preview fantasy-pack-preview--cards">
                  {(selectedPack?.previewPlayers || []).map((pl) => {
                    const r = String(pl.rarity || 'common').toLowerCase();
                    const dist = packDistribution.length ? packDistribution : [{ rarity: 'common', chance: 0.6 }, { rarity: 'rare', chance: 0.25 }, { rarity: 'epic', chance: 0.1 }, { rarity: 'legendary', chance: 0.05 }];
                    const row = dist.find((d) => String(d.rarity).toLowerCase() === rarityToPackDistributionKey(pl.rarity));
                    const pct = row ? formatPackDropPercent(row.chance) : '—';
                    return (
                      <div key={pl.id} className="fantasy-pack-fifa-cell">
                        <FifaPlayerCard
                          player={{
                            id: pl.id,
                            name: pl.name,
                            team: pl.team || '—',
                            image: pl.image,
                            rating: pl.rating,
                            rarity: pl.rarity,
                            role: pl.role,
                            price: pl.price ?? 0,
                            weeklyStats: pl.weeklyStats || {
                              kills: pl.kills,
                              deaths: pl.deaths,
                              adr: pl.adr,
                              headshotPercentage: pl.headshotPercentage,
                              impact: pl.impact,
                              mapsPlayed: pl.mapsPlayed,
                            },
                          }}
                          owned
                          compact
                          noHover
                          showActions={false}
                          onOpenDetail={() => setDetailPlayer({
                            ...pl,
                            id: pl.id,
                            playerId: pl.id,
                            name: pl.name,
                            team: pl.team || '—',
                            image: pl.image,
                            rating: pl.rating,
                            rarity: pl.rarity,
                            role: pl.role,
                            price: pl.price ?? 0,
                            weeklyStats: pl.weeklyStats || {
                              kills: pl.kills,
                              deaths: pl.deaths,
                              adr: pl.adr,
                              headshotPercentage: pl.headshotPercentage,
                              impact: pl.impact,
                              mapsPlayed: pl.mapsPlayed,
                            },
                          })}
                        />
                        <span className="fantasy-pack-card-drop">Chance da raridade da carta: {pct}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="fantasy-pagination">
              <TrackedButton type="button" disabled={packPage <= 1} onClick={() => loadPacks(weekKey, packPage - 1)}>Anterior</TrackedButton>
              <TrackedButton type="button" disabled={packPage >= packPages} onClick={() => loadPacks(weekKey, packPage + 1)}>Próxima</TrackedButton>
            </div>
          </section>
        )}
            </Tabs.Content>

            <Tabs.Content value={TAB_CARDS} className="fantasy-tab-content">
        {!loading && (
          <section className="fantasy-section-grid cards">
            <article className="fantasy-panel">
              <h2>Meus Jogadores</h2>
              <div className="fantasy-market-toolbar">
                <select className="fantasy-select" value={cardRarityFilter} onChange={(e) => setCardRarityFilter(e.target.value)}>
                  <option value="">Raridade (todas)</option>
                  <option value="legendary">Lendário</option>
                  <option value="epic">Épico</option>
                  <option value="rare">Raro</option>
                  <option value="common">Comum</option>
                  <option value="bronze">Bronze</option>
                </select>
                <input
                  className="fantasy-input"
                  placeholder="Filtrar por time..."
                  value={cardTeamFilter}
                  onChange={(e) => setCardTeamFilter(e.target.value)}
                />
                <select className="fantasy-select" value={cardSort} onChange={(e) => setCardSort(e.target.value)}>
                  <option value="recent">Mais recentes</option>
                  <option value="rating">Rating</option>
                  <option value="rarity">Raridade</option>
                  <option value="name">Nome</option>
                </select>
              </div>
              <div className="fifa-grid fifa-grid--cards-list">
                {inventoryCards
                  .slice()
                  .filter((p) => !cardRarityFilter || String(p.rarity || '').toLowerCase() === cardRarityFilter)
                  .filter((p) => !cardTeamFilter || String(p.team || '').toLowerCase().includes(cardTeamFilter.toLowerCase()))
                  .sort((a, b) => {
                    if (cardSort === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
                    if (cardSort === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
                    if (cardSort === 'rarity') {
                      const order = { mythic: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1, bronze: 0 };
                      return Number(order[String(b.rarity || '').toLowerCase()] || 0) - Number(order[String(a.rarity || '').toLowerCase()] || 0);
                    }
                    return new Date(b.acquiredAt || b.createdAt || 0).getTime() - new Date(a.acquiredAt || a.createdAt || 0).getTime();
                  })
                  .map((player) => (
                    <div key={player.playerId || player.id} className="fantasy-owned-card-wrap">
                    <FifaPlayerCard
                      key={player.playerId || player.id}
                      player={player}
                      selected={team.includes(String(player.playerId || player.id))}
                      isBench={benchId === String(player.playerId || player.id)}
                      isCoach={coachId === String(player.playerId || player.id)}
                      owned
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/player-id', String(player.playerId || player.id))}
                      onAddStarter={() => addStarter(player.playerId || player.id)}
                      onSetBench={() => {
                        const id = String(player.playerId || player.id);
                        if (roleForPlayerId(id) === 'coach') {
                          setError('Cartas Técnico não vão no bench.');
                          return;
                        }
                        setBenchId((prev) => (prev === id ? '' : id));
                        if (coachId === id) setCoachId('');
                      }}
                      onSetCoach={() => {
                        const id = String(player.playerId || player.id);
                        if (roleForPlayerId(id) !== 'coach') return;
                        setCoachId((prev) => (prev === id ? '' : id));
                        if (benchId === id) setBenchId('');
                      }}
                      onOpenDetail={() => setDetailPlayer({
                        ...player,
                        id: player.playerId || player.id,
                        playerId: player.playerId || player.id,
                      })}
                      compact
                      noHover
                    />
                    </div>
                  ))}
              </div>
            </article>
          </section>
        )}
            </Tabs.Content>

            <Tabs.Content value={TAB_TEAM} className="fantasy-tab-content">
        {!loading && (
          <section className="fantasy-team-layout">
            <article className="fantasy-panel fantasy-lineup-panel">
              <div className="fantasy-panel-head">
                <h2>Meu Time</h2>
                <span>{totalCost.toFixed(1)} / {BUDGET_MAX}</span>
              </div>
              <p className="fantasy-team-hint">
                Cada slot do campo aceita só a posição da carta: Capitão (2x pontos), Support, Entry, Lurk e Âncora. Abaixo: bench (reserva) e técnico — o slot Técnico só aceita cartas com posição Técnico.
              </p>

              <div className="fantasy-pitch-board-wrap">
                <div className="fantasy-pitch-board">
                  {PITCH_SLOTS.map((slot, idx) => {
                    const pid = team[idx];
                    const p = pid ? byId.get(pid) : null;
                    return (
                      <div
                        key={slot.key}
                        className={`${slot.className} ${p ? 'filled' : 'empty'}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDropStarter(idx, e)}
                      >
                        {renderPitchCard(p, idx)}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="fantasy-bench-wrap">
                <div className="fantasy-bench-label">Bench</div>
                <div className={`fantasy-slot bench fantasy-bench-slot ${bench ? '' : 'empty'}`} onDragOver={(e) => e.preventDefault()} onDrop={onDropBench}>
                  {bench ? (
                    <>
                      <img src={bench.image} alt="" />
                      <div>
                        <strong>{bench.name}</strong>
                        <small>{bench.team}</small>
                      </div>
                      <TrackedButton type="button" className="remove" onClick={() => setBenchId('')}>×</TrackedButton>
                    </>
                  ) : <span>Arraste uma carta da coleção</span>}
                </div>
              </div>

              <div className="fantasy-coach-wrap">
                <div className="fantasy-coach-label">Técnico</div>
                <div className={`fantasy-slot coach fantasy-coach-slot ${coach ? '' : 'empty'}`} onDragOver={(e) => e.preventDefault()} onDrop={onDropCoach}>
                  {coach ? (
                    <>
                      <img src={coach.image} alt="" />
                      <div>
                        <strong>{coach.name}</strong>
                        <small>{coach.team}</small>
                      </div>
                      <TrackedButton type="button" className="remove" onClick={() => setCoachId('')}>×</TrackedButton>
                    </>
                  ) : <span>Somente posição Técnico</span>}
                </div>
              </div>

              <div className="fantasy-pack-row">
                <TrackedButton type="button" className="fantasy-primary-btn" onClick={() => setTab(TAB_PACKS)} disabled={!auth?.steamId}>
                  Ir para Packs
                </TrackedButton>
                {!auth?.steamId && <span className="fantasy-hint">Login Steam necessário para pacotes.</span>}
              </div>

              <TrackedButton
                type="button"
                className="fantasy-primary-btn fantasy-save-wide"
                onClick={onSaveTeam}
                disabled={saving || team.filter(Boolean).length !== 5 || !team[0] || totalCost > BUDGET_MAX}
              >
                {saving ? 'Salvando...' : 'Salvar Time'}
              </TrackedButton>

              <div className="fantasy-leagues-box">
                <h3>Ligas Privadas</h3>
                <div className="fantasy-league-actions">
                  <input value={leagueName} onChange={(e) => setLeagueName(e.target.value)} placeholder="Nome da liga" />
                  <TrackedButton type="button" onClick={onCreateLeague}>Criar</TrackedButton>
                </div>
                <div className="fantasy-league-actions">
                  <input value={joinLeagueId} onChange={(e) => setJoinLeagueId(e.target.value)} placeholder="ID da liga" />
                  <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Código convite" />
                  <TrackedButton type="button" onClick={onJoinLeague}>Entrar</TrackedButton>
                </div>
              </div>
            </article>

            <article className="fantasy-panel fantasy-market-panel">
              <h2>Mercado</h2>
              <div className="fantasy-market-toolbar">
                <input
                  className="fantasy-input"
                  placeholder="Buscar jogador ou time..."
                  value={marketQ}
                  onChange={(e) => setMarketQ(e.target.value)}
                />
                <input
                  className="fantasy-input"
                  placeholder="Filtrar time"
                  value={marketTeam}
                  onChange={(e) => setMarketTeam(e.target.value)}
                />
                <label className="fantasy-owned-filter">
                  <input
                    type="checkbox"
                    checked={marketOwnedOnly}
                    onChange={(e) => setMarketOwnedOnly(e.target.checked)}
                  />
                  Somente cartas da minha conta
                </label>
                <select className="fantasy-select" value={marketRoleFilter} onChange={(e) => setMarketRoleFilter(e.target.value)}>
                  <option value="">Posição (todas)</option>
                  <option value="captain">Capitão</option>
                  <option value="support">Support</option>
                  <option value="entry">Entry</option>
                  <option value="lurk">Lurk</option>
                  <option value="anchor">Âncora</option>
                  <option value="coach">Técnico</option>
                </select>
                <select className="fantasy-select" value={marketSort} onChange={(e) => setMarketSort(e.target.value)}>
                  <option value="rating">Rating</option>
                  <option value="price">Preço</option>
                  <option value="name">Nome</option>
                  <option value="rarity">Raridade</option>
                </select>
              </div>
              <p className="fantasy-market-meta">
                {teamMarketSource.total} jogadores · página {teamMarketSource.page} / {teamMarketSource.pages}
                {marketOwnedOnly && <span className="fantasy-market-meta-hint"> (sua coleção)</span>}
              </p>
              <div className="fifa-grid">
                {teamMarketSource.list.map((player) => (
                  <FifaPlayerCard
                    key={player.id}
                    player={player}
                    selected={team.includes(String(player.id))}
                    isBench={benchId === String(player.id)}
                    isCoach={coachId === String(player.id)}
                    owned={inventoryIds.has(String(player.id))}
                    draggable={inventoryIds.has(String(player.id))}
                    showLockWhenMissing={!marketOwnedOnly}
                    onDragStart={(e) => e.dataTransfer.setData('text/player-id', String(player.id))}
                    onAddStarter={() => addStarter(player.id)}
                    onSetBench={() => {
                      const id = String(player.id);
                      if (!inventoryIds.has(id)) {
                        setError('Só pode usar jogadores da sua coleção no bench.');
                        return;
                      }
                      if (roleForPlayerId(id) === 'coach') {
                        setError('Cartas Técnico não vão no bench; use o slot Técnico.');
                        return;
                      }
                      setBenchId((prev) => (prev === id ? '' : id));
                      if (coachId === id) setCoachId('');
                    }}
                    onSetCoach={() => {
                      const id = String(player.id);
                      if (!inventoryIds.has(id)) {
                        setError('Só pode usar jogadores da sua coleção no técnico.');
                        return;
                      }
                      if (roleForPlayerId(id) !== 'coach') return;
                      setCoachId((prev) => (prev === id ? '' : id));
                      if (benchId === id) setBenchId('');
                    }}
                    onOpenDetail={() => setDetailPlayer(player)}
                    compact
                    noHover
                  />
                ))}
              </div>
              <div className="fantasy-pagination">
                <TrackedButton
                  type="button"
                  disabled={teamMarketSource.page <= 1}
                  onClick={() => {
                    if (teamMarketSource.mode === 'inventory') {
                      teamMarketSource.setPage((p) => Math.max(1, p - 1));
                    } else {
                      const p = marketPage - 1;
                      setMarketPage(p);
                      loadMarket(p, weekKey);
                    }
                  }}
                >
                  Anterior
                </TrackedButton>
                <TrackedButton
                  type="button"
                  disabled={teamMarketSource.page >= teamMarketSource.pages}
                  onClick={() => {
                    if (teamMarketSource.mode === 'inventory') {
                      teamMarketSource.setPage((p) => p + 1);
                    } else {
                      const p = marketPage + 1;
                      setMarketPage(p);
                      loadMarket(p, weekKey);
                    }
                  }}
                >
                  Próxima
                </TrackedButton>
              </div>
            </article>
          </section>
        )}
            </Tabs.Content>

            <Tabs.Content value={TAB_RANKING} className="fantasy-tab-content">
        {!loading && (
          <section className="fantasy-section-grid ranking">
            <article className="fantasy-panel fantasy-rank-panel">
              <h2>Ranking Semanal ({weekKey || '—'})</h2>
              <div className="fantasy-rank-list">
                {weeklyRanking.map((r) => (
                  <div key={`${r.userId}-${r.position}`} className="fantasy-rank-row">
                    <span className="fantasy-rank-pos">#{r.position}</span>
                    <span className="fantasy-rank-name">{r.displayName}</span>
                    <span className="fantasy-rank-pts">{r.weeklyLp ?? 0} LP</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="fantasy-panel fantasy-rank-panel">
              <h2>Ranking Global</h2>
              <div className="fantasy-rank-list">
                {globalRanking.map((r) => (
                  <div key={`${r.userId}-${r.position}`} className="fantasy-rank-row">
                    <span className="fantasy-rank-pos">#{r.position}</span>
                    <span className="fantasy-rank-name">{r.displayName}</span>
                    <span className="fantasy-rank-pts">{r.totalLp ?? 0} LP</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="fantasy-panel fantasy-rank-panel">
              <div className="fantasy-panel-head">
                <h2>Ranking da Liga</h2>
                <select value={leagueId} onChange={(e) => setLeagueId(e.target.value)}>
                  <option value="">Selecione uma liga</option>
                  {leagues.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="fantasy-rank-list">
                {leagueRanking.map((r) => (
                  <div key={`${r.userId}-${r.position}`} className="fantasy-rank-row">
                    <span className="fantasy-rank-pos">#{r.position}</span>
                    <span className="fantasy-rank-name">{r.displayName}</span>
                    <span className="fantasy-rank-pts">{r.weeklyLp ?? 0} / {r.totalLp ?? 0} LP</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
            </Tabs.Content>
          </Tabs.Root>
        </section>
      </main>

      {loading && !weekKey && (
        <div className="fantasy-boot-overlay" aria-hidden>
          <div className="fantasy-boot-card">
            <div className="logo-hex fantasy-boot-logo" />
            <div className="fantasy-boot-title">SNAPFANTASY</div>
            <div className="fantasy-boot-sub">Carregando mercado, cartas e pacotes...</div>
          </div>
        </div>
      )}

      {packOpeningFlow && (
        <div className="fantasy-modal-backdrop fantasy-modal-backdrop--site" role="dialog" aria-modal="true">
          <div className="pack-opening-modal pack-opening-modal--site">
            <div className="pack-opening-head">
              <h3>Pack {packOpeningFlow.teamName}</h3>
              <span className="fifa-rarity-badge fifa-rarity-badge--legendary">Opening</span>
            </div>
            <div className="pack-opening-stage">
              {packOpeningFlow.phase !== 'reveal' ? (
                <div className={`pack-tear-stage pack-tear-stage--${String(packOpeningFlow.glowRarity || 'rare').toLowerCase()}`}>
                  <div className="pack-tear-glow" aria-hidden />
                  <div className="pack-tear-half pack-tear-half--left">
                    <div className="fantasy-pack-art fantasy-pack-art--tear" aria-hidden>
                      <img src="/fantasy/pack-base.png" alt="" className="fantasy-pack-art__base" />
                      <div className="fantasy-pack-art__center">
                        <span className="fantasy-pack-art__center-bg" aria-hidden />
                        {packOpeningFlow?.teamImage ? (
                          <img src={packOpeningFlow.teamImage} alt="" className="fantasy-pack-art__logo" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="fantasy-pack-art__logo fantasy-pack-art__logo--fallback">?</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pack-tear-half pack-tear-half--right">
                    <div className="fantasy-pack-art fantasy-pack-art--tear" aria-hidden>
                      <img src="/fantasy/pack-base.png" alt="" className="fantasy-pack-art__base" />
                      <div className="fantasy-pack-art__center">
                        <span className="fantasy-pack-art__center-bg" aria-hidden />
                        {packOpeningFlow?.teamImage ? (
                          <img src={packOpeningFlow.teamImage} alt="" className="fantasy-pack-art__logo" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="fantasy-pack-art__logo fantasy-pack-art__logo--fallback">?</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pack-suspense">
                    <div>Rasgando pacote...</div>
                  </div>
                </div>
              ) : (
                <div className="pack-reveal-grid pack-reveal-grid--fifa">
                  {[0, 1].map((idx) => {
                    const card = packOpeningFlow.cards[idx];
                    const visible = packOpeningFlow.revealCount > idx && card;
                    if (!visible) return <div key={idx} className="pack-reveal-card locked">???</div>;
                    const pl = {
                      id: card.id || card.playerId,
                      name: card.name,
                      team: card.team || '—',
                      image: card.image,
                      rating: card.rating,
                      rarity: card.rarity,
                      role: card.role,
                      price: card.price ?? 0,
                      weeklyStats: card.weeklyStats || {},
                    };
                    return (
                      <div key={idx} className={`pack-reveal-fifa-wrap pack-reveal-fifa-wrap--${String(pl.rarity || 'common').toLowerCase()}`} style={{ animationDelay: `${idx * 0.08}s` }}>
                        <FifaPlayerCard
                          player={pl}
                          owned
                          compact
                          noHover
                          showActions={false}
                          onOpenDetail={() => setDetailPlayer({ ...pl, playerId: pl.id })}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {!packOpeningFlow.suspense && packOpeningFlow.revealCount >= 2 && (
              <div className="pack-reveal-footer">
                <TrackedButton type="button" className="fantasy-primary-btn" onClick={() => setPackOpeningFlow(null)}>Continuar</TrackedButton>
              </div>
            )}
          </div>
        </div>
      )}

      <FantasyTutorialModal
        open={tutorialOpen}
        step={tutorialStep}
        onStep={setTutorialStep}
        onClose={() => setTutorialOpen(false)}
        onFinish={finishTutorial}
      />

      <FantasyPlayerDetailModal player={detailPlayer} onClose={() => setDetailPlayer(null)} />
    </div>
  );
}
