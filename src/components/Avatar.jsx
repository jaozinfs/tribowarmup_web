import { useState, useRef, useEffect } from 'react';
import { normalizeAvatarUrl } from '../utils/avatarUrl';

/**
 * Avatar com URL normalizada. Mantém última URL válida para não piscar ao recarregar (ex.: veto).
 * Placeholder até carregar; loading="eager" na PUG para não demorar.
 */
export function Avatar({ avatarUrl: raw, className, alt = '', loading = 'lazy', ...props }) {
  const [loaded, setLoaded] = useState(false);
  const lastValidSrcRef = useRef(null);
  const src = normalizeAvatarUrl(raw);
  const displaySrc = src || lastValidSrcRef.current;
  useEffect(() => {
    if (src) lastValidSrcRef.current = src;
  }, [src]);
  if (!displaySrc) {
    return <span className={`avatar-placeholder ${className || ''}`} aria-hidden />;
  }
  return (
    <span className={`avatar-wrap ${loaded ? 'avatar-wrap--loaded' : ''} ${className || ''}`.trim()}>
      <span className="avatar-placeholder" aria-hidden />
      <img
        src={displaySrc}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        {...props}
      />
    </span>
  );
}
