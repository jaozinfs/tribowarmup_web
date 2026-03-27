import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import '../index.css';
import { TrackedButton } from '../components/TrackedButton';

function formatVipRemaining(expiresAtIso) {
  if (!expiresAtIso) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const end = new Date(expiresAtIso).getTime();
  const now = Date.now();
  if (now >= end) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  let ms = end - now;
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  ms -= days * 24 * 60 * 60 * 1000;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  ms -= hours * 60 * 60 * 1000;
  const minutes = Math.floor(ms / (60 * 1000));
  ms -= minutes * 60 * 1000;
  const seconds = Math.floor(ms / 1000);
  return { days, hours, minutes, seconds, done: false };
}

function VipRedeemModal({ label, vipExpiresAt, onClose }) {
  const hasExpiry = vipExpiresAt != null && String(vipExpiresAt).length > 0;
  const [remaining, setRemaining] = useState(() => (hasExpiry ? formatVipRemaining(vipExpiresAt) : { done: true }));
  useEffect(() => {
    if (!hasExpiry) return;
    setRemaining(formatVipRemaining(vipExpiresAt));
    const t = setInterval(() => setRemaining(formatVipRemaining(vipExpiresAt)), 1000);
    return () => clearInterval(t);
  }, [vipExpiresAt, hasExpiry]);
  return (
    <div className="inventory-voucher-backdrop inventory-vip-modal-backdrop" onClick={onClose}>
      <div className="inventory-voucher-card inventory-vip-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-voucher-glow inventory-vip-modal-glow" aria-hidden />
        <div className="inventory-vip-modal-confetti" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="inventory-vip-confetti-piece" style={{ '--i': i, '--delay': `${(i % 6) * 0.08}s` }} />
          ))}
        </div>
        <div className="inventory-voucher-header inventory-vip-modal-header">
          <span className="inventory-vip-modal-icon" aria-hidden>👑</span>
          <h3 className="inventory-voucher-title inventory-vip-modal-title">VOCÊ VIROU VIP</h3>
          <p className="inventory-voucher-desc inventory-vip-modal-desc">{label}</p>
          <p className="inventory-vip-modal-explain">
            {hasExpiry
              ? 'Seu status VIP é temporário e vale apenas pelo período abaixo. Aproveite os benefícios enquanto durar!'
              : 'Seu status VIP foi ativado. Confira seu perfil para ver os benefícios.'}
          </p>
        </div>
        <div className="inventory-vip-countdown-wrap">
          <div className="inventory-vip-countdown-label">
            {hasExpiry ? 'Tempo restante de VIP' : 'Status'}
          </div>
          {!hasExpiry ? (
            <div className="inventory-vip-countdown-done inventory-vip-countdown-ok">VIP ativo</div>
          ) : remaining.done ? (
            <div className="inventory-vip-countdown-done">Expirado</div>
          ) : (
            <div className="inventory-vip-countdown" role="timer" aria-live="polite">
              <span className="inventory-vip-countdown-block"><span className="inventory-vip-countdown-n">{remaining.days}</span><span className="inventory-vip-countdown-u">d</span></span>
              <span className="inventory-vip-countdown-sep"> </span>
              <span className="inventory-vip-countdown-block"><span className="inventory-vip-countdown-n">{String(remaining.hours).padStart(2, '0')}</span><span className="inventory-vip-countdown-u">h</span></span>
              <span className="inventory-vip-countdown-sep"> </span>
              <span className="inventory-vip-countdown-block"><span className="inventory-vip-countdown-n">{String(remaining.minutes).padStart(2, '0')}</span><span className="inventory-vip-countdown-u">min</span></span>
              <span className="inventory-vip-countdown-sep"> </span>
              <span className="inventory-vip-countdown-block"><span className="inventory-vip-countdown-n">{String(remaining.seconds).padStart(2, '0')}</span><span className="inventory-vip-countdown-u">s</span></span>
            </div>
          )}
        </div>
        <div className="inventory-voucher-actions-footer">
          <TrackedButton type="button" className="pug-btn pug-btn-secondary" onClick={onClose}>FECHAR</TrackedButton>
        </div>
      </div>
    </div>
  );
}

function VoucherRedeemModal({ label, url, onClose }) {
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <div className="inventory-voucher-backdrop" onClick={onClose}>
      <div className="inventory-voucher-card" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-voucher-glow" aria-hidden />
        <div className="inventory-voucher-header">
          <span className="inventory-voucher-icon" aria-hidden>🎁</span>
          <h3 className="inventory-voucher-title">VOUCHER RESGATADO</h3>
          <p className="inventory-voucher-desc">{label}</p>
        </div>
        <div className="inventory-voucher-body">
          <label className="inventory-voucher-label">Link do voucher</label>
          <div className="inventory-voucher-input-wrap">
            <input
              type="text"
              className="inventory-voucher-input"
              readOnly
              value={url || ''}
              aria-label="Link do voucher"
            />
            <TrackedButton
              type="button"
              className={`inventory-voucher-copy-btn${copied ? ' inventory-voucher-copy-btn--ok' : ''}`}
              onClick={copyLink}
              aria-label="Copiar link do voucher"
            >
              {copied ? '✓' : '⧉'}
            </TrackedButton>
          </div>
          <div className="inventory-voucher-actions-row">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="pug-btn pug-btn-primary inventory-voucher-btn-ir"
            >
              IR
            </a>
          </div>
        </div>
        <div className="inventory-voucher-actions-footer">
          <TrackedButton
            type="button"
            className="pug-btn pug-btn-secondary"
            onClick={onClose}
          >
            FECHAR
          </TrackedButton>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const auth = useAuth();
  const profile = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all | active | redeemed | expired
  const [filterType, setFilterType] = useState('all'); // all | voucher | caixas
  const [pageIndex, setPageIndex] = useState(0); // 0-based
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeemedVoucher, setRedeemedVoucher] = useState(null);
  const [redeemedVip, setRedeemedVip] = useState(null);

  useEffect(() => {
    if (auth.loading || profile.loading) return;
    if (!auth.steamId) {
      navigate('/vip');
    }
  }, [auth.loading, auth.steamId, profile.loading, profile.profile, navigate]);

  useEffect(() => {
    if (auth.loading || profile.loading) return;
    if (!auth.steamId) return;

    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      pageIndex: String(pageIndex),
      pageSize: String(pageSize),
      status: filterStatus,
      type: filterType,
    });
    fetch(`/api/giveaway/inventory?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((json) => {
        const itemsArray = Array.isArray(json.items) ? json.items : [];
        setItems(itemsArray);
        setTotal(Number.isFinite(Number(json.total)) ? Number(json.total) : itemsArray.length);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.error || 'Erro ao carregar inventário.');
        setLoading(false);
      });
  }, [auth.loading, auth.steamId, profile.loading, pageIndex, filterStatus, filterType]);

  useEffect(() => {
    const openVoucher = location.state?.openVoucher;
    const openVipRedeem = location.state?.openVipRedeem;
    if (openVoucher && openVoucher.url != null) {
      setRedeemedVoucher({ label: openVoucher.label || '', url: openVoucher.url });
      navigate(location.pathname, { replace: true, state: {} });
    } else if (openVipRedeem) {
      setRedeemedVip({
        label: openVipRedeem.label || '',
        vipExpiresAt: openVipRedeem.vipExpiresAt != null ? openVipRedeem.vipExpiresAt : undefined,
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleRedeem = (item) => {
    const id = item.id;
    fetch(`/api/giveaway/inventory/${encodeURIComponent(id)}/redeem`, { method: 'POST', credentials: 'include' })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((json) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, redeemed: 1 } : it)));

        const backendItem = json?.item || {};
        const prizeType = backendItem.prize_type || item.prize_type;

        let meta = backendItem.metadata ?? item.metadata ?? null;
        if (meta) {
          if (typeof meta === 'string') {
            try {
              meta = JSON.parse(meta);
            } catch {
              meta = null;
            }
          }
        }

        const isVipDays = json.vip_days_redeemed === true || prizeType === 'vip_days' || item.prize_type === 'vip_days';
        if (isVipDays) {
          const expiresAt = json.vipExpiresAt != null ? String(json.vipExpiresAt) : null;
          setRedeemedVip({
            label: backendItem.label || item.label,
            vipExpiresAt: expiresAt || undefined,
          });
          if (profile?.refresh) profile.refresh();
        } else if (prizeType === 'voucher' && meta && (meta.voucherUrl || meta.url || meta.voucher_url)) {
          const url = meta.voucherUrl || meta.url || meta.voucher_url;
          setRedeemedVoucher({
            label: backendItem.label || item.label,
            url,
          });
        }
      })
      .catch((e) => {
        setError(e?.error || 'Erro ao resgatar item.');
      });
  };

  return (
    <div className="app">
      <div className="scanlines" />
      <div className="grid-bg" />
      <header className="header">
        <div className="header-left">
          <div className="logo-hex" />
          <div>
            <div className="header-title">INVENTÁRIO</div>
            <div className="header-sub">RECOMPENSAS</div>
          </div>
        </div>
        <HamburgerNav activePath="/inventory" auth={auth} profile={profile} returnTo="/inventory" />
      </header>
      <main className="inventory-main">
        {loading && (
          <div className="inventory-status">
            <div className="spinner" />
            <span>Carregando inventário...</span>
          </div>
        )}
        {!loading && error && (
          <div className="inventory-status inventory-status--error">
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && (
          <div>
            <section className="inventory-header">
              <h1 className="inventory-title">Seus itens da roleta</h1>
              <p className="inventory-desc">
                Aqui aparecem os itens que você ganhou na roleta VIP. Cada item expira em até 30 dias após o ganho.
              </p>
            </section>
            <section className="inventory-filters" aria-label="Filtros de inventário">
              <div className="inventory-filter-group">
                <label className="inventory-filter-label" htmlFor="inventory-status-filter">
                  STATUS
                </label>
                <select
                  id="inventory-status-filter"
                  className="inventory-filter-select"
                  value={filterStatus}
                  onChange={(e) => {
                    setPageIndex(0);
                    setFilterStatus(e.target.value);
                  }}
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="redeemed">Resgatados</option>
                  <option value="expired">Expirados</option>
                </select>
              </div>
              <div className="inventory-filter-group">
                <label className="inventory-filter-label" htmlFor="inventory-type-filter">
                  TIPO
                </label>
                <select
                  id="inventory-type-filter"
                  className="inventory-filter-select"
                  value={filterType}
                  onChange={(e) => {
                    setPageIndex(0);
                    setFilterType(e.target.value);
                  }}
                >
                  <option value="all">Todos</option>
                  <option value="voucher">Voucher</option>
                  <option value="caixas">Caixas</option>
                </select>
              </div>
            </section>

            {(() => {
              const now = new Date();
              const enhanced = items.map((item) => {
                const redeemed = Boolean(item.redeemed);
                const expired = item.expires_at && new Date(item.expires_at) < now;
                const statusLabel = redeemed ? 'Resgatado' : expired ? 'Expirado' : 'Ativo';
                return { ...item, _redeemed: redeemed, _expired: expired, _statusLabel: statusLabel };
              });
              const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
              const currentPage = Math.min(pageIndex + 1, totalPages);

              return (
                <>
                  <section className="inventory-list">
                    {enhanced.length === 0 && (
                      <div className="inventory-empty">
                        <p>Nenhum item encontrado com os filtros atuais.</p>
                      </div>
                    )}
                    {enhanced.length > 0 &&
                      enhanced.map((item) => {
                        const expires = item.expires_at ? new Date(item.expires_at).toLocaleDateString('pt-BR') : '';
                        const acquired = item.acquired_at
                          ? new Date(item.acquired_at).toLocaleDateString('pt-BR')
                          : '';
                        const redeemed = item._redeemed;
                        const expired = item._expired;
                        const statusLabel = item._statusLabel;
                        const thumbStyle = item.image_url
                          ? {
                              backgroundImage: `url(${item.image_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                          : {};
                        return (
                          <article key={item.id} className="inventory-item">
                            <div className="inventory-item-left">
                              <div
                                className={`inventory-thumb inventory-thumb--${item.prize_type}`}
                                style={thumbStyle}
                              />
                              <div className="inventory-text">
                                <h2 className="inventory-item-title">{item.label}</h2>
                                <p className="inventory-item-meta">
                                  Ganhou em <span className="inventory-item-meta-strong">{acquired}</span>
                                  {expires && (
                                    <>
                                      {' '}
                                      · Expira em{' '}
                                      <span className="inventory-item-meta-strong inventory-item-meta-expire">
                                        {expires}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="inventory-item-right">
                              <span
                                className={`inventory-badge inventory-badge--${statusLabel.toLowerCase()}`}
                              >
                                {statusLabel}
                              </span>
                              <TrackedButton
                                type="button"
                                className="pug-btn pug-btn-secondary inventory-redeem-btn"
                                disabled={redeemed || expired}
                                onClick={() => handleRedeem(item)}
                              >
                                {redeemed ? 'Resgatado' : expired ? 'Expirado' : 'Resgatar'}
                              </TrackedButton>
                            </div>
                          </article>
                        );
                      })}
                  </section>
                  {total > pageSize && (
                    <nav className="inventory-pagination" aria-label="Paginação do inventário">
                      <TrackedButton
                        type="button"
                        className="inventory-page-btn"
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        disabled={pageIndex === 0}
                      >
                        Anterior
                      </TrackedButton>
                      <span className="inventory-page-info">
                        Página {currentPage} de {totalPages}
                      </span>
                      <TrackedButton
                        type="button"
                        className="inventory-page-btn"
                        onClick={() =>
                          setPageIndex((p) => (p + 1 >= totalPages ? p : p + 1))
                        }
                        disabled={pageIndex + 1 >= totalPages}
                      >
                        Próxima
                      </TrackedButton>
                    </nav>
                  )}
                </>
              );
            })()}
            {redeemedVoucher && (
              <VoucherRedeemModal
                label={redeemedVoucher.label}
                url={redeemedVoucher.url}
                onClose={() => setRedeemedVoucher(null)}
              />
            )}
            {redeemedVip && (
              <VipRedeemModal
                label={redeemedVip.label}
                vipExpiresAt={redeemedVip.vipExpiresAt}
                onClose={() => setRedeemedVip(null)}
              />
            )}
          </div>
        )}
      </main>
      <style>{`
        .inventory-main {
          flex: 1;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          position: relative;
          z-index: 10;
        }
        .inventory-header {
          width: 100%;
          max-width: 560px;
          margin: 0 auto 24px;
          text-align: left;
        }
        .inventory-title {
          margin: 0 0 8px;
          font-family: var(--font-head);
          font-size: 22px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #e5e7eb;
        }
        .inventory-desc {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-dim);
        }
        .inventory-list {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .inventory-filters {
          width: 100%;
          max-width: 560px;
          margin: 0 auto 16px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .inventory-filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 140px;
        }
        .inventory-filter-label {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 2px;
          color: var(--text-mute);
        }
        .inventory-filter-select {
          background: rgba(15,23,42,0.9);
          border-radius: 6px;
          border: 1px solid rgba(148,163,184,0.6);
          color: #e5e7eb;
          padding: 6px 10px;
          font-size: 13px;
        }
        .inventory-empty {
          background: linear-gradient(135deg, #10121a 0%, #151820 100%);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgba(148,163,184,0.35);
          text-align: center;
          color: var(--text-dim);
        }
        .inventory-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 22px;
          border-radius: 12px;
          background: linear-gradient(135deg, #10121a 0%, #151820 100%);
          border: 1px solid rgba(148,163,184,0.35);
          box-shadow: 0 4px 18px rgba(0,0,0,0.4);
        }
        .inventory-item-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .inventory-thumb {
          width: 64px;
          height: 64px;
          border-radius: 10px;
          background: radial-gradient(circle at 30% 20%, #facc15, #ea580c);
          box-shadow: 0 0 16px rgba(250,204,21,0.6);
        }
        .inventory-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .inventory-item-title {
          margin: 0;
          font-family: var(--font-head);
          font-size: 1.05rem;
          color: #f9fafb;
        }
        .inventory-item-meta {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(156,163,175,0.95);
        }
        .inventory-item-meta-strong {
          color: #e5e7eb;
          font-weight: 500;
        }
        .inventory-item-meta-expire {
          color: #fbbf24;
        }
        .inventory-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        .inventory-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--font-mono);
        }
        .inventory-badge--ativo {
          background: rgba(34,197,94,0.15);
          color: #4ade80;
          border: 1px solid rgba(34,197,94,0.6);
        }
        .inventory-badge--resgatado {
          background: rgba(59,130,246,0.15);
          color: #93c5fd;
          border: 1px solid rgba(59,130,246,0.6);
        }
        .inventory-badge--expirado {
          background: rgba(248,113,113,0.15);
          color: #fecaca;
          border: 1px solid rgba(248,113,113,0.6);
        }
        .inventory-status {
          width: 100%;
          max-width: 480px;
          margin: 40px auto 0;
          padding: 24px;
          text-align: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #10121a 0%, #151820 100%);
          border: 1px solid rgba(148,163,184,0.35);
          color: var(--text-dim);
        }
        .inventory-status--error {
          border-color: rgba(248,113,113,0.6);
          color: #fecaca;
        }
        .inventory-pagination {
          width: 100%;
          max-width: 560px;
          margin: 16px auto 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.85rem;
          color: var(--text-dim);
        }
        .inventory-page-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--border2, rgba(148,163,184,0.4));
          background: rgba(15,23,42,0.9);
          color: #e5e7eb;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .inventory-page-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .inventory-page-info {
          flex: 1;
          text-align: center;
        }
        .inventory-voucher-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .inventory-voucher-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: linear-gradient(180deg, rgba(18, 22, 35, 0.98) 0%, rgba(12, 16, 28, 0.99) 100%);
          border: 1px solid rgba(245, 166, 35, 0.2);
          border-radius: 16px;
          padding: 32px 28px;
          box-shadow: 0 0 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
          overflow: hidden;
        }
        .inventory-voucher-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 120px;
          background: radial-gradient(ellipse, rgba(245, 166, 35, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .inventory-voucher-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .inventory-voucher-icon {
          display: block;
          font-size: 40px;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 12px rgba(245, 166, 35, 0.3));
        }
        .inventory-voucher-title {
          font-family: var(--font-head);
          font-size: 1.35rem;
          letter-spacing: 4px;
          color: #fff;
          margin: 0 0 8px;
        }
        .inventory-voucher-desc {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }
        .inventory-voucher-body {
          margin-bottom: 24px;
        }
        .inventory-voucher-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .inventory-voucher-label {
          display: block;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
        }
        .inventory-voucher-input {
          flex: 1;
          width: 100%;
          padding: 12px 48px 12px 14px;
          margin: 0;
          font-size: 0.85rem;
          color: #e5e7eb;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-sizing: border-box;
        }
        .inventory-voucher-copy-btn {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.8);
          background: rgba(15,23,42,0.95);
          color: #e5e7eb;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .inventory-voucher-copy-btn--ok {
          border-color: rgba(34,197,94,0.8);
          background: rgba(22,163,74,0.9);
          color: #ecfdf5;
          box-shadow: 0 0 12px rgba(34,197,94,0.8);
        }
        .inventory-voucher-actions-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .inventory-voucher-btn-ir {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .inventory-voucher-actions-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .inventory-voucher-actions-footer .pug-btn {
          width: 100%;
        }
        .inventory-vip-modal-backdrop {
          animation: inventory-vip-fadeIn 0.4s ease-out;
        }
        .inventory-vip-modal-card {
          position: relative;
          overflow: hidden;
          animation: inventory-vip-scaleIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .inventory-vip-modal-glow {
          background: radial-gradient(ellipse, rgba(250, 204, 21, 0.25) 0%, transparent 70%);
        }
        .inventory-vip-modal-confetti {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .inventory-vip-confetti-piece {
          position: absolute;
          width: 8px;
          height: 8px;
          left: calc(10% + (var(--i) % 5) * 20%);
          top: -10px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 2px;
          opacity: 0;
          animation: inventory-vip-confetti-fall 1.2s ease-out var(--delay) forwards;
        }
        @keyframes inventory-vip-confetti-fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0.6; transform: translateY(120px) rotate(360deg); }
        }
        @keyframes inventory-vip-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes inventory-vip-scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        .inventory-vip-modal-header {
          margin-bottom: 16px;
        }
        .inventory-vip-modal-icon {
          display: block;
          font-size: 48px;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 16px rgba(250, 204, 21, 0.5));
          animation: inventory-vip-icon-pulse 1.5s ease-in-out infinite;
        }
        @keyframes inventory-vip-icon-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 16px rgba(250, 204, 21, 0.5)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 24px rgba(250, 204, 21, 0.8)); }
        }
        .inventory-vip-modal-title {
          color: #fef3c7;
          text-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
        }
        .inventory-vip-modal-desc {
          margin-bottom: 8px;
        }
        .inventory-vip-modal-explain {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
          line-height: 1.45;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
        }
        .inventory-vip-countdown-wrap {
          margin: 20px 0 24px;
          padding: 20px 16px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 12px;
          border: 1px solid rgba(250, 204, 21, 0.25);
        }
        .inventory-vip-countdown-label {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .inventory-vip-countdown {
          display: flex;
          align-items: baseline;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px 8px;
        }
        .inventory-vip-countdown-block {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          min-width: 2.5em;
        }
        .inventory-vip-countdown-n {
          font-family: var(--font-mono);
          font-size: 1.75rem;
          font-weight: 700;
          color: #fef3c7;
          text-shadow: 0 0 12px rgba(250, 204, 21, 0.5);
          line-height: 1.2;
        }
        .inventory-vip-countdown-u {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }
        .inventory-vip-countdown-sep {
          color: rgba(255, 255, 255, 0.3);
          font-size: 1.2rem;
        }
        .inventory-vip-countdown-done {
          font-size: 1rem;
          color: rgba(248, 113, 113, 0.9);
          text-align: center;
        }
        .inventory-vip-countdown-ok {
          color: rgba(74, 222, 128, 0.95);
        }
        @media (max-width: 600px) {
          .inventory-main {
            padding: 24px 16px;
          }
          .inventory-filters {
            flex-direction: column;
            align-items: stretch;
          }
          .inventory-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .inventory-item-right {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

