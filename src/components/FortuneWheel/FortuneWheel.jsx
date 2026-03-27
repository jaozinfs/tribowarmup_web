import { useEffect, useMemo, useRef, useState } from 'react';
import './FortuneWheel.css';
import { TrackedButton } from '../TrackedButton';

const TICK_SOUND_PATH = '/assets/sounds/tick.mp3';
const WIN_SOUND_PATH = '/assets/sounds/win.mp3';

// Imagem padrão da "caixa" para todos os prêmios
const DEFAULT_IMAGE = '/assets/images/fever-case.webp';

// Fallback local para quando API ainda não retornou prêmios
const FORTUNE_WHEEL_ITEMS = [
  { key: 'skin', label: 'Skin CS2', type: 'skin' },
  { key: 'case', label: 'Caixa Steam', type: 'case' },
  { key: 'coupon10', label: 'Cupom 10%', type: 'coupon' },
  { key: 'coupon25', label: 'Cupom 25%', type: 'coupon' },
  { key: 'vip', label: 'VIP 30 dias', type: 'ticket' },
  { key: 'points', label: 'Pontos extras', type: 'ticket' },
  { key: 'knife', label: 'Chance de faca', type: 'skin' },
  { key: 'again', label: 'Mais uma vez', type: 'ticket' },
];

const MIN_SPINS = 4;
const MAX_SPINS = 6;
const SPIN_DURATION_MS = 4500;

// Medidas do strip, inspiradas no componente da Home
const ITEM_WIDTH = 140;
const ITEM_GAP = 12;
const ITEM_TOTAL = ITEM_WIDTH + ITEM_GAP;
// Muitas repetições para nunca ficar vazio: itens passam o tempo todo e o último que para é o ganhador
const STRIP_REPEAT_LOOPS = 24;

function easeOutCubic(t) {
  const x = 1 - t;
  return 1 - x * x * x;
}

export function FortuneWheel({ canSpin, tickets, onSpinRequest, onSpinComplete, prizes }) {
  const [stripOffset, setStripOffset] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerGlobalIndex, setWinnerGlobalIndex] = useState(null);
  const [confetti, setConfetti] = useState([]);

  const lastTickIndexRef = useRef(null);
  const tickAudioRef = useRef(null);
  const winAudioRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
      tickAudioRef.current = new Audio(TICK_SOUND_PATH);
      winAudioRef.current = new Audio(WIN_SOUND_PATH);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const playTick = () => {
    const audio = tickAudioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.play();
    } catch {
      // ignore
    }
  };

  const playWin = () => {
    const audio = winAudioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.play();
    } catch {
      // ignore
    }
  };

  const spawnConfetti = () => {
    const pieces = Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      left: `${10 + Math.random() * 80}%`,
      delay: `${Math.random() * 0.4}s`,
      color: ['#22c55e', '#4ade80', '#a3e635', '#f97316'][i % 4],
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 1700);
  };

  const segments = useMemo(() => {
    const base = Array.isArray(prizes) && prizes.length > 0 ? prizes : FORTUNE_WHEEL_ITEMS;
    return base.map((p, idx) => {
      let kind = 'ticket';
      if (p.type === 'item' || p.type === 'skin') kind = 'skin';
      if (p.type === 'case') kind = 'case';
      if (p.type === 'coupon' || (p.key && String(p.key).startsWith('discount'))) kind = 'ticket';
      return {
        id: p.id || `${p.key}-${idx}`,
        key: p.key,
        label: p.label,
        type: kind,
        image: p.image || p.image_url || DEFAULT_IMAGE,
      };
    });
  }, [prizes]);

  const handleClickSpin = async () => {
    if (!canSpin || spinning || !onSpinRequest || segments.length === 0) return;
    setSpinning(true);
    setWinnerGlobalIndex(null);
    // Reinicia o strip em cada rodada para evitar sair da faixa renderizada
    setStripOffset(0);

    try {
      const result = await onSpinRequest();
      const prizeKey = result?.key || result?.prizeKey;

      let candidateIndexes = segments
        .map((it, idx) => ({ it, idx }))
        .filter((x) => (prizeKey ? x.it.key === prizeKey : true));
      if (candidateIndexes.length === 0) {
        candidateIndexes = segments.map((it, idx) => ({ it, idx }));
      }
      const chosen = candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];
      const targetIndex = chosen.idx;

      const laps = MIN_SPINS + Math.floor(Math.random() * (MAX_SPINS - MIN_SPINS + 1));
      const itemsPerLap = segments.length;

      // Parar com o item vencedor na linha: vários itens passam (pode repetir o mesmo prêmio), o último que cai é o ganhador.
      const baseItemsBefore = 3 * itemsPerLap;
      const targetItemIndex = baseItemsBefore + targetIndex + laps * itemsPerLap;
      const targetDistance = targetItemIndex * ITEM_TOTAL;

      const start = performance.now();
      const startOffset = 0;
      lastTickIndexRef.current = null;

      const animate = (now) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / SPIN_DURATION_MS);
        const eased = easeOutCubic(t);

        const currentOffset = startOffset + targetDistance * eased;
        setStripOffset(currentOffset);

        const currentItemIndex = Math.floor(currentOffset / ITEM_TOTAL);
        if (currentItemIndex !== lastTickIndexRef.current) {
          if (lastTickIndexRef.current !== null) {
            playTick();
          }
          lastTickIndexRef.current = currentItemIndex;
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setSpinning(false);
          setStripOffset(startOffset + targetDistance);
          setWinnerGlobalIndex(targetItemIndex);
          playWin();
          spawnConfetti();
          onSpinComplete?.(result, targetIndex);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    } catch {
      setSpinning(false);
    }
  };

  return (
    <div className="fortune-wheel-container">
      <div className="token-counter">
        <span className="token-counter-label">FICHAS</span>
        <span className="token-counter-value">{tickets ?? 0}</span>
      </div>

      <div className="spin-button">
        <div className="spin-button-label">
          <span className="spin-button-text">CLIQUE PARA RODAR</span>
          <span className="spin-button-arrow" />
        </div>
        <TrackedButton
          type="button"
          className={`spin-button-main${spinning ? ' spin-button-main--spinning' : ''}`}
          onClick={handleClickSpin}
          disabled={!canSpin || spinning}
        >
          {spinning ? (
            <span className="spin-button-gear" aria-hidden="true" />
          ) : (
            'ABRIR'
          )}
        </TrackedButton>
      </div>

      <div className="fortune-wheel">
        <div className="giveaway-strip-viewport">
          <div className="giveaway-strip-center-line" />

          <div
            className="giveaway-strip"
            style={{ transform: `translate3d(${-stripOffset}px, 0, 0)` }}
          >
            {Array.from({ length: STRIP_REPEAT_LOOPS }).map((_, loop) =>
              segments.map((item, index) => {
                const key = `${loop}-${item.id || item.key || index}`;
                const globalIndex = loop * segments.length + index;
                const isWinner = winnerGlobalIndex !== null && globalIndex === winnerGlobalIndex;
                return (
                  <div
                    key={key}
                    className={`giveaway-strip-item giveaway-strip-item--${item.type}${
                      isWinner ? ' giveaway-strip-item--winner' : ''
                    }`}
                  >
                    <div className="giveaway-strip-item-img-wrap">
                      <img
                        src={item.image || DEFAULT_IMAGE}
                        alt={item.label}
                        className="giveaway-strip-item-img"
                        loading="lazy"
                      />
                    </div>
                    <span className="giveaway-strip-item-label">{item.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {confetti.length > 0 && (
          <div className="fw-confetti-layer">
            {confetti.map((c) => (
              <div
                key={c.id}
                className="fw-confetti-piece"
                style={{
                  left: c.left,
                  backgroundColor: c.color,
                  animationDelay: c.delay,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

