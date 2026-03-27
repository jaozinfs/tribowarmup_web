import React from 'react';
import { WheelSpinDetailModal } from './WheelSpinDetailModal.jsx';
import { TrackedButton } from '../TrackedButton';

export function WheelSpinTable({ items, loading, onSelectDetail, selectedSpin, onCloseDetail }) {
  if (loading) {
    return (
      <div className="wheel-table-wrap">
        <div className="wheel-table-loading">Carregando spins...</div>
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <div className="wheel-table-wrap">
        <div className="wheel-table-empty">Nenhum spin encontrado.</div>
      </div>
    );
  }

  return (
    <>
      <div className="wheel-table-wrap">
        <table className="wheel-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Item</th>
              <th>Rarity</th>
              <th>Date</th>
              <th>Redeemed</th>
              <th>IP</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="wheel-table-user" title={row.user_id}>{row.username || row.user_id}</span>
                </td>
                <td>{row.item_name}</td>
                <td><span className={`wheel-table-rarity wheel-table-rarity--${(row.item_rarity || '').toLowerCase()}`}>{row.item_rarity || '—'}</span></td>
                <td>{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</td>
                <td>{row.is_redeemed ? 'Sim' : 'Não'}</td>
                <td><span className="wheel-table-ip">{row.ip_address || '—'}</span></td>
                <td>
                  <TrackedButton
                    type="button"
                    className="wheel-table-btn-detail"
                    onClick={() => onSelectDetail(row.id)}
                  >
                    Ver detalhes
                  </TrackedButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedSpin && (
        <WheelSpinDetailModal spin={selectedSpin} onClose={onCloseDetail} />
      )}
    </>
  );
}
