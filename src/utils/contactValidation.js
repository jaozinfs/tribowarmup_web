/**
 * Validação de e-mail e telefone (Brasil) para o modal de dados cadastrais.
 * Mantida alinhada com backend/services/userService.js (updateMarketingContact).
 */

/**
 * @param {string} raw
 * @returns {{ ok: true, value: string } | { ok: false, message: string }}
 */
export function validateMarketingEmail(raw) {
  const em = String(raw ?? '').trim().toLowerCase();
  if (!em) return { ok: false, message: 'Informe seu e-mail.' };
  if (em.length > 320) return { ok: false, message: 'E-mail muito longo (máx. 320 caracteres).' };
  if (/\s/.test(em)) return { ok: false, message: 'E-mail não pode conter espaços.' };
  if (em.includes('..')) return { ok: false, message: 'E-mail inválido.' };

  const at = em.indexOf('@');
  if (at <= 0 || at !== em.lastIndexOf('@')) {
    return { ok: false, message: 'E-mail deve ter um único @.' };
  }

  const local = em.slice(0, at);
  const domain = em.slice(at + 1);

  if (local.length < 1 || local.length > 64) {
    return { ok: false, message: 'Parte antes do @ inválida.' };
  }
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { ok: false, message: 'E-mail inválido.' };
  }
  if (!/^[a-z0-9._%+-]+$/i.test(local)) {
    return { ok: false, message: 'E-mail contém caracteres inválidos.' };
  }

  if (!domain.includes('.')) {
    return { ok: false, message: 'Domínio do e-mail inválido (falta .com, .br, etc.).' };
  }
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return { ok: false, message: 'Domínio do e-mail inválido.' };
  }
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(domain)) {
    return { ok: false, message: 'Domínio do e-mail inválido.' };
  }

  const tld = domain.slice(domain.lastIndexOf('.') + 1);
  if (tld.length < 2 || tld.length > 63 || !/^[a-z]{2,63}$/i.test(tld)) {
    return { ok: false, message: 'Terminação do domínio inválida (ex.: .com, .com.br).' };
  }

  return { ok: true, value: em };
}

/**
 * Telefone BR: opcional +55; depois DDD (11–99) + 8 dígitos (fixo) ou 9 + 8 (celular).
 * @param {string} raw
 * @returns {{ ok: true, normalized: string } | { ok: false, message: string }}
 */
export function validateMarketingPhone(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return { ok: false, message: 'Informe seu telefone com DDD.' };

  let d = trimmed.replace(/\D/g, '');
  if (d.length === 0) {
    return { ok: false, message: 'Telefone deve conter números (DDD + número).' };
  }

  if (d.startsWith('55') && d.length >= 12) {
    d = d.slice(2);
  }

  if (d.length < 10 || d.length > 11) {
    return {
      ok: false,
      message:
        d.length < 10
          ? 'Telefone incompleto: use DDD + número (10 dígitos fixo ou 11 celular com 9).'
          : 'Telefone com dígitos a mais. Use apenas DDD + número.',
    };
  }

  const ddd = parseInt(d.slice(0, 2), 10);
  if (Number.isNaN(ddd) || ddd < 11 || ddd > 99) {
    return { ok: false, message: 'DDD inválido (use 11 a 99).' };
  }

  if (d.length === 11) {
    if (d[2] !== '9') {
      return {
        ok: false,
        message: 'Celular deve ter 11 dígitos: DDD + 9 + número (ex.: 11 98765-4321).',
      };
    }
    const firstOfNumber = d[3];
    if (firstOfNumber === '0' || firstOfNumber === '1') {
      return { ok: false, message: 'Número de celular inválido após o 9.' };
    }
  }

  if (d.length === 10) {
    const third = d[2];
    if (third === '9') {
      return {
        ok: false,
        message: 'Números com 9 na frente precisam de 11 dígitos (inclua o 9 do celular).',
      };
    }
    if (third === '0' || third === '1') {
      return { ok: false, message: 'Número de telefone fixo inválido.' };
    }
  }

  const normalized = `+55${d}`;
  return { ok: true, normalized };
}
