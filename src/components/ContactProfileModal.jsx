import { useState, useEffect } from 'react';
import { validateMarketingEmail, validateMarketingPhone } from '../utils/contactValidation';
import './ContactProfileModal.css';
import { TrackedButton } from './TrackedButton';

function getNameError(value, { required = false } = {}) {
  const fn = String(value ?? '').trim();
  if (fn.length === 0) {
    return required ? 'Informe seu nome completo.' : null;
  }
  if (fn.length < 2) return 'Nome deve ter pelo menos 2 caracteres.';
  if (fn.length > 255) return 'Nome muito longo (máx. 255 caracteres).';
  return null;
}

function getEmailError(value, { required = false } = {}) {
  const t = String(value ?? '').trim();
  if (!t) {
    return required ? 'Informe seu e-mail.' : null;
  }
  const r = validateMarketingEmail(t);
  return r.ok ? null : r.message;
}

function getPhoneError(value, { required = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return required ? 'Informe seu telefone com DDD.' : null;
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) {
    return required ? 'Telefone deve conter números.' : null;
  }
  const r = validateMarketingPhone(raw);
  return r.ok ? null : r.message;
}

/**
 * @param {'blocking' | 'edit'} variant — blocking = sem fechar por fora / sem X
 * @param {{ fullName: string, email: string, phone: string }} initialValues
 * @param {(data: { fullName: string, email: string, phone: string }) => Promise<void>} onSubmit
 * @param {() => void} [onClose] — apenas variant edit
 */
export default function ContactProfileModal({
  variant = 'blocking',
  initialValues = { fullName: '', email: '', phone: '' },
  onSubmit,
  onClose,
  title,
  subtitle,
}) {
  const [fullName, setFullName] = useState(initialValues.fullName || '');
  const [email, setEmail] = useState(initialValues.email || '');
  const [phone, setPhone] = useState(initialValues.phone || '');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fn0 = initialValues.fullName || '';
    const em0 = initialValues.email || '';
    const ph0 = initialValues.phone || '';
    setFullName(fn0);
    setEmail(em0);
    setPhone(ph0);
    setNameError(getNameError(fn0, { required: false }) || '');
    setEmailError(getEmailError(em0, { required: false }) || '');
    setPhoneError(getPhoneError(ph0, { required: false }) || '');
    setFormError('');
  }, [initialValues.fullName, initialValues.email, initialValues.phone]);

  const handleBackdropClick = (e) => {
    if (variant === 'blocking') return;
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const ne = getNameError(fullName, { required: true }) || '';
    const ee = getEmailError(email, { required: true }) || '';
    const pe = getPhoneError(phone, { required: true }) || '';
    setNameError(ne);
    setEmailError(ee);
    setPhoneError(pe);
    if (ne || ee || pe) return;

    const emailResult = validateMarketingEmail(email);
    const phoneResult = validateMarketingPhone(phone);
    if (!emailResult.ok || !phoneResult.ok) return;

    setSaving(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: emailResult.value,
        phone: phoneResult.normalized,
      });
      if (variant === 'edit') onClose?.();
    } catch (err) {
      setFormError(err?.message || 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const blocking = variant === 'blocking';

  return (
    <div
      className="contact-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      onClick={handleBackdropClick}
    >
      <div className="contact-modal-glow" aria-hidden />
      <div className="contact-modal-panel">
        {!blocking && (
          <TrackedButton type="button" className="contact-modal-close" onClick={() => onClose?.()} aria-label="Fechar">
            ×
          </TrackedButton>
        )}
        <h2 id="contact-modal-title" className="contact-modal-title">
          {title || (blocking ? 'Complete seu cadastro' : 'Editar dados de contato')}
        </h2>
        <p className="contact-modal-sub">
          {subtitle
            || 'Atualize nome, e-mail ou telefone usados em campanhas e suporte.'}
        </p>
        <form className="contact-modal-form" onSubmit={handleSubmit} noValidate>
          <label className={`contact-modal-label${nameError ? ' contact-modal-label--invalid' : ''}`}>
            Nome completo
            <input
              className={`contact-modal-input${nameError ? ' contact-modal-input--invalid' : ''}`}
              type="text"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(ev) => {
                const v = ev.target.value;
                setFullName(v);
                setNameError(getNameError(v, { required: false }) || '');
              }}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'contact-name-err' : undefined}
              maxLength={255}
              disabled={saving}
            />
            {nameError ? (
              <span id="contact-name-err" className="contact-modal-field-error" role="alert">
                {nameError}
              </span>
            ) : null}
          </label>
          <label className={`contact-modal-label${emailError ? ' contact-modal-label--invalid' : ''}`}>
            E-mail
            <input
              className={`contact-modal-input${emailError ? ' contact-modal-input--invalid' : ''}`}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(ev) => {
                const v = ev.target.value;
                setEmail(v);
                setEmailError(getEmailError(v, { required: false }) || '');
              }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'contact-email-err' : undefined}
              disabled={saving}
            />
            {emailError ? (
              <span id="contact-email-err" className="contact-modal-field-error" role="alert">
                {emailError}
              </span>
            ) : null}
          </label>
          <label className={`contact-modal-label${phoneError ? ' contact-modal-label--invalid' : ''}`}>
            Telefone (WhatsApp)
            <input
              className={`contact-modal-input${phoneError ? ' contact-modal-input--invalid' : ''}`}
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(11) 98765-4321 ou +55 11 987654321"
              value={phone}
              onChange={(ev) => {
                const v = ev.target.value;
                setPhone(v);
                setPhoneError(getPhoneError(v, { required: false }) || '');
              }}
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? 'contact-phone-err' : 'contact-phone-hint'}
              disabled={saving}
            />
            {phoneError ? (
              <span id="contact-phone-err" className="contact-modal-field-error" role="alert">
                {phoneError}
              </span>
            ) : (
              <span id="contact-phone-hint" className="contact-modal-hint">
                Brasil: DDD + número (10 dígitos fixo ou 11 com 9 no celular). Pode incluir +55.
              </span>
            )}
          </label>
          {formError ? <p className="contact-modal-error contact-modal-error--form" role="alert">{formError}</p> : null}
          <TrackedButton type="submit" className="contact-modal-submit pug-btn pug-btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : blocking ? 'Continuar' : 'Salvar alterações'}
          </TrackedButton>
        </form>
      </div>
    </div>
  );
}
