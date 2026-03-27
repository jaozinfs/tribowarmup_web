import React from 'react';
import { TrackedButton } from '../TrackedButton';

export function WheelSpinDetailModal({ spin, onClose }) {
  if (!spin) return null;

  return (
    <div className="wheel-detail-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="wheel-detail-title">
      <div className="wheel-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wheel-detail-header">
          <h2 id="wheel-detail-title">Detalhe do spin #{spin.id}</h2>
          <TrackedButton type="button" className="wheel-detail-close" onClick={onClose} aria-label="Fechar">
            ×
          </TrackedButton>
        </div>
        <div className="wheel-detail-body">
          <dl className="wheel-detail-dl">
            <dt>Steam ID</dt>
            <dd>{spin.user_id}</dd>
            <dt>Username</dt>
            <dd>{spin.username || '—'}</dd>
            <dt>Item</dt>
            <dd>{spin.item_name}</dd>
            <dt>Item ID</dt>
            <dd>{spin.item_id}</dd>
            <dt>Rarity</dt>
            <dd>{spin.item_rarity || '—'}</dd>
            <dt>Spin result</dt>
            <dd>{spin.spin_result}</dd>
            <dt>Data do spin</dt>
            <dd>{spin.created_at ? new Date(spin.created_at).toLocaleString() : '—'}</dd>
            <dt>IP</dt>
            <dd>{spin.ip_address || '—'}</dd>
            <dt>User agent</dt>
            <dd className="wheel-detail-ua">{spin.user_agent || '—'}</dd>
            <dt>Resgatado</dt>
            <dd>{spin.is_redeemed ? 'Sim' : 'Não'}</dd>
            {spin.is_redeemed && (
              <>
                <dt>Resgatado em</dt>
                <dd>{spin.redeemed_at ? new Date(spin.redeemed_at).toLocaleString() : '—'}</dd>
                <dt>Transaction ID</dt>
                <dd>{spin.redeem_transaction_id || '—'}</dd>
              </>
            )}
            <dt>Spin source</dt>
            <dd>{spin.spin_source || 'web'}</dd>
            <dt>Spin hash</dt>
            <dd className="wheel-detail-hash">{spin.spin_hash || '—'}</dd>
            <dt>Spin seed</dt>
            <dd className="wheel-detail-hash">{spin.spin_seed || '—'}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
