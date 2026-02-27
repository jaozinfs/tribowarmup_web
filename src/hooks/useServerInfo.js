/**
 * useServerInfo.js
 * Hook que busca o IP da VM Azure e monta a lista de servidores CS2.
 * Atualiza automaticamente a cada 60 segundos.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchServerInfo } from '../services/azureService';

const CS2_PORT  = parseInt(import.meta.env.VITE_CS2_PORT  || '27015');
const GOTV_PORT = parseInt(import.meta.env.VITE_GOTV_PORT || '27020');

function buildServers(ip) {
  if (!ip) return [];
  return [
    {
      id: 1,
      name: 'BR DEATHMATCH #1',
      ip,
      port: CS2_PORT,
      map: 'de_mirage',
      players: null,   // futuro: integrar GameDig ou similar
      maxPlayers: 16,
      ping: null,
      tags: ['DM', '128tick'],
    },
    {
      id: 2,
      name: 'BR DEATHMATCH GOTV',
      ip,
      port: GOTV_PORT,
      map: 'de_mirage',
      players: null,
      maxPlayers: 16,
      ping: null,
      tags: ['GOTV'],
    },
  ];
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

      const info = await fetchServerInfo();
      setVmInfo(info);
      setServers(buildServers(info.ip));
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || 'Erro ao buscar informações da VM');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000); // atualiza a cada 60s
    return () => clearInterval(interval);
  }, [load]);

  return { servers, vmInfo, loading, error, refresh: load, lastUpdate };
}
