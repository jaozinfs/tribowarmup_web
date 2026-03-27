import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../index.css';
import { TrackedButton } from './TrackedButton';

const AFFILIATE_REF_KEY = 'affiliate_ref';

export function useAffiliateRef() {
  const [searchParams] = useSearchParams();
  const refFromUrl = searchParams.get('ref')?.trim() || '';
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (refFromUrl) {
      try {
        window.localStorage.setItem(AFFILIATE_REF_KEY, refFromUrl);
        setSaved(true);
      } catch {}
    }
  }, [refFromUrl]);

  const hasStored = typeof window !== 'undefined' && !!window.localStorage.getItem(AFFILIATE_REF_KEY);
  const hasRef = !!refFromUrl || saved || hasStored;
  return { hasRef };
}

export default function AffiliateInviteModal() {
  const auth = useAuth();
  const [show, setShow] = useState(false);
  const { hasRef } = useAffiliateRef();

  useEffect(() => {
    if (hasRef && !auth.steamId && !auth.loading) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [hasRef, auth.steamId, auth.loading]);

  if (!show) return null;

  const handleLogin = () => {
    auth.login(window.location.pathname || '/');
  };

  return (
    <div className="affiliate-invite-backdrop" role="dialog" aria-modal="true" aria-labelledby="affiliate-invite-title">
      <div className="affiliate-invite-card">
        <div className="affiliate-invite-glow" aria-hidden />
        <h2 id="affiliate-invite-title" className="affiliate-invite-title">Você foi convidado por um jogador do SnapTap</h2>
        <p className="affiliate-invite-desc">
          Entre para jogar Warmup, Mix e ganhar skins grátis. Jogue 30 minutos em PUG ou SQUAD e quem te indicou ganha +5 pontos.
        </p>
        <TrackedButton type="button" className="affiliate-invite-btn" onClick={handleLogin}>
          <span className="affiliate-invite-btn-icon" aria-hidden />
          Login com Steam
        </TrackedButton>
        <TrackedButton type="button" className="affiliate-invite-close" onClick={() => setShow(false)} aria-label="Fechar">
          ×
        </TrackedButton>
      </div>
      <style>{`
        .affiliate-invite-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          padding: 20px;
          animation: affiliate-invite-fade 0.2s ease-out;
        }
        @keyframes affiliate-invite-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .affiliate-invite-card {
          position: relative;
          max-width: 420px;
          width: 100%;
          padding: 32px 28px;
          background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 16px;
          box-shadow: 0 0 40px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255,255,255,0.06);
          animation: affiliate-invite-scale 0.25s ease-out;
        }
        @keyframes affiliate-invite-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .affiliate-invite-glow {
          position: absolute;
          inset: -1px;
          border-radius: 17px;
          background: linear-gradient(135deg, transparent 40%, rgba(245,158,11,0.08) 50%, transparent 60%);
          pointer-events: none;
        }
        .affiliate-invite-title {
          margin: 0 0 12px;
          font-family: var(--font-head);
          font-size: 1.25rem;
          letter-spacing: 0.05em;
          color: #f1f5f9;
          text-align: center;
          line-height: 1.3;
        }
        .affiliate-invite-desc {
          margin: 0 0 24px;
          font-size: 0.9rem;
          color: #94a3b8;
          text-align: center;
          line-height: 1.5;
        }
        .affiliate-invite-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 14px 24px;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #0f172a;
          background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .affiliate-invite-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(245, 158, 11, 0.5);
        }
        .affiliate-invite-btn-icon {
          width: 24px;
          height: 24px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230f172a'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E") center/contain no-repeat;
        }
        .affiliate-invite-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          padding: 0;
          font-size: 1.5rem;
          line-height: 1;
          color: #94a3b8;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .affiliate-invite-close:hover {
          color: #e2e8f0;
          background: rgba(255,255,255,0.06);
        }
      `}</style>
    </div>
  );
}
