import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminToken } from '../../services/adminWheelApi';
import { TrackedButton } from '../../components/TrackedButton';
import {
  fetchGiveawayItems,
  createGiveawayItem,
  updateGiveawayItem,
  deleteGiveawayItem,
} from '../../services/adminGiveawayApi';
import AdminTabs from '../../components/admin/AdminTabs';
import '../../index.css';

const emptyForm = {
  id: null,
  prize_key: '',
  label: '',
  prize_type: '',
  image_url: '',
  imageFile: null,
  weight: 1,
  active: true,
};

export default function GiveawayItemsAdmin() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showInactive, setShowInactive] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [vipDays, setVipDays] = useState('');
  const [voucherUrl, setVoucherUrl] = useState('');

  useEffect(() => {
    const t = getAdminToken();
    if (!t) return;
    verifyAdminToken()
      .then(() => setAuthorized(true))
      .catch(() => {
        setAdminToken(null);
        setAuthorized(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const loadItems = async () => {
    if (!authorized) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGiveawayItems(showInactive ? {} : { active: true });
      setItems(data || []);
    } catch (e) {
      setError(e?.message || 'Erro ao carregar prêmios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [authorized, showInactive]);

  const handleSubmitToken = (e) => {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    setError(null);
    setAdminToken(t);
    setTokenInput('');
    verifyAdminToken()
      .then(() => {
        setAuthorized(true);
        setError(null);
      })
      .catch((err) => {
        setAdminToken(null);
        setAuthorized(false);
        setError(err?.message || 'Token inválido. Tente novamente.');
      });
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAuthorized(false);
    setItems([]);
    setForm(emptyForm);
  };

  const handleEdit = (item) => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setFileInputKey((k) => k + 1);
    setForm({
      id: item.id,
      prize_key: item.prize_key,
      label: item.label,
      prize_type: item.prize_type,
      image_url: item.image_url || '',
      imageFile: null,
      weight: item.weight ?? 1,
      active: !!item.active,
    });
    if (item.metadata && typeof item.metadata === 'object') {
      const days = item.metadata.vipDays || item.metadata.days;
      setVipDays(days != null ? String(days) : '');
      const vu = item.metadata.voucherUrl || item.metadata.url;
      setVoucherUrl(vu != null ? String(vu) : '');
    } else {
      setVipDays('');
      setVoucherUrl('');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remover prêmio "${item.label}"? Ele será apenas desativado (active=0).`)) return;
    try {
      await deleteGiveawayItem(item.id);
      await loadItems();
    } catch (e) {
      setError(e?.message || 'Erro ao remover prêmio.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (!form.prize_key || !form.label || !form.prize_type) {
        setError('prize_key, label e prize_type são obrigatórios.');
        return;
      }
      const body = new FormData();
      body.append('prize_key', form.prize_key);
      body.append('label', form.label);
      body.append('prize_type', form.prize_type);
      body.append('weight', String(form.weight || 1));
      body.append('active', form.active ? '1' : '0');
      if (form.prize_type === 'vip_days' && vipDays) {
        body.append('vip_days', vipDays);
      }
      if (form.prize_type === 'voucher' && voucherUrl) {
        body.append('voucher_url', voucherUrl);
      }
      if (form.imageFile) {
        body.append('image', form.imageFile);
      }

      if (form.id) {
        await updateGiveawayItem(form.id, body);
      } else {
        await createGiveawayItem(body);
      }
      setForm(emptyForm);
      setVipDays('');
      setVoucherUrl('');
      await loadItems();
    } catch (e) {
      setError(e?.message || 'Erro ao salvar prêmio.');
    }
  };

  const handleFormReset = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setFileInputKey((k) => k + 1);
    setForm(emptyForm);
    setVipDays('');
    setVoucherUrl('');
  };

  if (!authorized) {
    return (
      <div className="wheel-admin-page">
        <div className="wheel-admin-gate">
          <h1 className="wheel-admin-gate-title">Admin — Giveaway (Itens)</h1>
          <p className="wheel-admin-gate-desc">Digite o token de administrador para continuar.</p>
          {error && <p className="wheel-admin-gate-error" role="alert">{error}</p>}
          <form onSubmit={handleSubmitToken} className="wheel-admin-gate-form">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Token admin"
              className="wheel-admin-gate-input"
              autoComplete="off"
            />
            <TrackedButton type="submit" className="wheel-admin-gate-btn">Entrar</TrackedButton>
          </form>
          <TrackedButton type="button" className="wheel-admin-gate-back" onClick={() => navigate('/')}>
            Voltar ao site
          </TrackedButton>
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
          <h1 className="wheel-admin-title">Configuração de prêmios — Giveaway</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <TrackedButton
              type="button"
              className={`wheel-admin-filter-refresh${showInactive ? ' wheel-admin-filter-refresh--active' : ''}`}
              onClick={() => setShowInactive((v) => !v)}
              title={showInactive ? 'Mostrando todos (ativos e inativos)' : 'Mostrando apenas ativos'}
            >
              {showInactive ? 'Mostrar só ativos' : 'Mostrar inativos'}
            </TrackedButton>
            <TrackedButton type="button" className="wheel-admin-logout" onClick={handleLogout}>
              Sair
            </TrackedButton>
          </div>
        </div>
      </header>
      <AdminTabs />

      <section className="wheel-admin-filters" style={{ alignItems: 'flex-start' }}>
        <form onSubmit={handleFormSubmit} className="giveaway-admin-form">
          <div className="giveaway-admin-form-grid">
            <label className="giveaway-admin-field">
              <span>Prize key</span>
              <input
                type="text"
                value={form.prize_key}
                onChange={(e) => setForm((f) => ({ ...f, prize_key: e.target.value }))}
              />
            </label>
            <label className="giveaway-admin-field">
              <span>Label</span>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </label>
            <label className="giveaway-admin-field">
              <span>Tipo (rare / case / voucher / vip_days)</span>
              <input
                type="text"
                value={form.prize_type}
                onChange={(e) => setForm((f) => ({ ...f, prize_type: e.target.value }))}
              />
            </label>
            <label className="giveaway-admin-field">
              <span>Dias de VIP (apenas para vip_days)</span>
              <input
                type="number"
                min="1"
                step="1"
                value={vipDays}
                onChange={(e) => setVipDays(e.target.value)}
              />
            </label>
            <label className="giveaway-admin-field">
              <span>Link do voucher (apenas para voucher)</span>
              <input
                type="text"
                value={voucherUrl}
                onChange={(e) => setVoucherUrl(e.target.value)}
              />
            </label>
            <label className="giveaway-admin-field">
              <span>Imagem</span>
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                  setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
                  setForm((f) => ({ ...f, imageFile: file }));
                }}
              />
              {(imagePreviewUrl || form.image_url) && (
                <div className="giveaway-admin-image-preview">
                  <img
                    src={imagePreviewUrl || form.image_url}
                    alt="Preview"
                    className="giveaway-admin-image-preview-img"
                  />
                  <div className="giveaway-admin-image-preview-actions">
                    <TrackedButton
                      type="button"
                      className="wheel-table-btn-detail"
                      onClick={() => {
                        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                        setImagePreviewUrl(null);
                        setFileInputKey((k) => k + 1);
                        setForm((f) => ({ ...f, imageFile: null }));
                      }}
                    >
                      Remover imagem
                    </TrackedButton>
                  </div>
                </div>
              )}
              {form.image_url && !form.imageFile && (
                <small style={{ color: '#9ca3af' }}>Imagem atual será mantida se nenhum arquivo for enviado.</small>
              )}
            </label>
            <label className="giveaway-admin-field">
              <span>Peso</span>
              <input
                type="number"
                min="0.0001"
                step="0.0001"
                value={form.weight}
                onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              />
            </label>
            <label className="giveaway-admin-field giveaway-admin-field--checkbox">
              <span>Ativo</span>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
            </label>
          </div>
          <div className="giveaway-admin-form-actions">
            <TrackedButton type="submit" className="wheel-admin-filter-refresh">
              {form.id ? 'Atualizar prêmio' : 'Criar prêmio'}
            </TrackedButton>
            {form.id && (
              <TrackedButton
                type="button"
                className="wheel-admin-logout"
                onClick={handleFormReset}
              >
                Cancelar edição
              </TrackedButton>
            )}
          </div>
        </form>
      </section>

      {error && (
        <div className="wheel-admin-error" role="alert">
          {error}
        </div>
      )}

      <section className="wheel-admin-table-section">
        <div className="wheel-table-wrap">
          {loading ? (
            <div className="wheel-table-loading">Carregando prêmios...</div>
          ) : items.length === 0 ? (
            <div className="wheel-table-empty">Nenhum prêmio configurado.</div>
          ) : (
            <table className="wheel-table giveaway-items-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Key</th>
                  <th>Label</th>
                  <th>Tipo</th>
                  <th>Peso</th>
                  <th>Ativo</th>
                  <th>Imagem</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.prize_key}</td>
                    <td>{item.label}</td>
                    <td>
                      <span className={`giveaway-admin-type giveaway-admin-type--${(item.prize_type || '').toLowerCase()}`}>
                        {item.prize_type === 'vip_days'
                          ? `VIP ${item.metadata?.vipDays || item.metadata?.days || ''}d`
                          : item.prize_type === 'voucher'
                            ? `Voucher`
                            : (item.prize_type || '—')}
                      </span>
                    </td>
                    <td>{item.weight}</td>
                    <td>{item.active ? 'Sim' : 'Não'}</td>
                    <td>
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.label}
                          style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6 }}
                        />
                      )}
                    </td>
                    <td>
                      <div className="giveaway-admin-actions">
                        <TrackedButton
                          type="button"
                          className="wheel-table-btn-detail"
                          onClick={() => handleEdit(item)}
                        >
                          Editar
                        </TrackedButton>
                        <TrackedButton
                          type="button"
                          className="wheel-table-btn-detail giveaway-admin-remove-btn"
                          onClick={() => handleDelete(item)}
                        >
                          Remover
                        </TrackedButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <style>{`
        .wheel-admin-page {
          min-height: 100vh;
          background: radial-gradient(circle at 0 0, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at 100% 0, rgba(248,113,22,0.18), transparent 55%), #020617;
          color: #e2e8f0;
          padding-bottom: 40px;
        }
        .giveaway-admin-form {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }
        .wheel-admin-header-inner,
        .wheel-admin-filters,
        .wheel-admin-table-section {
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }
        .wheel-admin-filters {
          padding-top: 24px;
          padding-bottom: 18px;
          justify-content: center;
        }
        .wheel-admin-table-section {
          padding-top: 10px;
        }
        .wheel-table-wrap {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #334155;
          background: #1e293b;
        }
        .wheel-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .wheel-table th,
        .wheel-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #334155;
        }
        .wheel-table th {
          background: #0f172a;
          color: #94a3b8;
          font-weight: 600;
        }
        .giveaway-admin-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }
        .giveaway-admin-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8rem;
          color: #cbd5f5;
        }
        .giveaway-admin-field span {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #9ca3af;
        }
        .giveaway-admin-field input[type="text"],
        .giveaway-admin-field input[type="number"] {
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #334155;
          background: #0f172a;
          color: #e5e7eb;
          font-size: 0.85rem;
        }
        .giveaway-admin-field--checkbox {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        .giveaway-admin-form-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        .giveaway-items-table th,
        .giveaway-items-table td {
          text-align: center;
          vertical-align: middle;
        }
        .giveaway-admin-actions {
          display: flex;
          justify-content: center;
          gap: 6px;
        }
        .giveaway-admin-remove-btn {
          border-color: #b91c1c;
          color: #fecaca;
        }
        .giveaway-admin-type {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: rgba(30,64,175,0.4);
          color: #e0f2fe;
        }
        .giveaway-admin-type--rare {
          background: rgba(250,204,21,0.25);
          color: #facc15;
        }
        .giveaway-admin-type--case {
          background: rgba(59,130,246,0.28);
          color: #bfdbfe;
        }
        .giveaway-admin-type--voucher {
          background: rgba(34,197,94,0.22);
          color: #bbf7d0;
        }
        .giveaway-admin-type--vip_days {
          background: rgba(168,85,247,0.25);
          color: #e9d5ff;
        }

        .giveaway-admin-image-preview {
          margin-top: 8px;
          border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.25);
          background: rgba(15,23,42,0.75);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .giveaway-admin-image-preview-img {
          width: 100%;
          height: 140px;
          object-fit: contain;
          border-radius: 8px;
          background: rgba(2,6,23,0.7);
        }
        .giveaway-admin-image-preview-actions {
          display: flex;
          justify-content: flex-end;
        }

        .wheel-admin-filter-refresh--active {
          background: rgba(251,191,36,0.25);
          border: 1px solid rgba(251,191,36,0.45);
        }

        .wheel-table-btn-detail {
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #475569;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

