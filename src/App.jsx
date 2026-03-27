import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { ProgressModal } from './components/ProgressModal';
import { MissionsProgressModal } from './components/MissionsProgressModal';
import { MissionsFloatingMenu } from './components/MissionsFloatingMenu';
import ContactProfileModal from './components/ContactProfileModal';
import { saveMarketingContact } from './services/profileService';
import { TrackedButton } from './components/TrackedButton';
import {
  trackPageView,
  trackVipPageView,
  trackProfileView,
  trackRankingView,
  trackPugListView,
  trackServersView,
  trackPerformanceView,
  trackSquadView,
  enableAnalytics,
  setAnalyticsUser,
} from './utils/analytics';
import HomePage from './pages/HomePage';
import ServerListPage from './pages/ServerListPage';
import LoadoutPage from './pages/LoadoutPage';
import PugListPage from './pages/PugListPage';
import PugLobbyPage from './pages/PugLobbyPage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from './pages/RankingPage';
import SquadPage from './pages/SquadPage';
import PerformancePage from './pages/PerformancePage';
import VipPage from './pages/VipPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import GiveawayPage from './pages/GiveawayPage';
import InventoryPage from './pages/InventoryPage';
import WalletPage from './pages/WalletPage';
import FantasyPage from './pages/FantasyPage';
import FantasyLayout from './pages/fantasy/FantasyLayout';
import FantasyHomePage from './pages/fantasy/FantasyHomePage';
import FantasyTeamPage from './pages/fantasy/FantasyTeamPage';
import FantasyRankingPage from './pages/fantasy/FantasyRankingPage';
import FantasyIntegratedPage from './pages/FantasyIntegratedPage';
import WheelDashboard from './pages/admin/WheelDashboard';
import GiveawayItemsAdmin from './pages/admin/GiveawayItemsAdmin';
import AdminEndpoints from './pages/admin/AdminEndpoints';
import AdminAffiliates from './pages/admin/AdminAffiliates';
import AdminFantasy from './pages/admin/AdminFantasy';
import AdminWallet from './pages/admin/AdminWallet';
import AdminPoints from './pages/admin/AdminPoints';
import AdminWarmupRanking from './pages/admin/AdminWarmupRanking';
import AdminMissions from './pages/admin/AdminMissions';
import PromoBannerModal from './components/PromoBannerModal';
import AffiliateInviteModal from './components/AffiliateInviteModal';
import MissionsPage from './pages/MissionsPage';
import './index.css';

function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    const search = location.search || '';
    trackPageView(path + search);
    const isProfilePath =
      path === '/profile' ||
      path.startsWith('/profile/') ||
      path === '/perfil' ||
      path.startsWith('/perfil/');
    if (path === '/vip') trackVipPageView();
    else if (isProfilePath) trackProfileView();
    else if (path === '/ranking') trackRankingView();
    else if (path === '/pug') trackPugListView(search.includes('lobbyType=squad') ? 'squad' : 'pug');
    else if (path === '/servers') trackServersView();
    else if (path === '/performance') trackPerformanceView();
    else if (path === '/squad') trackSquadView();
  }, [location.pathname, location.search]);
  return null;
}

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('cookie-consent');
    if (stored === 'accepted') {
      enableAnalytics();
      setVisible(false);
    } else if (stored === 'rejected') {
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cookie-consent', 'accepted');
    }
    enableAnalytics();
    setVisible(false);
  };

  const reject = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cookie-consent', 'rejected');
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        padding: '12px 16px',
        background: 'rgba(15,23,42,0.96)',
        borderTop: '1px solid rgba(148,163,184,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '12px',
      }}
    >
      <div style={{ color: 'rgba(226,232,240,0.9)', maxWidth: 520 }}>
        Usamos cookies e tecnologias similares para estatísticas (Google Tag Manager / Analytics) e, quando configurado, anúncios
        (Meta Pixel), conforme nossa{' '}
        <a href="/privacidade" style={{ color: '#fbbf24' }}>
          Política de Privacidade
        </a>
        . Ao aceitar, você consente com esse uso.
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <TrackedButton
          type="button"
          onClick={reject}
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid rgba(148,163,184,0.7)',
            background: 'transparent',
            color: 'rgba(148,163,184,0.9)',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Recusar
        </TrackedButton>
        <TrackedButton
          type="button"
          onClick={accept}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid rgba(245,166,35,0.8)',
            background: 'linear-gradient(135deg,#f5a623,#c4851a)',
            color: '#0b1120',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Aceitar cookies
        </TrackedButton>
      </div>
    </div>
  );
}

function AppContent() {
  const auth = useAuth();
  const profile = useProfile({ consumeProgressQueues: true });
  useEffect(() => {
    const p = profile.profile;
    if (p && p.steamId) {
      setAnalyticsUser({
        steamId: p.steamId,
        displayName: p.displayName,
        isVip: p.isVip,
        level: Number(p.level) || 1,
        marketingEmail: p.marketingEmail || null,
        marketingFullName: p.marketingFullName || null,
        marketingPhone: p.marketingPhone || null,
      });
    } else {
      setAnalyticsUser(null);
    }
  }, [profile.profile]);

  const showMarketingGate =
    Boolean(auth.steamId)
    && !auth.loading
    && !profile.loading
    && profile.profile?.needsMarketingProfile === true;

  return (
    <>
      <AnalyticsTracker />
      <CookieBanner />
      {showMarketingGate && (
        <ContactProfileModal
          variant="blocking"
          initialValues={{
            fullName: profile.profile?.marketingFullName || '',
            email: profile.profile?.marketingEmail || '',
            phone: profile.profile?.marketingPhone || '',
          }}
          onSubmit={async (data) => {
            await saveMarketingContact(data);
            await profile.refresh();
          }}
        />
      )}
      <AffiliateInviteModal />
      <PromoBannerModal />
      <MissionsFloatingMenu steamId={auth.steamId} isVip={Boolean(profile.profile?.isVip)} />
      {profile.progressUpdate && (
        <ProgressModal update={profile.progressUpdate} onClose={profile.clearProgressUpdate} />
      )}
      {profile.missionsProgressUpdate && (
        <MissionsProgressModal
          update={profile.missionsProgressUpdate}
          onClose={profile.clearMissionsProgressUpdate}
          isVip={Boolean(profile.profile?.isVip)}
        />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/servers" element={<ServerListPage />} />
        <Route path="/loadout" element={<LoadoutPage />} />
        <Route path="/pug" element={<PugListPage />} />
        <Route path="/pug/:lobbyId" element={<PugLobbyPage />} />
        <Route path="/match/:matchId" element={<MatchDetailsPage />} />
        {/* Perfil (rotas em português e inglês, ambas mapeando para a mesma página) */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:steamId" element={<ProfilePage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/perfil/:steamId" element={<ProfilePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/squad" element={<SquadPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/vip" element={<VipPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/sobre" element={<AboutPage />} />
        <Route path="/contato" element={<ContactPage />} />
        <Route path="/giveaway" element={<GiveawayPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/fantasy" element={<FantasyIntegratedPage />} />
        <Route path="/fantasy-v2" element={<FantasyLayout />}>
          <Route index element={<FantasyHomePage />} />
          <Route path="time" element={<FantasyTeamPage />} />
          <Route path="ranking" element={<FantasyRankingPage />} />
        </Route>
        <Route path="/fantasy-legacy" element={<FantasyPage />} />
        <Route path="/admin/wheel" element={<WheelDashboard />} />
        <Route path="/admin/giveaway" element={<GiveawayItemsAdmin />} />
        <Route path="/admin/points" element={<AdminPoints />} />
        <Route path="/admin/warmup-ranking" element={<AdminWarmupRanking />} />
        <Route path="/admin/affiliates" element={<AdminAffiliates />} />
        <Route path="/admin/missions" element={<AdminMissions />} />
        <Route path="/admin/fantasy" element={<AdminFantasy />} />
        <Route path="/admin/wallet" element={<AdminWallet />} />
        <Route path="/admin/endpoints" element={<AdminEndpoints />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
