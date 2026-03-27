/**
 * azureService.js
 * Busca informações da VM CS2 através do backend local.
 * As credenciais Azure ficam seguras no servidor — não expostas no frontend.
 */

import { getApiBaseUrl } from '../utils/apiBase';

export async function fetchServerInfo() {
  const res = await fetch(`${getApiBaseUrl()}/api/server-info`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ao contatar o backend: ${res.statusText}`);
  }

  return res.json();
}




