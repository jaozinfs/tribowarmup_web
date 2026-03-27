import { Link } from 'react-router-dom';
import { HamburgerNav } from '../components/HamburgerNav';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import '../index.css';

export default function ContactPage() {
  const auth = useAuth();
  const profile = useProfile();
  return (
    <div className="app">
      <div className="scanlines" />
      <div className="grid-bg" />
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">CONTATO</div>
            <div className="header-sub">FALE CONOSCO</div>
          </div>
        </div>
        <HamburgerNav activePath="/contato" auth={auth} profile={profile} returnTo="/contato" />
      </header>
      <main className="legal-main">
        <article className="legal-article">
          <h1 className="legal-h1">Contato</h1>
          <p>
              Para suporte, parcerias ou questões sobre privacidade e dados:
              <br /><br />

              📧 Email:{' '}
              <a href="mailto:contato@snaptap.com.br">
                contato@snaptap.com.br
              </a>
              <br />

              📸 Instagram:{' '}
              <a
                href="https://www.instagram.com/snaptapgg/"
                target="_blank"
                rel="noopener noreferrer"
              >
                @snaptagg
              </a>
            </p>
          <p className="legal-back">
            <Link to="/">← Voltar ao início</Link>
            {' · '}
            <Link to="/sobre">Sobre nós</Link>
          </p>
        </article>
      </main>
      <style>{`
        .legal-main {
          flex: 1;
          padding: 32px 20px 64px;
          max-width: 720px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }
        .legal-article {
          background: linear-gradient(135deg, #10121a 0%, #151820 100%);
          border: 1px solid rgba(245, 166, 35, 0.12);
          border-radius: 12px;
          padding: 28px 24px 32px;
          color: rgba(226, 232, 240, 0.92);
          font-size: 0.95rem;
          line-height: 1.65;
          box-shadow: 0 4px 24px rgba(0,0,0,0.25);
        }
        .legal-h1 {
          margin: 0 0 20px;
          font-family: var(--font-head);
          font-size: 1.5rem;
          letter-spacing: 0.08em;
          color: var(--gold, #f5a623);
        }
        .legal-article a { color: #fbbf24; text-decoration: underline; }
        .legal-back { margin-top: 28px; font-size: 0.9rem; }
        .legal-back a { color: #94a3b8; }
      `}</style>
    </div>
  );
}
