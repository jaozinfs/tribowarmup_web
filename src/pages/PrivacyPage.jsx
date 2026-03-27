import { Link } from 'react-router-dom';
import { HamburgerNav } from '../components/HamburgerNav';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import '../index.css';

export default function PrivacyPage() {
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
            <div className="header-title">PRIVACIDADE</div>
            <div className="header-sub">POLÍTICA DE DADOS</div>
          </div>
        </div>
        <HamburgerNav activePath="/privacidade" auth={auth} profile={profile} returnTo="/privacidade" />
      </header>
      <main className="legal-main">
        <article className="legal-article">
          <h1 className="legal-h1">Política de privacidade</h1>
          <p className="legal-updated">Última atualização: março de 2026</p>

          <p>
            O SnapTap (&quot;nós&quot;) respeita sua privacidade. Esta página descreve como tratamos dados quando você usa o site
            <strong> snaptap.com.br</strong>, faz login com a Steam, assina VIP ou interage com tags de análise e marketing.
          </p>

          <h2>1. Dados que coletamos</h2>
          <ul>
            <li>
              <strong>Conta Steam:</strong> identificador Steam (SteamID64), nome público e avatar fornecidos pela Valve ao autenticar.
            </li>
            <li>
              <strong>Dados de contato informados por você:</strong> nome, e-mail e telefone quando você preenche o cadastro no primeiro
              acesso ou edita no perfil. Usamos para suporte, comunicações operacionais e — com seu uso do site — medição de campanhas
              (Google Tag Manager / Google Analytics / Meta Pixel), conforme configurado nos nossos containers de tag.
            </li>
            <li>
              <strong>Dados técnicos:</strong> cookies de sessão para manter login; logs de servidor podem incluir IP e user-agent para
              segurança e diagnóstico.
            </li>
            <li>
              <strong>Pagamentos:</strong> dados de cobrança são processados pelo Stripe; não armazenamos número completo de cartão.
            </li>
          </ul>

          <h2>2. Base legal e consentimento</h2>
          <p>
            O uso de cookies e tags de estatística/marketing depende do banner de cookies: ao aceitar, você consente com o uso de
            ferramentas como GTM, GA4 e Meta Pixel conforme descrito aqui. Você pode recusar cookies não essenciais pelo banner.
          </p>

          <h2>3. Compartilhamento</h2>
          <p>
            Podemos enviar eventos e identificadores pseudonimizados ou fornecidos por você para fornecedores de análise e anúncios
            (Google, Meta), sempre no limite do necessário para as finalidades acima e das configurações ativas no seu navegador/conta.
          </p>

          <h2>4. Retenção</h2>
          <p>
            Mantemos dados de conta enquanto você usar o serviço ou conforme obrigação legal. Dados de marketing podem ser atualizados
            ou removidos quando você alterar o perfil ou solicitar exclusão.
          </p>

          <h2>5. Seus direitos (LGPD)</h2>
          <p>
            Você pode solicitar acesso, correção ou eliminação de dados pessoais, e revogar consentimentos quando aplicável. Entre em
            contato pelos canais da página <Link to="/contato">Contato</Link>.
          </p>

          <h2>6. Alterações</h2>
          <p>
            Podemos atualizar esta política; a data no topo indica a revisão vigente. O uso continuado do site após mudanças constitui
            ciência das alterações, salvo quando a lei exigir novo consentimento.
          </p>

          <p className="legal-back">
            <Link to="/">← Voltar ao início</Link>
            {' · '}
            <Link to="/sobre">Sobre nós</Link>
            {' · '}
            <Link to="/contato">Contato</Link>
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
          margin: 0 0 8px;
          font-family: var(--font-head);
          font-size: 1.5rem;
          letter-spacing: 0.08em;
          color: var(--gold, #f5a623);
        }
        .legal-updated {
          margin: 0 0 24px;
          font-size: 0.8rem;
          color: rgba(148, 163, 184, 0.9);
        }
        .legal-article h2 {
          margin: 28px 0 12px;
          font-size: 1.05rem;
          letter-spacing: 0.06em;
          color: #e2e8f0;
        }
        .legal-article ul { margin: 0 0 12px; padding-left: 1.25rem; }
        .legal-article li { margin-bottom: 8px; }
        .legal-article a { color: #fbbf24; text-decoration: underline; }
        .legal-back { margin-top: 32px; font-size: 0.9rem; }
        .legal-back a { color: #94a3b8; }
      `}</style>
    </div>
  );
}
