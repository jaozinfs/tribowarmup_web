/**
 * useServerInfo.js
 * Lista de servidores dinâmica: o backend guarda quem reportou (ip:port) e o frontend monta a lista a partir disso.
 * Também busca dados da VM Azure para o header (vmInfo). Polling a cada 10s para refletir servidores que caíram (docker down) ou subiram.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchServerInfo } from '../services/azureService';
import { fetchServerStatus } from '../services/serverStatusService';

function buildServersFromStatus(status, vmInfo) {
  if (!status || typeof status !== 'object') return [];
  const fallbackIp = vmInfo?.ip ?? '';
  return Object.entries(status)
    .filter(([, data]) => data && (data.port != null && data.port > 0))
    .map(([key, data]) => {
      const port = Number(data.port);
      const ip = (data.ip != null && String(data.ip).trim() !== '') ? String(data.ip).trim() : fallbackIp;
      if (!ip) return null;
      const map = data.map ?? '—';
      const gameMode = data.gameMode ?? null;
      const displayName = data.displayName;
      const name = displayName || (gameMode && map
        ? `${gameMode} — ${map}`
        : map !== '—'
          ? map
          : `${ip}:${port}`);
      const tags = [];
      const isWarmup = gameMode === 'WARMUP';
      if (gameMode) tags.push(gameMode);
      if (data.hasPassword) tags.push('LOBBY PRIVADA');
      if (port === 27020) tags.push('GOTV');
      else tags.push(isWarmup ? 'WARMUP VIP' : 'DM');
      return {
        id: key,
        name,
        ip,
        port,
        map,
        gameMode,
        hasPassword: Boolean(data.hasPassword),
        players: typeof data.playerCount === 'number' ? data.playerCount : null,
        maxPlayers: 16,
        ping: null,
        tags: tags.length ? tags : ['CS2'],
        top3: Array.isArray(data.top3) ? data.top3 : [],
      };
    })
    .filter(Boolean);
}

export function useServerInfo() {
  const [servers, setServers]   = useState([]);
  const [vmInfo, setVmInfo]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [info, status] = await Promise.all([
        fetchServerInfo().catch(() => null),
        fetchServerStatus().catch(() => ({})),
      ]);
      setVmInfo(info ?? null);
      setServers(buildServersFromStatus(status, info ?? null));
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000); // 10s: servidor que caiu some em até ~50s (backend TTL) + 10s
    return () => clearInterval(interval);
  }, [load]);

  return { servers, vmInfo, loading, error, refresh: load, lastUpdate };
}
