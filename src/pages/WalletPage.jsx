import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HamburgerNav } from '../components/HamburgerNav';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { fetchWallet, importSteamWallet, refreshWallet } from '../services/walletService';
import { TrackedButton } from '../components/TrackedButton';
import './WalletPage.css';

function brl(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
}
function usd(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));
}
function signedBrl(n) {
  const v = Number(n || 0);
  const sign = v >= 0 ? '+ ' : '- ';
  return `${sign}${brl(Math.abs(v))}`;
}
function signedPct(n) {
  const v = Number(n || 0);
  const sign = v >= 0 ? '+' : '-';
  return `${sign}${Math.abs(v).toFixed(2)}%`;
}

export default function WalletPage() {
  const auth = useAuth();
  const profile = useProfile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [selected, setSelected] = useState(null);

  const load = async (refresh = false) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const d = refresh ? await refreshWallet() : await fetchWallet();
      setData(d);
    } catch (e) {
      setError(e.message || 'Falha ao carregar carteira');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSteam = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const d = await importSteamWallet();
      setData(d);
      setMessage(`Importado da Steam: ${d?.imported?.uniqueSkins || 0} skins únicas (${d?.imported?.assetsScanned || 0} itens lidos)`);
    } catch (e) {
      setError(e.message || 'Falha ao importar Steam');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(false); }, []);

  const toggleCategory = (cat) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const categorySummary = (skins) => {
    const arr = Array.isArray(skins) ? skins : [];
    const invested = arr.reduce((a, s) => a + (Number(s.purchasePriceBrl || 0) * Number(s.quantity || 1)), 0);
    const current = arr.reduce((a, s) => a + (Number(s.currentPriceBrl || 0) * Number(s.quantity || 1)), 0);
    const profit = current - invested;
    const pct = invested > 0 ? (profit / invested) * 100 : 0;
    return { invested, current, profit, pct };
  };

  const wearClass = (wearName) => {
    const w = String(wearName || '').toLowerCase();
    if (w.includes('factory new')) return 'wallet-wear--fn';
    if (w.includes('minimal wear')) return 'wallet-wear--mw';
    if (w.includes('field-tested')) return 'wallet-wear--ft';
    if (w.includes('well-worn')) return 'wallet-wear--ww';
    if (w.includes('battle-scarred')) return 'wallet-wear--bs';
    return 'wallet-wear--na';
  };

  const renderNameWithWear = (skinName, wearName) => {
    const name = String(skinName || '');
    if (!wearName) return <>{name}</>;
    const token = `(${wearName})`;
    if (!name.includes(token)) return <>{name} <span className={wearClass(wearName)}>{wearName}</span></>;
    const [left] = name.split(token);
    return <>{left}<span className={wearClass(wearName)}>{token}</span></>;
  };

  return (
    <div className="app wallet-page">
      <header className="header home-header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">SnapTap.com.br</div>
            <div className="header-sub">CARTEIRA DE SKINS</div>
          </div>
        </div>
        <HamburgerNav activePath="/wallet" auth={auth} profile={profile} returnTo="/wallet" />
      </header>

      <main className="wallet-main">
        <section className="wallet-header-card">
          <h1>Carteira</h1>
          <div className="wallet-actions">
            <TrackedButton type="button" className="wallet-btn" onClick={() => load(true)} disabled={loading}>Atualizar preços</TrackedButton>
            <TrackedButton type="button" className="wallet-btn" onClick={handleImportSteam} disabled={loading}>Importar da Steam</TrackedButton>
            {loading ? <span>Atualizando...</span> : null}
            {error ? <span className="wallet-error">{error}</span> : null}
            {message ? <span>{message}</span> : null}
          </div>
          <div className="wallet-grid">
            <div className="wallet-stat"><span>Total investido</span><strong>{brl(data?.totals?.totalInvestedBrl || 0)}</strong></div>
            <div className="wallet-stat"><span>Valor atual</span><strong>{brl(data?.totals?.totalCurrentBrl || 0)}</strong></div>
            <div className="wallet-stat"><span>Lucro / Prejuízo</span><strong className={(Number(data?.totals?.profitBrl || 0) >= 0) ? 'wallet-profit--up' : 'wallet-profit--down'}>{signedBrl(data?.totals?.profitBrl || 0)}</strong></div>
            <div className="wallet-stat"><span>Resultado %</span><strong className={(Number(data?.totals?.profitPct || 0) >= 0) ? 'wallet-profit--up' : 'wallet-profit--down'}>{signedPct(data?.totals?.profitPct || 0)}</strong></div>
          </div>
          <div className="wallet-insights">
            {data?.insights?.bestInvestment ? <span className="wallet-pill">Melhor: {data.insights.bestInvestment.skinName} ({Number(data.insights.bestInvestment.pctChange).toFixed(2)}%)</span> : null}
            {data?.insights?.worstInvestment ? <span className="wallet-pill">Pior: {data.insights.worstInvestment.skinName} ({Number(data.insights.worstInvestment.pctChange).toFixed(2)}%)</span> : null}
          </div>
        </section>

        <section className="wallet-categories">
          {Object.entries(data?.categories || {}).map(([cat, skins]) => (
            <article key={cat} className="wallet-category">
              <div className="wallet-category-head">
                <div className="wallet-category-left">
                  <h2 className="wallet-category-title">{cat}</h2>
                </div>
                <div className="wallet-category-right">
                  <div className="wallet-category-summary wallet-category-summary--strong">
                    {(() => {
                      const s = categorySummary(skins);
                      return (
                        <>
                          <span>Total: <strong>{brl(s.current)}</strong></span>
                          <span className={s.profit >= 0 ? 'wallet-profit--up' : 'wallet-profit--down'}>
                            {s.profit >= 0 ? '+' : ''}{brl(s.profit)} ({s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%)
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <TrackedButton
                    type="button"
                    className="wallet-category-toggle wallet-category-toggle--arrow"
                    onClick={() => toggleCategory(cat)}
                    aria-label={collapsed[cat] ? `Expandir ${cat}` : `Recolher ${cat}`}
                  >
                    <span className={`wallet-chevron ${collapsed[cat] ? '' : 'wallet-chevron--open'}`}>▾</span>
                  </TrackedButton>
                </div>
              </div>
              {!collapsed[cat] && <div className="wallet-skins-grid">
                {(skins || []).map((s) => (
                  <div key={s.id} className="wallet-skin-card" role="button" tabIndex={0} onClick={() => setSelected(s)} onKeyDown={(e) => { if (e.key === 'Enter') setSelected(s); }}>
                    {s.imageUrl ? <img src={s.imageUrl} alt={s.skinName} className="wallet-skin-img" loading="lazy" /> : <div className="wallet-skin-img" />}
                    <div className="wallet-skin-body">
                      <div className="wallet-skin-name">{renderNameWithWear(s.skinName, s.wearName)} {s.isStattrak ? <span className="wallet-stattrak">StatTrak</span> : null}</div>
                      <div className="wallet-skin-meta">Float: {s.floatValue != null ? Number(s.floatValue).toFixed(4) : '—'} · Seed: {s.paintSeed ?? '—'}</div>
                      <div className="wallet-skin-meta">Compra: {s.acquiredAt ? new Date(s.acquiredAt).toLocaleDateString('pt-BR') : '—'}</div>
                      <div className="wallet-skin-meta">Qtd: {Number(s.quantity || 1)}</div>
                      <div className="wallet-skin-prices">
                        <span>Compra: {usd(s.purchasePriceUsd)} · {brl(s.purchasePriceBrl)}</span>
                        <span>Atual: {usd(s.currentPriceUsd)} · {brl(s.currentPriceBrl)}</span>
                      </div>
                      <div className={`wallet-skin-change ${Number(s.pctChange || 0) >= 0 ? 'wallet-profit--up' : 'wallet-profit--down'}`}>
                        {Number(s.pctChange || 0) >= 0 ? '+' : ''}{Number(s.pctChange || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>}
            </article>
          ))}
        </section>
      </main>
      {selected ? (
        <div className="wallet-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-head">
              <h3>{selected.skinName}</h3>
              <TrackedButton type="button" className="wallet-category-toggle" onClick={() => setSelected(null)}>Fechar</TrackedButton>
            </div>
            <div className="wallet-modal-grid">
              {selected.imageUrl ? <img src={selected.imageUrl} alt={selected.skinName} className="wallet-modal-img" /> : <div className="wallet-modal-img" />}
              <div className="wallet-modal-body">
                <div className="wallet-modal-line"><span>Categoria</span><strong>{selected.weaponCategory || '—'}</strong></div>
                <div className="wallet-modal-line"><span>Tipo</span><strong>{selected.itemType || '—'}</strong></div>
                <div className={`wallet-modal-line ${wearClass(selected.wearName)}`}><span>Desgaste</span><strong>{selected.wearName || 'N/A'}</strong></div>
                <div className="wallet-modal-line"><span>Float</span><strong>{selected.floatValue != null ? Number(selected.floatValue).toFixed(6) : '—'}</strong></div>
                <div className="wallet-modal-line"><span>Paint Seed</span><strong>{selected.paintSeed ?? '—'}</strong></div>
                <div className="wallet-modal-line"><span>Atributo</span><strong className={selected.isStattrak ? 'wallet-stattrak' : ''}>{selected.isStattrak ? 'StatTrak' : 'Padrão'}</strong></div>
                <div className="wallet-modal-line"><span>Compra</span><strong>{usd(selected.purchasePriceUsd)} · {brl(selected.purchasePriceBrl)}</strong></div>
                <div className="wallet-modal-line"><span>Atual</span><strong>{usd(selected.currentPriceUsd)} · {brl(selected.currentPriceBrl)}</strong></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
