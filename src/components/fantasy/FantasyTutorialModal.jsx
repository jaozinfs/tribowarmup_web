import { TrackedButton } from '../TrackedButton';
const STEPS = [
  {
    title: 'Bem-vindo ao SnapFantasy CS2',
    body: 'Monte um time de 5 pros com dados reais (HLTV / PandaScore), escolha cap 2x (pontos) e um bench inteligente. Tudo integrado ao SnapTap.',
  },
  {
    title: 'Abrir pacotes',
    body: 'Você ganha fichas ao entrar na semana. Abra pacotes para revelar cartas com raridade baseada no rating HLTV — jogadores como donk podem vir Mythic.',
  },
  {
    title: 'Montar o time',
    body: 'Na aba Meu Time, arraste cartas para o campo e defina o capitão. Só vale jogador que está na sua coleção.',
  },
  {
    title: 'Rankings',
    body: 'Acompanhe ranking semanal, global e das suas ligas privadas. Resultados fecham no domingo.',
  },
  {
    title: 'Budget e pontos',
    body: 'Cada carta tem preço. Soma máxima 100. Capitão dobra pontos. Bench entra se alguém não jogar.',
  },
];

export function FantasyTutorialModal({ open, step, onStep, onClose, onFinish }) {
  if (!open) return null;
  const s = STEPS[step] || STEPS[0];
  const last = step >= STEPS.length - 1;

  return (
    <div className="fantasy-modal-backdrop fantasy-modal-backdrop--site" role="dialog" aria-modal="true">
      <div className="fantasy-tutorial fantasy-rpg-modal">
        <div className="fantasy-rpg-bubble">
          <div className="fantasy-rpg-portrait" aria-hidden>👤</div>
          <div>
            <p className="fantasy-rpg-label">Mentor SnapTap</p>
            <h3>{s.title}</h3>
            <p className="fantasy-rpg-body">{s.body}</p>
          </div>
        </div>
        <div className="fantasy-rpg-dots">
          {STEPS.map((_, i) => (
            <TrackedButton key={i} type="button" className={i === step ? 'active' : ''} onClick={() => onStep(i)} aria-label={`Passo ${i + 1}`} />
          ))}
        </div>
        <div className="fantasy-rpg-actions">
          {step > 0 && (
            <TrackedButton type="button" className="fantasy-ghost-btn" onClick={() => onStep(step - 1)}>Voltar</TrackedButton>
          )}
          {!last && (
            <TrackedButton type="button" className="fantasy-primary-btn" onClick={() => onStep(step + 1)}>Próximo</TrackedButton>
          )}
          {last && (
            <TrackedButton type="button" className="fantasy-primary-btn" onClick={onFinish}>Começar</TrackedButton>
          )}
          <TrackedButton type="button" className="fantasy-ghost-btn" onClick={onClose}>Fechar</TrackedButton>
        </div>
      </div>
    </div>
  );
}
