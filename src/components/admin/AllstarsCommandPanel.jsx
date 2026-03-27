import React, { useCallback, useMemo, useState } from 'react';
import { TrackedButton } from '../TrackedButton';
import {
  ALLSTARS_HANDLED_COMMANDS,
  ALLSTARS_EXTRA_QUEUE_TYPES,
  ALLSTARS_DUEL_CARD_TYPES,
} from '../../data/allstarsBackendCommands';
import { enqueueAllstarsCommand, pollAllstarsCommands } from '../../services/allstarsQueueApi';

const defaultDuelPayload = () => ({
  duelId: `duel-${Date.now()}`,
  ctSteamId: '',
  trSteamId: '',
});

const defaultRoundPayload = () => ({
  roundDurationSeconds: '',
  startMoney: '',
});

export default function AllstarsCommandPanel() {
  const [matchId, setMatchId] = useState('');
  const [loadingType, setLoadingType] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [duelPayload, setDuelPayload] = useState(defaultDuelPayload);
  const [roundPayload, setRoundPayload] = useState(defaultRoundPayload);
  const [cardPayload, setCardPayload] = useState({
    card: 'DOUBLE_DAMAGE',
    side: 'ct',
    count: 1,
  });
  const [extraPayloadJson, setExtraPayloadJson] = useState('{}');

  const [pollCursor, setPollCursor] = useState('0');
  const [pollLoading, setPollLoading] = useState(false);
  const [pollResult, setPollResult] = useState(null);

  const trimmedMatchId = useMemo(() => matchId.trim(), [matchId]);

  const send = useCallback(
    async (type, payload = {}) => {
      setError(null);
      setMessage(null);
      setLoadingType(type);
      try {
        await enqueueAllstarsCommand(trimmedMatchId, type, payload);
        setMessage(`Comando “${type}” enfileirado com sucesso.`);
      } catch (e) {
        setError(e?.message || String(e));
      } finally {
        setLoadingType(null);
      }
    },
    [trimmedMatchId]
  );

  const handlePoll = async () => {
    setError(null);
    setPollLoading(true);
    try {
      const data = await pollAllstarsCommands(trimmedMatchId, pollCursor, 25);
      setPollResult(data);
      if (data?.cursor != null) setPollCursor(String(data.cursor));
    } catch (e) {
      setError(e?.message || String(e));
      setPollResult(null);
    } finally {
      setPollLoading(false);
    }
  };

  const buildRoundPayload = () => {
    const o = {};
    const rd = roundPayload.roundDurationSeconds;
    const sm = roundPayload.startMoney;
    if (rd !== '' && rd != null && !Number.isNaN(Number(rd))) o.roundDurationSeconds = Number(rd);
    if (sm !== '' && sm != null && !Number.isNaN(Number(sm))) o.startMoney = Number(sm);
    return o;
  };

  const sendStartDuel = () => {
    const { duelId, ctSteamId, trSteamId } = duelPayload;
    if (!String(ctSteamId).trim() || !String(trSteamId).trim()) {
      setError('Preencha ctSteamId e trSteamId para start_duel.');
      return;
    }
    send('start_duel', {
      duelId: String(duelId || '').trim() || `duel-${Date.now()}`,
      ctSteamId: String(ctSteamId).trim(),
      trSteamId: String(trSteamId).trim(),
    });
  };

  const sendPlayCard = () => {
    send('play_card', {
      card: cardPayload.card,
      side: cardPayload.side,
      count: Math.min(3, Math.max(1, Number(cardPayload.count) || 1)),
    });
  };

  const sendExtra = (type) => {
    let payload = {};
    try {
      payload = JSON.parse(extraPayloadJson || '{}');
      if (typeof payload !== 'object' || payload === null) throw new Error('JSON deve ser um objeto.');
    } catch (e) {
      setError(`JSON inválido no payload avançado: ${e?.message || e}`);
      return;
    }
    send(type, payload);
  };

  return (
    <section className="allstars-cmd-section">
      <div className="allstars-cmd-hero">
        <div className="allstars-cmd-hero-text">
          <h2 className="allstars-cmd-title">Fila Allstars — HandleBackendCommand</h2>
          <p className="allstars-cmd-lead">
            Os comandos abaixo são gravados em <code>allstars_match_events</code> e consumidos pelo plugin via{' '}
            <code>GET /api/allstars/match/:matchId/poll</code>, reproduzindo o fluxo do{' '}
            <code>switch (cmd.Type)</code> no servidor CS2.
          </p>
        </div>
        <div className="allstars-cmd-match-box">
          <label className="allstars-cmd-match-label">
            <span>Match ID</span>
            <input
              type="text"
              value={matchId}
              onChange={(e) => {
                setMatchId(e.target.value);
                setError(null);
                setMessage(null);
              }}
              placeholder="ex.: id do MATCH_ID / lobby"
              className="allstars-cmd-match-input"
              autoComplete="off"
            />
          </label>
          <div className="allstars-cmd-poll-row">
            <TrackedButton
              type="button"
              className="allstars-cmd-btn allstars-cmd-btn--ghost"
              disabled={pollLoading || !trimmedMatchId}
              onClick={handlePoll}
            >
              {pollLoading ? 'Consultando…' : 'Ver fila (poll)'}
            </TrackedButton>
            <span className="allstars-cmd-cursor-hint">cursor: {pollCursor}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="allstars-cmd-banner allstars-cmd-banner--ok" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="allstars-cmd-banner allstars-cmd-banner--err" role="alert">
          {error}
        </div>
      )}

      {pollResult && (
        <div className="allstars-cmd-poll-out">
          <div className="allstars-cmd-poll-out-head">
            <strong>Última resposta do poll</strong>
            <span className="allstars-cmd-badge">{pollResult.commands?.length ?? 0} comando(s)</span>
          </div>
          <pre className="allstars-cmd-pre">{JSON.stringify(pollResult, null, 2)}</pre>
        </div>
      )}

      <h3 className="allstars-cmd-subtitle">Tratados pelo plugin</h3>
      <div className="allstars-cmd-grid">
        {ALLSTARS_HANDLED_COMMANDS.map((cmd) => (
          <article key={cmd.type} className="allstars-cmd-card">
            <header className="allstars-cmd-card-head">
              <span className="allstars-cmd-emoji" aria-hidden>
                {cmd.emoji}
              </span>
              <div>
                <h4 className="allstars-cmd-card-title">{cmd.label}</h4>
                <code className="allstars-cmd-type">{cmd.type}</code>
              </div>
              <span className="allstars-cmd-pill allstars-cmd-pill--on">HandleBackendCommand</span>
            </header>
            <p className="allstars-cmd-desc">{cmd.description}</p>
            <p className="allstars-cmd-hint">{cmd.payloadHint}</p>

            {cmd.type === 'start_match' && (
              <TrackedButton
                type="button"
                className="allstars-cmd-btn allstars-cmd-btn--primary"
                disabled={!trimmedMatchId || loadingType}
                onClick={() => send('start_match', {})}
              >
                {loadingType === 'start_match' ? 'Enviando…' : 'Enfileirar start_match'}
              </TrackedButton>
            )}

            {cmd.type === 'match_end' && (
              <TrackedButton
                type="button"
                className="allstars-cmd-btn allstars-cmd-btn--primary"
                disabled={!trimmedMatchId || loadingType}
                onClick={() => send('match_end', {})}
              >
                {loadingType === 'match_end' ? 'Enviando…' : 'Enfileirar match_end'}
              </TrackedButton>
            )}

            {cmd.type === 'start_duel' && (
              <div className="allstars-cmd-form">
                <label>
                  duelId
                  <input
                    value={duelPayload.duelId}
                    onChange={(e) => setDuelPayload((p) => ({ ...p, duelId: e.target.value }))}
                    className="allstars-cmd-input"
                  />
                </label>
                <label>
                  ctSteamId
                  <input
                    value={duelPayload.ctSteamId}
                    onChange={(e) => setDuelPayload((p) => ({ ...p, ctSteamId: e.target.value }))}
                    placeholder="76561198…"
                    className="allstars-cmd-input"
                  />
                </label>
                <label>
                  trSteamId
                  <input
                    value={duelPayload.trSteamId}
                    onChange={(e) => setDuelPayload((p) => ({ ...p, trSteamId: e.target.value }))}
                    placeholder="76561198…"
                    className="allstars-cmd-input"
                  />
                </label>
                <TrackedButton
                  type="button"
                  className="allstars-cmd-btn allstars-cmd-btn--primary"
                  disabled={!trimmedMatchId || loadingType}
                  onClick={sendStartDuel}
                >
                  {loadingType === 'start_duel' ? 'Enviando…' : 'Enfileirar start_duel'}
                </TrackedButton>
              </div>
            )}

            {cmd.type === 'round_start' && (
              <div className="allstars-cmd-form">
                <label>
                  roundDurationSeconds <span className="allstars-cmd-opt">opcional</span>
                  <input
                    type="number"
                    value={roundPayload.roundDurationSeconds}
                    onChange={(e) => setRoundPayload((p) => ({ ...p, roundDurationSeconds: e.target.value }))}
                    placeholder="ex. 90"
                    className="allstars-cmd-input"
                  />
                </label>
                <label>
                  startMoney <span className="allstars-cmd-opt">opcional</span>
                  <input
                    type="number"
                    value={roundPayload.startMoney}
                    onChange={(e) => setRoundPayload((p) => ({ ...p, startMoney: e.target.value }))}
                    placeholder="ex. 800"
                    className="allstars-cmd-input"
                  />
                </label>
                <TrackedButton
                  type="button"
                  className="allstars-cmd-btn allstars-cmd-btn--primary"
                  disabled={!trimmedMatchId || loadingType}
                  onClick={() => send('round_start', buildRoundPayload())}
                >
                  {loadingType === 'round_start' ? 'Enviando…' : 'Enfileirar round_start'}
                </TrackedButton>
              </div>
            )}

            {cmd.cardForm && (
              <div className="allstars-cmd-form">
                <label>
                  Carta (DuelCardType)
                  <select
                    value={cardPayload.card}
                    onChange={(e) => setCardPayload((p) => ({ ...p, card: e.target.value }))}
                    className="allstars-cmd-select"
                  >
                    {ALLSTARS_DUEL_CARD_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="allstars-cmd-row2">
                  <label>
                    Lado
                    <select
                      value={cardPayload.side}
                      onChange={(e) => setCardPayload((p) => ({ ...p, side: e.target.value }))}
                      className="allstars-cmd-select"
                    >
                      <option value="ct">CT</option>
                      <option value="tr">TR</option>
                    </select>
                  </label>
                  <label>
                    count (1–3)
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={cardPayload.count}
                      onChange={(e) => setCardPayload((p) => ({ ...p, count: e.target.value }))}
                      className="allstars-cmd-input"
                    />
                  </label>
                </div>
                <TrackedButton
                  type="button"
                  className="allstars-cmd-btn allstars-cmd-btn--accent"
                  disabled={!trimmedMatchId || loadingType}
                  onClick={sendPlayCard}
                >
                  {loadingType === 'play_card' ? 'Enviando…' : 'Enfileirar play_card'}
                </TrackedButton>
              </div>
            )}
          </article>
        ))}
      </div>

      <h3 className="allstars-cmd-subtitle">Outros tipos (enum / fila)</h3>
      <p className="allstars-cmd-lead allstars-cmd-lead--small">
        Mesma tabela de eventos; o switch atual do plugin pode não reagir — útil para testes de integração ou evolução do handler.
      </p>

      <label className="allstars-cmd-json-label">
        Payload JSON compartilhado (objeto)
        <textarea
          value={extraPayloadJson}
          onChange={(e) => setExtraPayloadJson(e.target.value)}
          className="allstars-cmd-textarea"
          rows={4}
          spellCheck={false}
        />
      </label>

      <div className="allstars-cmd-grid allstars-cmd-grid--compact">
        {ALLSTARS_EXTRA_QUEUE_TYPES.map((cmd) => (
          <article key={cmd.type} className="allstars-cmd-card allstars-cmd-card--muted">
            <header className="allstars-cmd-card-head">
              <span className="allstars-cmd-emoji" aria-hidden>
                {cmd.emoji}
              </span>
              <div>
                <h4 className="allstars-cmd-card-title">{cmd.label}</h4>
                <code className="allstars-cmd-type">{cmd.type}</code>
              </div>
              <span className="allstars-cmd-pill">só fila</span>
            </header>
            <p className="allstars-cmd-desc">{cmd.description}</p>
            <TrackedButton
              type="button"
              className="allstars-cmd-btn allstars-cmd-btn--ghost"
              disabled={!trimmedMatchId || loadingType}
              onClick={() => sendExtra(cmd.type)}
            >
              {loadingType === cmd.type ? 'Enviando…' : `Enfileirar ${cmd.type}`}
            </TrackedButton>
          </article>
        ))}
      </div>

      <style>{`
        .allstars-cmd-section {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
          border: 1px solid rgba(51, 65, 85, 0.9);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .allstars-cmd-hero {
          display: grid;
          grid-template-columns: 1fr minmax(260px, 320px);
          gap: 24px;
          margin-bottom: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .allstars-cmd-hero { grid-template-columns: 1fr; }
        }
        .allstars-cmd-title {
          margin: 0 0 8px;
          font-size: 1.35rem;
          background: linear-gradient(90deg, #fbbf24, #f472b6, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .allstars-cmd-lead {
          margin: 0;
          color: #94a3b8;
          font-size: 0.92rem;
          line-height: 1.55;
        }
        .allstars-cmd-lead--small { font-size: 0.85rem; margin-bottom: 12px; }
        .allstars-cmd-lead code {
          font-size: 0.8rem;
          color: #e2e8f0;
          background: rgba(15, 23, 42, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #334155;
        }
        .allstars-cmd-match-box {
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
        }
        .allstars-cmd-match-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
        }
        .allstars-cmd-match-input {
          font-size: 0.95rem;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #475569;
          background: #0f172a;
          color: #f8fafc;
        }
        .allstars-cmd-match-input:focus {
          outline: none;
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
        }
        .allstars-cmd-poll-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .allstars-cmd-cursor-hint {
          font-size: 0.8rem;
          color: #64748b;
          font-family: ui-monospace, monospace;
        }
        .allstars-cmd-banner {
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 0.9rem;
          margin-bottom: 16px;
        }
        .allstars-cmd-banner--ok {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.45);
          color: #86efac;
        }
        .allstars-cmd-banner--err {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.45);
          color: #fca5a5;
        }
        .allstars-cmd-poll-out {
          margin-bottom: 20px;
          border-radius: 12px;
          border: 1px solid #334155;
          overflow: hidden;
          background: #0f172a;
        }
        .allstars-cmd-poll-out-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: rgba(30, 41, 59, 0.9);
          border-bottom: 1px solid #334155;
          font-size: 0.85rem;
        }
        .allstars-cmd-pre {
          margin: 0;
          padding: 14px;
          font-size: 0.75rem;
          max-height: 220px;
          overflow: auto;
          color: #cbd5e1;
        }
        .allstars-cmd-subtitle {
          margin: 8px 0 14px;
          font-size: 1rem;
          color: #e2e8f0;
          font-weight: 600;
        }
        .allstars-cmd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }
        .allstars-cmd-grid--compact {
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }
        .allstars-cmd-card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(71, 85, 105, 0.6);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .allstars-cmd-card:hover {
          border-color: rgba(251, 191, 36, 0.35);
          transform: translateY(-1px);
        }
        .allstars-cmd-card--muted {
          opacity: 0.92;
        }
        .allstars-cmd-card-head {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          flex-wrap: wrap;
        }
        .allstars-cmd-emoji {
          font-size: 1.6rem;
          line-height: 1;
        }
        .allstars-cmd-card-title {
          margin: 0;
          font-size: 0.95rem;
          color: #f1f5f9;
        }
        .allstars-cmd-type {
          font-size: 0.78rem;
          color: #a5b4fc;
          background: rgba(79, 70, 229, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .allstars-cmd-pill {
          margin-left: auto;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(100, 116, 139, 0.35);
          color: #cbd5e1;
        }
        .allstars-cmd-pill--on {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.35);
        }
        .allstars-cmd-badge {
          font-size: 0.72rem;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.15);
          color: #7dd3fc;
        }
        .allstars-cmd-desc {
          margin: 0;
          font-size: 0.82rem;
          color: #94a3b8;
          line-height: 1.5;
          flex: 1;
        }
        .allstars-cmd-hint {
          margin: 0;
          font-size: 0.75rem;
          color: #64748b;
          font-family: ui-monospace, monospace;
        }
        .allstars-cmd-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .allstars-cmd-form label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .allstars-cmd-opt {
          font-weight: 400;
          color: #64748b;
          text-transform: none;
        }
        .allstars-cmd-input,
        .allstars-cmd-select {
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #475569;
          background: #0f172a;
          color: #f1f5f9;
          font-size: 0.88rem;
        }
        .allstars-cmd-input:focus,
        .allstars-cmd-select:focus {
          outline: none;
          border-color: #fbbf24;
        }
        .allstars-cmd-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .allstars-cmd-btn {
          padding: 10px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          border: none;
          cursor: pointer;
          transition: filter 0.15s, transform 0.1s;
        }
        .allstars-cmd-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .allstars-cmd-btn--primary {
          background: linear-gradient(135deg, #f59e0b, #ea580c);
          color: #0f172a;
        }
        .allstars-cmd-btn--primary:hover:not(:disabled) {
          filter: brightness(1.08);
        }
        .allstars-cmd-btn--accent {
          background: linear-gradient(135deg, #a855f7, #6366f1);
          color: #fff;
        }
        .allstars-cmd-btn--accent:hover:not(:disabled) {
          filter: brightness(1.08);
        }
        .allstars-cmd-btn--ghost {
          background: transparent;
          color: #94a3b8;
          border: 1px solid #475569;
        }
        .allstars-cmd-btn--ghost:hover:not(:disabled) {
          background: rgba(71, 85, 105, 0.25);
          color: #e2e8f0;
        }
        .allstars-cmd-json-label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.8rem;
          color: #94a3b8;
          margin-bottom: 16px;
        }
        .allstars-cmd-textarea {
          font-family: ui-monospace, monospace;
          font-size: 0.8rem;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #475569;
          background: #0f172a;
          color: #e2e8f0;
          resize: vertical;
          min-height: 80px;
        }
        .allstars-cmd-textarea:focus {
          outline: none;
          border-color: #38bdf8;
        }
      `}</style>
    </section>
  );
}
