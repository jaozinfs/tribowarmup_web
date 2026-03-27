import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrackedButton } from './TrackedButton';

const STORAGE_KEY = 'promo_banner_closed';

export default function PromoBannerModal() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const closed = sessionStorage.getItem(STORAGE_KEY);
      if (!closed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const close = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setVisible(false);
  };

  const goToGiveaway = () => {
    close();
    navigate('/giveaway');
  };

  if (!visible) return null;

  return (
    <div
      className="promo-banner-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Banner sistema de pontos e prêmios"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="promo-banner-modal">
        <TrackedButton
          type="button"
          className="promo-banner-close"
          onClick={close}
          aria-label="Fechar banner"
        >
          ×
        </TrackedButton>
        <TrackedButton
          type="button"
          className="promo-banner-image-wrap"
          onClick={goToGiveaway}
          aria-label="Ir para a página de giveaway"
        >
          <img
            src="/images/banner.png"
            alt="Sistema de pontos e prêmios — Jogue, indique e ganhe recompensas exclusivas"
            className="promo-banner-image"
          />
        </TrackedButton>
      </div>
      <style>{`
        .promo-banner-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 24px;
          animation: promo-banner-fade 0.2s ease-out;
        }
        @keyframes promo-banner-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .promo-banner-modal {
          position: relative;
          max-width: min(960px, 100%);
          max-height: calc(100vh - 48px);
          padding: 12px;
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid rgba(245, 158, 11, 0.5);
          border-radius: 16px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.06),
            0 0 40px rgba(245, 158, 11, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          animation: promo-banner-scale 0.25s ease-out;
        }
        @keyframes promo-banner-scale {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .promo-banner-close {
          position: absolute;
          top: 4px;
          right: 4px;
          z-index: 2;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          background: rgba(30, 41, 59, 0.95);
          color: #94a3b8;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .promo-banner-close:hover {
          background: rgba(51, 65, 85, 0.95);
          color: #e2e8f0;
        }
        .promo-banner-image-wrap {
          display: block;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 10px;
          overflow: hidden;
          width: 100%;
        }
        .promo-banner-image {
          display: block;
          width: 100%;
          height: auto;
          max-height: calc(100vh - 72px);
          object-fit: contain;
          vertical-align: top;
        }
      `}</style>
    </div>
  );
}
