/**
 * Boneco no centro do loadout — silhueta estilo CS2 (CT = tático, T = terrorista).
 * SVG para ficar nítido e igual em qualquer tela.
 */
export default function LoadoutCharacterSilhouette({ side }) {
  const isCT = side === 'ct';

  // Cores por lado (CT = azul tático, T = marrom/oliva)
  const colors = isCT
    ? {
        head: '#1a3050',
        helmet: '#2a4a6e',
        torso: '#1e3a5f',
        vest: '#152a45',
        legs: '#0f1f33',
        arm: '#152a45',
        boot: '#0a1520',
      }
    : {
        head: '#3d2612',
        helmet: '#4a2c14',
        torso: '#5c3a1a',
        vest: '#4a2c14',
        legs: '#3d2612',
        arm: '#4a2c14',
        boot: '#2d1b0d',
      };

  return (
    <div className={`loadout-character-silhouette loadout-character-silhouette--${side}`} aria-hidden>
      <svg
        viewBox="0 0 120 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="loadout-character-svg"
      >
        {/* Pernas */}
        <path
          d="M 42 155 L 48 220 L 52 220 L 58 155 Z"
          fill={colors.legs}
          stroke={colors.boot}
          strokeWidth="1.5"
        />
        <path
          d="M 62 155 L 68 220 L 72 220 L 78 155 Z"
          fill={colors.legs}
          stroke={colors.boot}
          strokeWidth="1.5"
        />
        {/* Botas */}
        <ellipse cx="50" cy="218" rx="6" ry="3" fill={colors.boot} />
        <ellipse cx="70" cy="218" rx="6" ry="3" fill={colors.boot} />

        {/* Torso / colete */}
        <path
          d="M 35 75 L 40 155 L 80 155 L 85 75 Z"
          fill={colors.torso}
          stroke={colors.vest}
          strokeWidth="2"
        />
        {/* Detalhe colete (bolsos/placa) */}
        <path
          d="M 48 90 L 72 90 L 72 130 L 48 130 Z"
          fill={colors.vest}
          opacity="0.9"
        />

        {/* Braço esquerdo (arma ao lado) */}
        <path
          d="M 28 85 L 35 95 L 38 140 L 32 142 Z"
          fill={colors.arm}
        />
        {/* Braço direito */}
        <path
          d="M 82 85 L 92 88 L 90 138 L 85 135 Z"
          fill={colors.arm}
        />

        {/* Pescoço */}
        <rect x="52" y="68" width="16" height="12" rx="2" fill={colors.head} />

        {/* Cabeça + capacete (CT) ou passamontanha (T) */}
        {isCT ? (
          <>
            <ellipse cx="60" cy="45" rx="22" ry="24" fill={colors.head} />
            <path
              d="M 38 35 Q 60 18 82 35 L 80 55 Q 60 50 40 55 Z"
              fill={colors.helmet}
              stroke={colors.vest}
              strokeWidth="1"
            />
            <ellipse cx="60" cy="42" rx="14" ry="16" fill={colors.head} />
            {/* Visor */}
            <path d="M 48 38 Q 60 32 72 38" stroke="#0d2137" strokeWidth="2" fill="none" opacity="0.6" />
          </>
        ) : (
          <>
            <ellipse cx="60" cy="45" rx="22" ry="24" fill={colors.head} />
            <path
              d="M 38 28 Q 60 22 82 28 L 82 58 Q 60 52 38 58 Z"
              fill={colors.helmet}
              opacity="0.95"
            />
            <ellipse cx="60" cy="44" rx="14" ry="16" fill="#2d1b0d" />
            {/* Olhos */}
            <ellipse cx="54" cy="42" rx="3" ry="2" fill="#1a1008" />
            <ellipse cx="66" cy="42" rx="3" ry="2" fill="#1a1008" />
          </>
        )}
      </svg>
    </div>
  );
}
