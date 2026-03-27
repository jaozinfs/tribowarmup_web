import { createElement, forwardRef, useMemo } from 'react';

function slugify(value) {
  if (value == null || value === '') return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 56);
}

function firstClassKey(className) {
  if (!className || typeof className !== 'string') return '';
  const token = className.trim().split(/\s+/).find(Boolean);
  return token ? slugify(token.replace(/^.*\./, '')) : '';
}

/**
 * Botão nativo com atributos de analytics para o listener global (analytics.js).
 * - data-analytics-event: nome estável para GTM (prioridade: analyticsEvent > analyticsId > 1ª classe > label)
 * - data-analytics-label: texto amigável para relatórios
 */
export const TrackedButton = forwardRef(function TrackedButton(
  {
    analyticsEvent,
    analyticsId,
    analyticsLabel,
    className,
    children,
    type,
    ...rest
  },
  ref
) {
  const label = useMemo(() => {
    if (analyticsLabel != null && String(analyticsLabel).trim() !== '') {
      return String(analyticsLabel).trim().slice(0, 120);
    }
    if (typeof children === 'string' || typeof children === 'number') {
      return String(children).replace(/\s+/g, ' ').trim().slice(0, 120);
    }
    return '';
  }, [analyticsLabel, children]);

  const eventName = useMemo(() => {
    if (analyticsEvent && String(analyticsEvent).trim()) {
      return String(analyticsEvent).trim().slice(0, 80);
    }
    if (analyticsId && String(analyticsId).trim()) {
      return `btn_${slugify(analyticsId)}`.replace(/^btn_$/, 'btn_click');
    }
    const fromClass = firstClassKey(className);
    if (fromClass) return `btn_${fromClass}`;
    if (label) return `btn_${slugify(label)}`;
    return 'btn_click';
  }, [analyticsEvent, analyticsId, className, label]);

  const labelAttr = label || eventName.replace(/^btn_/, '').replace(/_/g, ' ') || 'button';

  return createElement(
    'button',
    {
      ref,
      type: type ?? 'button',
      className,
      'data-analytics-event': eventName,
      'data-analytics-label': labelAttr.slice(0, 120),
      ...rest,
    },
    children
  );
});

export default TrackedButton;
