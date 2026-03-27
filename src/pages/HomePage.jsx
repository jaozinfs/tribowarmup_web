import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import { fetchSkins } from '../services/skinsService';
import { fetchOnlineSummary } from '../services/serverStatusService';
import './HomePage.css';
import { TrackedButton } from '../components/TrackedButton';

const FEATURED_SKINS = [
  { name: 'Dragon Lore', weapon: 'AWP', rarity: 'Covert', gradient: 'dragon', price: '$7,500+' },
  { name: 'Howl', weapon: 'M4A4', rarity: 'Contraband', gradient: 'howl', price: '$3,200+' },
  { name: 'Fire Serpent', weapon: 'AK-47', rarity: 'Covert', gradient: 'fire', price: '$1,800+' },
  { name: 'Medusa', weapon: 'AWP', rarity: 'Covert', gradient: 'medusa', price: '$2,400+' },
  { name: 'Blaze', weapon: 'Desert Eagle', rarity: 'Covert', gradient: 'blaze', price: '$500+' },
  { name: 'Asiimov', weapon: 'AWP', rarity: 'Covert', gradient: 'asiimov', price: '$120+' },
  { name: 'Vulcan', weapon: 'AK-47', rarity: 'Covert', gradient: 'vulcan', price: '$200+' },
  { name: 'Fade', weapon: 'Karambit', rarity: 'Covert', gradient: 'fade', price: '$2,800+' },
];

function flattenSkins(list) {
  if (!list) return [];
  if (Array.isArray(list)) return list;
  return Object.values(list).flat();
}

function findSkinImage(skinsData, featured) {
  if (!skinsData) return null;
  const match = findSkinFull(skinsData, featured);
  return match?.image || null;
}

function findSkinFull(skinsData, featured) {
  if (!skinsData) return null;
  const nameLower = (featured.searchName || featured.name || '').toLowerCase();
  const searchIn = featured.searchIn;
  if (searchIn === 'knives') {
    const knives = flattenSkins(skinsData.knives);
    return knives.find((s) => (s.name || '').toLowerCase().includes(nameLower)) || null;
  }
  if (searchIn === 'weapons') {
    const weapons = flattenSkins(skinsData.weapons);
    return weapons.find((s) => (s.name || '').toLowerCase().includes(nameLower)) || null;
  }
  const all = [...flattenSkins(skinsData.weapons), ...flattenSkins(skinsData.knives)];
  return all.find((s) => (s.name || '').toLowerCase().includes(nameLower)) || null;
}

const LOADOUT_SLOTS_CT = [
  { id: 'knife_ct', label: 'Faca CT', type: 'knife', slotKey: 'knife_ct' },
  { id: 'weapon_m4a1_silencer', label: 'M4A1-S', type: 'weapon', weaponId: 'weapon_m4a1_silencer', slotKey: null },
  { id: 'weapon_m4a1', label: 'M4A4', type: 'weapon', weaponId: 'weapon_m4a1', slotKey: null },
  { id: 'weapon_aug', label: 'AUG', type: 'weapon', weaponId: 'weapon_aug', slotKey: null },
  { id: 'weapon_awp_ct', label: 'AWP CT', type: 'weapon', weaponId: 'weapon_awp_ct', slotKey: null },
  { id: 'weapon_deagle', label: 'Desert Eagle', type: 'weapon', weaponId: 'weapon_deagle', slotKey: null },
];
const LOADOUT_SLOTS_T = [
  { id: 'knife_t', label: 'Faca T', type: 'knife', slotKey: 'knife_t' },
  { id: 'weapon_ak47', label: 'AK-47', type: 'weapon', weaponId: 'weapon_ak47', slotKey: null },
  { id: 'weapon_awp_t', label: 'AWP T', type: 'weapon', weaponId: 'weapon_awp_t', slotKey: null },
  { id: 'weapon_deagle', label: 'Desert Eagle', type: 'weapon', weaponId: 'weapon_deagle', slotKey: null },
];

const RARITY_TYPES = ['consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'covert', 'covert'];
const RARITY_LABELS = { consumer: 'Consumer', industrial: 'Industrial', milspec: 'Mil-Spec', restricted: 'Restricted', classified: 'Classified', covert: 'Covert', contraband: 'Contraband' };

function pickRandom(arr, n = 1) {
  if (!arr?.length) return n === 1 ? null : [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return n === 1 ? copy[0] : copy.slice(0, n);
}

const FALLBACK_ITEMS = [
  { name: 'P250 Sand Dune', rarity: 'Consumer', type: 'consumer', loadoutSlot: LOADOUT_SLOTS_CT[5] },
  { name: 'AWP Asiimov', rarity: 'Covert', type: 'covert', loadoutSlot: LOADOUT_SLOTS_CT[4] },
  { name: 'AK-47 Vulcan', rarity: 'Covert', type: 'covert', loadoutSlot: LOADOUT_SLOTS_T[1] },
  { name: 'Karambit Fade', rarity: 'Covert', type: 'covert', loadoutSlot: LOADOUT_SLOTS_CT[0] },
];

/** Apenas armas para o strip da caixa (lista nunca mostra faca; faca só no reveal ao final). */
const FALLBACK_STRIP_WEAPONS = [
  { name: 'P250 Sand Dune', rarity: 'Consumer', type: 'consumer', loadoutSlot: LOADOUT_SLOTS_CT[5] },
  { name: 'AWP Asiimov', rarity: 'Covert', type: 'covert', loadoutSlot: LOADOUT_SLOTS_CT[4] },
  { name: 'AK-47 Vulcan', rarity: 'Covert', type: 'covert', loadoutSlot: LOADOUT_SLOTS_T[1] },
  { name: 'M4A4 Howl', rarity: 'Covert', type: 'covert', loadoutSlot: LOADOUT_SLOTS_CT[1] },
];

const RARE_ITEM_IMAGE_URL = 'https://images.waxpeer.com/waxpeer-blogpost/how-to-get-a-knife-in-cs2-1737714924824.jpeg';

/** Ícone de item raro na roleta (medalha dourada com ?) — imagem em public/images/rare-item-icon.png */
const RARE_ITEM_ICON_URL = '/images/rare-item-icon.png';

const STICKY_ICONS = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  recursos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  skins: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.648 0-.627-.38-1.2-.38-1.886 0-.926.746-1.648 1.648-1.648 4.5 0 8.5-4 8.5-8.5C22 6.5 17.5 2 12 2z"/></svg>
  ),
  caixas: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  ),
  servidores: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/><line x1="10" y1="6" x2="10.01" y2="6"/><line x1="10" y1="18" x2="10.01" y2="18"/></svg>
  ),
  treino: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  ),
  performance: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
};

const HOME_SECTIONS = [
  { id: 'sec-hero', label: 'Início', icon: 'home' },
  { id: 'sec-recursos', label: 'Recursos', icon: 'recursos' },
  { id: 'sec-skins', label: 'Skins', icon: 'skins' },
  { id: 'sec-caixas', label: 'Caixas', icon: 'caixas' },
  { id: 'sec-servidores', label: 'Servidores', icon: 'servidores' },
  { id: 'sec-treino', label: 'Treino', icon: 'treino' },
  { id: 'sec-performance', label: 'Performance', icon: 'performance' },
];

function StickyHomeNav() {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState('sec-hero');
  const [pressingId, setPressingId] = useState(null);

  useEffect(() => {
    const heroEl = document.getElementById('sec-hero');
    if (!heroEl) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.15 },
    );
    obs.observe(heroEl);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const ids = HOME_SECTIONS.map((s) => s.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting);
        if (vis.length > 0) {
          vis.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveId(vis[0].target.id);
        }
      },
      { threshold: 0.2, rootMargin: '-80px 0px -40% 0px' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleClick = (id) => {
    setPressingId(id);
    setTimeout(() => setPressingId(null), 200);

    const el = document.getElementById(id);
    if (!el) return;
    const startY = window.scrollY;
    const targetY = el.getBoundingClientRect().top + startY - 70;
    const dist = targetY - startY;
    const duration = 700;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      window.scrollTo(0, startY + dist * ease);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <nav className={`home-sticky-nav${visible ? ' home-sticky-nav--visible' : ''}`}>
      <div className="home-sticky-nav-inner">
        {HOME_SECTIONS.map((s) => (
          <TrackedButton
            key={s.id}
            type="button"
            className={`home-sticky-nav-item${activeId === s.id ? ' home-sticky-nav-item--active' : ''}${pressingId === s.id ? ' home-sticky-nav-item--pressing' : ''}`}
            onClick={() => handleClick(s.id)}
          >
            <span className="home-sticky-nav-icon">{STICKY_ICONS[s.icon]}</span>
            <span className="home-sticky-nav-label">{s.label}</span>
          </TrackedButton>
        ))}
      </div>
    </nav>
  );
}

function HomeOnlineBanner() {
  const [summary, setSummary] = useState({ totalPlayersOnline: null, serverCount: 0 });

  useEffect(() => {
    const load = () => {
      fetchOnlineSummary()
        .then((data) => setSummary({ totalPlayersOnline: data.totalPlayersOnline ?? 0, serverCount: data.serverCount ?? 0 }))
        .catch(() => setSummary({ totalPlayersOnline: 0, serverCount: 0 }));
    };
    load();
    const interval = setInterval(load, 12_000);
    return () => clearInterval(interval);
  }, []);

  const total = summary.totalPlayersOnline ?? 0;
  const servers = summary.serverCount ?? 0;
  if (servers === 0 && total === 0) return null;

  return (
    <div className="home-online-banner" role="status" aria-live="polite">
      <span className="home-online-banner-dot" aria-hidden />
      <span className="home-online-banner-text">
        <strong>{total}</strong> {total === 1 ? 'usuário' : 'usuários'} online
        {servers > 0 && <span className="home-online-banner-servers"> em {servers} {servers === 1 ? 'servidor' : 'servidores'}</span>}
      </span>
    </div>
  );
}

const PERF_SLIDES = [
  {
    name: 'Mirage', map: 'de_mirage',
    heat: 'radial-gradient(circle 50px at 48% 52%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 35px at 28% 60%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 28px at 70% 35%, rgba(255,200,0,0.3), transparent 70%), radial-gradient(circle 20px at 42% 36%, rgba(200,255,0,0.2), transparent 70%)',
    insights: [
      { text: 'Morreu 7x no Mid', color: '#ef5350' },
      { text: '12 Kills A Site', color: '#4caf50' },
      { text: '3 Smokes Mid', color: '#42a5f5' },
    ],
  },
  {
    name: 'Dust 2', map: 'de_dust2',
    heat: 'radial-gradient(circle 55px at 30% 55%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 40px at 45% 45%, rgba(255,100,0,0.4), transparent 70%), radial-gradient(circle 30px at 65% 28%, rgba(255,180,0,0.35), transparent 70%)',
    insights: [
      { text: 'Morreu 9x Long A', color: '#ef5350' },
      { text: '15 Kills B Site', color: '#4caf50' },
      { text: '5 Flashes Mid', color: '#ab47bc' },
    ],
  },
  {
    name: 'Inferno', map: 'de_inferno',
    heat: 'radial-gradient(circle 50px at 60% 65%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 38px at 45% 45%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 30px at 30% 30%, rgba(255,200,0,0.3), transparent 70%)',
    insights: [
      { text: 'Morreu 6x Banana', color: '#ef5350' },
      { text: '8 Kills Bomb A', color: '#4caf50' },
      { text: '4 Molotovs B', color: '#ff7043' },
    ],
  },
  {
    name: 'Ancient', map: 'de_ancient',
    heat: 'radial-gradient(circle 48px at 50% 50%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 35px at 70% 55%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 28px at 30% 40%, rgba(255,200,0,0.3), transparent 70%)',
    insights: [
      { text: 'Morreu 5x no Mid', color: '#ef5350' },
      { text: '10 Kills B Site', color: '#4caf50' },
      { text: '2 Bomb Plants A', color: '#ffa726' },
    ],
  },
  {
    name: 'Nuke', map: 'de_nuke',
    heat: 'radial-gradient(circle 45px at 45% 50%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 35px at 70% 40%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 28px at 40% 35%, rgba(255,200,0,0.3), transparent 70%)',
    insights: [
      { text: 'Morreu 6x na Ramp', color: '#ef5350' },
      { text: '7 Kills Outside', color: '#4caf50' },
      { text: '3 HE Vents', color: '#ff7043' },
    ],
  },
  {
    name: 'Overpass', map: 'de_overpass',
    heat: 'radial-gradient(circle 50px at 55% 60%, rgba(255,30,0,0.5), transparent 70%), radial-gradient(circle 38px at 42% 42%, rgba(255,140,0,0.4), transparent 70%), radial-gradient(circle 30px at 30% 35%, rgba(255,200,0,0.3), transparent 70%)',
    insights: [
      { text: 'Morreu 8x B Short', color: '#ef5350' },
      { text: '11 Kills Connector', color: '#4caf50' },
      { text: '4 Smokes Monster', color: '#42a5f5' },
    ],
  },
];

const HERO_MODE_SLIDES = [
  {
    id: 'snaphack',
    badge: 'MODO SNAP HACK',
    title: ['SNAPHACK', 'ARENA'],
    description: 'Round a round com hacks controlados pelo host: low gravity, velocidade, munição infinita, invisibilidade e outros eventos táticos para treino agressivo e clutch.',
    bullets: ['Hacks por round controlados', 'Fluxo competitivo 5v5', 'Ambiente de treino avançado'],
    ctaLabel: 'VER SNAP HACK',
    ctaTo: '/pug?lobbyType=snaphack',
  },
  {
    id: 'missions',
    badge: 'BATTLE PASS · MISSÕES',
    title: ['MISSÕES', 'SEMANAIS'],
    description: 'Complete jogando. Progresso automático nas partidas. Resgate pontos e troque por recompensas reais (skins) em eventos/loja.',
    bullets: ['3 missões por semana', 'Progresso automático', 'VIP ganha 3x pontos'],
    ctaLabel: 'VER MINHAS MISSÕES',
    ctaTo: '/missions',
    showMissionsMock: true,
  },
  {
    id: 'snaparena',
    badge: 'MODO SNAP ARENA',
    title: ['SNAPARENA', 'ALLSTARS'],
    description: 'Formato Allstars com cartas por round e leitura tática ao vivo. Líderes escolhem efeitos no site e a execução entra no servidor no próximo round.',
    bullets: ['Cartas táticas por round', 'MR12 com picks profissionais', 'Formato inspirado em campeonato Allstars'],
    ctaLabel: 'JOGAR SNAPARENA',
    ctaTo: '/pug?lobbyType=snaparena',
  },
  {
    id: 'loadout',
    badge: 'LOADOUT PROFISSIONAL',
    title: ['SEU', 'LOADOUT PRO'],
    description: 'Monte seu loadout completo com agentes, música, stickers e chaveiro em uma tela única de loadout, com visualização instantânea e sync direto no servidor.',
    bullets: ['Agentes CT/TR: Cmdr. Mae + Rezan', 'Music Kit: Neck Deep + MVP', 'Stickers, chaveiro e slots por arma'],
    ctaLabel: 'CONFIGURAR LOADOUT',
    ctaTo: '/loadout',
    showMock: true,
  },
  {
    id: 'fantasy',
    badge: 'SNAPFANTASY CS2',
    title: ['FANTASY', 'COMPETITIVO'],
    description: 'Monte seu time com 5 pro players, escolha seu Tecnico, ganhe pontos que viram premios, participe de ligas privadas e receba o resultado oficial todo domingo.',
    bullets: ['Time titular + bench inteligente', 'Ligas privadas com convite', 'Fechamento semanal automático'],
    ctaLabel: 'MONTAR TIME FANTASY',
    ctaTo: '/fantasy',
  },
];

const MISSIONS_MOCK = [
  { name: 'Fazer 20 HS', desc: 'Consiga 20 headshots em partidas PUG.', progress: 15, target: 20, reward: 100 },
  { name: 'Dar 3000 de dano', desc: 'Cause 3000 de dano total.', progress: 1860, target: 3000, reward: 140 },
  { name: 'Ganhar 5 partidas', desc: 'Vença 5 partidas no MIX.', progress: 2, target: 5, reward: 180 },
  { name: 'Jogar 10 rounds', desc: 'Jogue 10 rounds no total.', progress: 7, target: 10, reward: 80 },
  { name: 'Fazer 15 kills em uma partida', desc: 'Faça 15 eliminações em uma única partida.', progress: 12, target: 15, reward: 160 },
];

function pct(a, b) {
  const x = Math.max(0, Number(a) || 0);
  const y = Math.max(1, Number(b) || 1);
  return Math.max(0, Math.min(100, Math.round((x / y) * 100)));
}

function PerfCarousel() {
  const scrollRef = useRef(null);
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const scrollTo = useCallback((idx) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = 240 + 20;
    const center = el.clientWidth / 2 - cardW / 2;
    el.scrollTo({ left: idx * cardW - center, behavior: 'smooth' });
    setActive(idx);
  }, []);

  const startAutoplay = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % PERF_SLIDES.length;
        scrollTo(next);
        return next;
      });
    }, 4000);
  }, [scrollTo]);

  useEffect(() => {
    startAutoplay();
    return () => clearInterval(timerRef.current);
  }, [startAutoplay]);

  const handleDotClick = (i) => {
    scrollTo(i);
    startAutoplay();
  };

  return (
    <div className="home-perf-carousel-wrap">
      <div className="home-perf-carousel" ref={scrollRef}>
        {PERF_SLIDES.map((slide, i) => (
          <div key={slide.map} className={`home-perf-slide${i === active ? ' home-perf-slide--active' : ''}`}>
            <div className="home-perf-slide-radar">
              <img
                src={`/images/radars/${slide.map}/radar.png`}
                alt={slide.name}
                className="home-perf-slide-img"
                draggable={false}
                loading="lazy"
              />
              <div className="home-perf-slide-heat" style={{ background: slide.heat }} />
              <span className="home-perf-slide-map-label">{slide.name}</span>
            </div>
            <div className="home-perf-slide-info">
              {slide.insights.map((ins, j) => (
                <span
                  key={j}
                  className="home-perf-slide-insight"
                  style={{ color: ins.color, borderColor: ins.color + '30' }}
                >
                  {ins.text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="home-perf-dots">
        {PERF_SLIDES.map((_, i) => (
          <TrackedButton
            key={i}
            type="button"
            className={`home-perf-dot${i === active ? ' home-perf-dot--active' : ''}`}
            onClick={() => handleDotClick(i)}
            aria-label={PERF_SLIDES[i].name}
          />
        ))}
      </div>
    </div>
  );
}

function buildRandomCaseStrip(skinsData) {
  const weapons = flattenSkins(skinsData?.weapons ?? []).filter((s) => s?.name && s?.image);
  const knives = flattenSkins(skinsData?.knives ?? []).filter((s) => s?.name && s?.image);
  const weaponSlots = [...LOADOUT_SLOTS_CT.filter((s) => s.type === 'weapon'), ...LOADOUT_SLOTS_T.filter((s) => s.type === 'weapon')];
  const knifeSlots = [LOADOUT_SLOTS_CT[0], LOADOUT_SLOTS_T[0]];
  const stripLen = 14;
  const isKnifeWin = Math.random() < 0.2 && knives.length > 0;
  const winnerIdx = 7 + Math.floor(Math.random() * 3);

  // Knife only appears at the end in the popup; strip shows only weapons (no knives in the list)
  const knifeWin = isKnifeWin ? { skin: pickRandom(knives), loadoutSlot: pickRandom(knifeSlots) } : null;

  const toItem = (skin, loadoutSlot) => {
    const type = pickRandom(RARITY_TYPES);
    const rarity = RARITY_LABELS[type] || 'Covert';
    return {
      name: skin?.name || 'Skin',
      rarity,
      type,
      image: skin?.image || null,
      loadoutSlot: loadoutSlot || LOADOUT_SLOTS_CT[5],
      skinObject: skin || null,
    };
  };

  const items = [];
  for (let i = 0; i < stripLen; i++) {
    const isRareSlot = !!knifeWin && i === winnerIdx;
    if (isRareSlot) {
      items.push({
        key: 'strip-rare',
        name: 'Item Raro',
        rarity: 'Contraband',
        type: 'contraband',
        image: null,
        loadoutSlot: knifeWin.loadoutSlot,
        skinObject: null,
        isKnife: true,
        isRareSlot: true,
      });
      continue;
    }
    const skin = weapons.length ? pickRandom(weapons) : null;
    const loadoutSlot = skin ? pickRandom(weaponSlots) : null;
    const fallback = FALLBACK_STRIP_WEAPONS[i % FALLBACK_STRIP_WEAPONS.length];
    const slot = loadoutSlot || fallback?.loadoutSlot || LOADOUT_SLOTS_CT[5];
    items.push({
      key: `strip-${i}`,
      ...toItem(skin, loadoutSlot),
      name: (skin?.name || fallback?.name) || 'Skin',
      loadoutSlot: slot,
      isKnife: false,
      isRareSlot: false,
    });
  }

  return { items, winnerIndex: winnerIdx, knifeWin };
}

export default function HomePage() {
  const auth = useAuth();
  const profile = useProfile();
  const carouselRef = useRef(null);
  const caseStripRef = useRef(null);
  const dragState = useRef({ down: false, startX: 0, scrollLeft: 0 });
  const [skinsData, setSkinsData] = useState(null);
  const [caseState, setCaseState] = useState({ opening: false, won: null, wonPhase: null, currentStrip: null, currentWinnerIndex: 0 });
  const caseAnimationRef = useRef(null);
  const heroTimerRef = useRef(null);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchSkins()
      .then((data) => { if (!cancelled) setSkinsData(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Strip inicial com imagens assim que skins carregam (evita caixa vazia ao abrir o site)
  useEffect(() => {
    if (!skinsData) return;
    setCaseState((prev) => {
      if (prev.currentStrip != null) return prev;
      const { items } = buildRandomCaseStrip(skinsData);
      return { ...prev, currentStrip: items };
    });
  }, [skinsData]);

  // Faca: fase "item raro" dourado -> depois revela a faca
  useEffect(() => {
    if (caseState.wonPhase !== 'rare' || !caseState.won?.isKnife) return;
    const t = setTimeout(() => setCaseState((prev) => ({ ...prev, wonPhase: 'reveal' })), 1800);
    return () => clearTimeout(t);
  }, [caseState.wonPhase, caseState.won?.isKnife]);

  const startHeroAutoplay = useCallback(() => {
    clearInterval(heroTimerRef.current);
    heroTimerRef.current = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % HERO_MODE_SLIDES.length);
    }, 6000);
  }, []);

  useEffect(() => {
    startHeroAutoplay();
    return () => clearInterval(heroTimerRef.current);
  }, [startHeroAutoplay]);

  const scrollCarousel = (dir) => {
    const el = carouselRef.current;
    if (!el) return;
    const distance = 300 * dir;
    const duration = 500;
    const start = el.scrollLeft;
    let startTime = null;
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      el.scrollLeft = start + distance * ease(progress);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const goHero = (dir) => {
    setHeroSlideIndex((prev) => {
      const len = HERO_MODE_SLIDES.length;
      const next = (prev + dir + len) % len;
      return next;
    });
    startHeroAutoplay();
  };

  const onDragStart = (e) => {
    const el = carouselRef.current;
    if (!el) return;
    dragState.current = { down: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };

  const onDragEnd = () => {
    const el = carouselRef.current;
    if (!el) return;
    dragState.current.down = false;
    el.style.cursor = '';
    el.style.userSelect = '';
  };

  const onDragMove = (e) => {
    if (!dragState.current.down) return;
    e.preventDefault();
    const el = carouselRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };

  const openCase = () => {
    if (caseState.opening) return;
    const { items: stripItems, winnerIndex: winIdx, knifeWin } = buildRandomCaseStrip(skinsData);
    caseAnimationRef.current = { stripItems, winIdx, knifeWin };
    setCaseState({ opening: true, won: null, currentStrip: stripItems, currentWinnerIndex: winIdx });
  };

  useEffect(() => {
    if (!caseState.opening || !caseState.currentStrip || !caseStripRef.current) return;
    const strip = caseStripRef.current;
    const { stripItems, winIdx } = caseAnimationRef.current || { stripItems: caseState.currentStrip, winIdx: caseState.currentWinnerIndex };
    const itemW = 140;
    const gap = 12;
    const itemTotal = itemW + gap;
    const targetX = (stripItems.length * 2 + winIdx) * itemTotal;
    const duration = 4500;
    strip.style.willChange = 'transform';
    strip.style.transform = 'translateX(0)';
    let startTime = null;
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      strip.style.transform = `translate3d(${-targetX * easeOut(progress)}px, 0, 0)`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        strip.style.willChange = 'auto';
        const { knifeWin } = caseAnimationRef.current || {};
        if (knifeWin?.skin) {
          const type = pickRandom(RARITY_TYPES);
          setCaseState((prev) => ({
            ...prev,
            opening: false,
            won: {
              key: 'knife-won',
              name: knifeWin.skin.name,
              rarity: RARITY_LABELS[type] || 'Covert',
              type,
              image: null,
              loadoutSlot: knifeWin.loadoutSlot,
              skinObject: knifeWin.skin,
              isKnife: true,
            },
            wonPhase: 'rare',
          }));
        } else {
          const wonItem = stripItems[winIdx];
          setCaseState((prev) => ({
            ...prev,
            opening: false,
            won: {
              ...wonItem,
              loadoutSlot: wonItem.loadoutSlot,
              skinObject: wonItem.skinObject || null,
              isKnife: false,
            },
            wonPhase: null,
          }));
        }
      }
    };
    const t = requestAnimationFrame(step);
    return () => cancelAnimationFrame(t);
  }, [caseState.opening, caseState.currentStrip]);

  const caseItemsWithImages = () => {
    const strip =
      caseState.currentStrip ||
      Array.from({ length: 14 }, (_, i) => ({
        ...FALLBACK_ITEMS[i % FALLBACK_ITEMS.length],
        key: `fb-${i}`,
        image: null,
        skinObject: null,
        isRareSlot: false,
      }));
    const items = [];
    for (let r = 0; r < 6; r++) {
      strip.forEach((item, i) => {
        const img = item.isRareSlot ? null : (item.image || findSkinImage(skinsData, { name: item.name }));
        items.push({ ...item, image: img, key: `${r}-${i}-${item.key}` });
      });
    }
    return items;
  };

  return (
    <div className="app home-page">
      <div className="scanlines" />
      <div className="grid-bg" />

      <header className="header home-header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">SnapTap.com.br</div>
            <div className="header-sub">TREINO · LOADOUT · MIX · SQUAD</div>
          </div>
        </div>
        <HamburgerNav activePath="/" auth={auth} profile={profile} returnTo="/" />
      </header>

      <StickyHomeNav />

      <main className="home-main">
        <HomeOnlineBanner />
        {/* ── Hero ── */}
        <section id="sec-hero" className="home-hero">
          <div className="home-hero-glow" />
          <div className="home-hero-mode-carousel" role="region" aria-live="polite">
            <div className="home-hero-mode-top">
              <div className="home-hero-mode-indicator">
                <span className="home-hero-mode-indicator-label">DESTAQUE</span>
                <span className="home-hero-mode-indicator-num">{heroSlideIndex + 1}/{HERO_MODE_SLIDES.length}</span>
              </div>
            </div>
            <TrackedButton type="button" className="home-hero-arrow home-hero-arrow--left" onClick={() => goHero(-1)} aria-label="Anterior">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M15 18l-6-6 6-6"/></svg>
            </TrackedButton>
            <TrackedButton type="button" className="home-hero-arrow home-hero-arrow--right" onClick={() => goHero(1)} aria-label="Próximo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M9 18l6-6-6-6"/></svg>
            </TrackedButton>
            {HERO_MODE_SLIDES.map((slide, idx) => {
              const active = idx === heroSlideIndex;
              return (
                <article key={slide.id} className={`home-hero-mode-slide${active ? ' home-hero-mode-slide--active' : ''}`} aria-hidden={!active}>
                  <span className="home-hero-mode-pill">{slide.badge}</span>
                  <h1 className="home-hero-title">
                    {slide.title[0]}<br /><span className="home-hero-accent">{slide.title[1]}</span>
                  </h1>
                  <p className="home-hero-sub">{slide.description}</p>
                  <div className="home-hero-mode-bullets">
                    {slide.bullets.map((bullet) => (
                      <span key={bullet} className="home-hero-mode-bullet">{bullet}</span>
                    ))}
                  </div>
                  {slide.showMissionsMock && (
                    <div className="home-hero-missions-mock" aria-label="Exemplos de missões">
                      <div className="home-hero-missions-mock-header">
                        <span className="home-hero-missions-mock-title">SEU QUADRO DE MISSÕES</span>
                        <span className="home-hero-missions-mock-vip">VIP ×3</span>
                      </div>
                      <div className="home-hero-missions-mock-grid">
                        {MISSIONS_MOCK.slice(0, 4).map((m) => {
                          const p = pct(m.progress, m.target);
                          return (
                            <div key={m.name} className={`home-hero-mission-mini${p >= 100 ? ' home-hero-mission-mini--done' : ''}`}>
                              <div className="home-hero-mission-mini-top">
                                <span className="home-hero-mission-mini-name">{m.name}</span>
                                <span className="home-hero-mission-mini-reward">+{m.reward}</span>
                              </div>
                              <div className="home-hero-mission-mini-bar">
                                <div className="home-hero-mission-mini-bar-fill" style={{ width: `${p}%` }} />
                              </div>
                              <div className="home-hero-mission-mini-meta">
                                <span>{m.progress}/{m.target}</span>
                                <span className="home-hero-mission-mini-vip">VIP: +{m.reward * 3}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {slide.showMock && (
                    <div className="home-hero-loadout-mock">
                      <div className="home-hero-loadout-mock-header">PREVIEW LOADOUT (INVENTARIO / MUSIC KIT / SKINS LAB)</div>
                      <div className="home-hero-loadout-tabs">
                        <span className="home-hero-loadout-tab home-hero-loadout-tab--active">Inventario</span>
                        <span className="home-hero-loadout-tab">Kit de musicas</span>
                        <span className="home-hero-loadout-tab">Skins Lab</span>
                      </div>
                      <div className="home-hero-loadout-side">
                        <span className="home-hero-loadout-side-card home-hero-loadout-side-card--ct">CT - Contra-Terrorista</span>
                        <span className="home-hero-loadout-side-card home-hero-loadout-side-card--t">TR - Terrorista</span>
                      </div>
                      <div className="home-hero-loadout-mock-grid">
                        <div className="home-hero-loadout-chip">Faca CT: Skeleton | Doppler</div>
                        <div className="home-hero-loadout-chip">Luvas CT: Crimson Kimono</div>
                        <div className="home-hero-loadout-chip">M4A4: Asiimov</div>
                        <div className="home-hero-loadout-chip">AWP CT: Printstream</div>
                        <div className="home-hero-loadout-chip">AK-47: Gold Arabesque</div>
                        <div className="home-hero-loadout-chip">Music Kit MVP: Neck Deep</div>
                        <div className="home-hero-loadout-chip">Agent CT: Cmdr. Mae</div>
                        <div className="home-hero-loadout-chip">Agent TR: Rezan</div>
                        <div className="home-hero-loadout-chip">Skins Lab: Sticker + Chaveiro</div>
                      </div>
                    </div>
                  )}
                  <div className="home-hero-ctas">
                    <Link to={slide.ctaTo} className="home-btn home-btn-primary">
                      <span className="home-btn-icon">▶</span> {slide.ctaLabel}
                    </Link>
                    <Link to={slide.id === 'missions' ? '/vip' : '/servers'} className="home-btn home-btn-glass">
                      {slide.id === 'missions' ? 'VIRAR VIP (3x)' : 'VER SERVIDORES'}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          {heroSlideIndex === 0 ? (
            <div className="home-hero-stats">
              <div className="home-stat">
                <span className="home-stat-num">128</span>
                <span className="home-stat-label">TICK RATE</span>
              </div>
              <div className="home-stat-sep" />
              <div className="home-stat">
                <span className="home-stat-num">&lt;15ms</span>
                <span className="home-stat-label">LATÊNCIA</span>
              </div>
              <div className="home-stat-sep" />
              <div className="home-stat">
                <span className="home-stat-num">5v5</span>
                <span className="home-stat-label">MIX & SQUAD</span>
              </div>
            </div>
          ) : null}
        </section>

        {/* ── Features ── */}
        <section id="sec-recursos" className="home-features">
          <div className="home-features-inner">
            <h2 className="home-section-label">RECURSOS EXCLUSIVOS</h2>
            <p className="home-section-desc">Para melhorar seu jogo e sua experiência</p>
            <div className="home-features-grid">
              <Link to="/loadout" className="hf-card">
                <div className="hf-card-glow hf-glow-gold" />
                <div className="hf-icon-wrap hf-icon-gold">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </div>
                <h3>CONFIGURAÇÃO DE LOADOUT</h3>
                <p>Personalize armas e skins do seu jeito. Acesso às skins do CS2 e loadout salvo para todos os servidores.</p>
                <span className="hf-link">Configurar →</span>
              </Link>
              <Link to="/servers" className="hf-card">
                <div className="hf-card-glow hf-glow-green" />
                <div className="hf-icon-wrap hf-icon-green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <h3>SERVIDORES RÁPIDOS</h3>
                <p>Servidores 128 tick com baixa latência e estabilidade. Conecte em um clique direto pelo Steam.</p>
                <span className="hf-link">Ver servidores →</span>
              </Link>
              <Link to="/pug" className="hf-card">
                <div className="hf-card-glow hf-glow-blue" />
                <div className="hf-icon-wrap hf-icon-blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3>MIX & SQUAD</h3>
                <p>PUG solo ou partidas Squad com seu time. Crie lobbies 5v5, ranking separado: nível individual (PUG) e ranking de times (Squad).</p>
                <span className="hf-link">Entrar no MIX →</span>
              </Link>
              <Link to="/fantasy" className="hf-card">
                <div className="hf-card-glow hf-glow-blue" />
                <div className="hf-icon-wrap hf-icon-blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l7 4v6c0 5-3.5 8-7 8s-7-3-7-8V7l7-4z"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <h3>SNAPFANTASY CS2</h3>
                <p>Cartola de CS2 com dados de pro players, capitão 2x, ranking semanal e ligas privadas entre amigos.</p>
                <span className="hf-link">Montar time →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Skins showcase ── */}
        <section id="sec-skins" className="home-skins">
          <div className="home-skins-bg" />
          <div className="home-skins-inner">
            <div className="home-skins-header">
              <div>
                <h2 className="home-skins-label">GERENCIE SUAS SKINS</h2>
                <h3 className="home-skins-title">Acesso a todas as skins do CS2</h3>
                <p className="home-skins-sub">
                  Personalize seu jogo do seu jeito. Exiba suas skins mais raras para a comunidade e leve seu estilo para todos os servidores.
                </p>
              </div>
              <div className="home-carousel-nav">
                <TrackedButton type="button" className="home-carousel-btn" onClick={() => scrollCarousel(-1)} aria-label="Anterior">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </TrackedButton>
                <TrackedButton type="button" className="home-carousel-btn" onClick={() => scrollCarousel(1)} aria-label="Próximo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </TrackedButton>
              </div>
            </div>
            <div
              className="home-skins-carousel"
              ref={carouselRef}
              onMouseDown={onDragStart}
              onMouseLeave={onDragEnd}
              onMouseUp={onDragEnd}
              onMouseMove={onDragMove}
            >
              {FEATURED_SKINS.map((skin, i) => {
                const imageUrl = findSkinImage(skinsData, skin);
                return (
                  <div key={i} className={`home-skin-card home-skin-card--${skin.gradient}`}>
                    {imageUrl && (
                      <div className="home-skin-card-img-wrap">
                        <img
                          src={imageUrl}
                          alt={skin.name}
                          className="home-skin-card-img"
                          loading="lazy"
                          draggable={false}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="home-skin-card-overlay" />
                    <span className="home-skin-rarity">{skin.rarity}</span>
                    <div className="home-skin-info">
                      <span className="home-skin-weapon">{skin.weapon}</span>
                      <span className="home-skin-name">{skin.name}</span>
                      <span className="home-skin-price">{skin.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="home-skins-footer">
              <Link to="/loadout" className="home-btn home-btn-primary">EXPLORAR COLEÇÃO DE SKINS</Link>
            </div>
          </div>
        </section>

        {/* ── Loadout em tempo real ── */}
        <section id="sec-loadout-realtime" className="home-loadout-realtime">
          <div className="home-loadout-realtime-bg" />
          <div className="home-loadout-realtime-inner">
            <h2 className="home-loadout-realtime-label">LOADOUT EM TEMPO REAL</h2>
            <p className="home-loadout-realtime-lead">
            Troque suas skins e veja a mudança acontecer instantaneamente dentro do jogo.
            </p>
            <p className="home-loadout-realtime-sub">
            No SnapTap, você pode testar diferentes skins sem precisar reconectar. Alterou no site? Na próxima rodada ou no próximo respawn sua nova skin já estará equipada.

Isso permite jogar um round com cada skin e descobrir qual combina mais com você — tudo de forma rápida e fluida.

Seu loadout é sincronizado automaticamente em todos os servidores SnapTap.  </p>
            <div className="home-loadout-realtime-gallery">
              <div className="home-loadout-realtime-step">
                <div className="home-loadout-realtime-img-wrap">
                  <img src="/images/loadout-step1-ingame.png" alt="Skin atual no jogo" className="home-loadout-realtime-img" />
                </div>
                <span className="home-loadout-realtime-step-label">1. Jogando com sua skin</span>
              </div>
              <div className="home-loadout-realtime-arrow" aria-hidden="true" />
              <div className="home-loadout-realtime-step">
                <div className="home-loadout-realtime-img-wrap">
                  <img src="/images/loadout-step2-website.png" alt="Trocando skin no site" className="home-loadout-realtime-img" />
                </div>
                <span className="home-loadout-realtime-step-label">2. Troca no site</span>
              </div>
              <div className="home-loadout-realtime-arrow" aria-hidden="true" />
              <div className="home-loadout-realtime-step">
                <div className="home-loadout-realtime-img-wrap">
                  <img src="/images/loadout-step3-newskin.png" alt="Nova skin no jogo" className="home-loadout-realtime-img" />
                </div>
                <span className="home-loadout-realtime-step-label">3. Nova skin no jogo!</span>
              </div>
            </div>
            <Link to="/loadout" className="home-btn home-btn-primary home-loadout-realtime-cta">CONFIGURAR LOADOUT</Link>
          </div>
        </section>

        {/* ── Case opening ── */}
        <section id="sec-caixas" className="home-case">
          <div className="home-case-bg" />
          <div className="home-case-inner">
            <h2 className="home-case-label">ABERTURA DE CAIXAS</h2>
            <h3 className="home-case-title">Experimente a emoção do CS2</h3>
            <p className="home-case-desc">
              Abra uma caixa e veja itens raros passando. Uma prévia da experiência de abertura de cases no Counter-Strike 2.
            </p>
            <div className="home-case-viewport">
              <div className="home-case-center-line" />
              <div className="home-case-strip" ref={caseStripRef}>
                {caseItemsWithImages().map((item) => (
                  <div key={item.key} className={`home-case-item home-case-item--${item.type} ${item.isRareSlot ? 'home-case-item--rare-slot' : ''}`}>
                    <div className="home-case-item-img-wrap">
                      {item.isRareSlot ? (
                        <div className="home-case-item-rare-icon" aria-label="Item raro">
                          <img src={RARE_ITEM_ICON_URL} alt="Item raro" className="home-case-rare-icon-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList?.add('visible'); }} />
                          <span className="home-case-rare-icon-fallback" aria-hidden>?</span>
                        </div>
                      ) : item.image ? (
                        <img src={item.image} alt={item.name} draggable={false} />
                      ) : (
                        <div className="home-case-item-placeholder" />
                      )}
                    </div>
                    <span className="home-case-item-rarity">{item.rarity}</span>
                    <span className="home-case-item-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="home-case-actions">
              <TrackedButton
                type="button"
                className="home-btn home-btn-primary home-case-btn"
                onClick={openCase}
                disabled={caseState.opening}
              >
                {caseState.opening ? 'ABRINDO...' : 'ABRIR CAIXA'}
              </TrackedButton>
            </div>
            {caseState.won && (
              <div className="home-case-won-block">
                {caseState.won.isKnife && caseState.wonPhase === 'rare' ? (
                  <div className="home-case-rare-reveal">
                    <img
                      src={RARE_ITEM_IMAGE_URL}
                      alt="Item raro"
                      className="home-case-rare-image"
                    />
                    <span className="home-case-rare-label">ITEM RARO</span>
                    <span className="home-case-rare-sublabel">Faca detectada...</span>
                  </div>
                ) : (
                  <div className="home-case-won">
                    <span className="home-case-won-label">VOCÊ GANHOU</span>
                    {caseState.won.isKnife && caseState.wonPhase === 'reveal' && (
                      <>
                        <span className="home-case-won-knife-badge">FACA</span>
                        {caseState.won.skinObject?.image && (
                          <div className="home-case-won-knife-img-wrap">
                            <img src={caseState.won.skinObject.image} alt={caseState.won.name} />
                          </div>
                        )}
                      </>
                    )}
                    <span className="home-case-won-name">{caseState.won.name}</span>
                    <span className="home-case-won-rarity">{caseState.won.rarity}</span>
                  </div>
                )}
                {(caseState.wonPhase === 'reveal' || !caseState.won?.isKnife) && (
                  <div className="home-case-won-actions">
                    <Link
                      to="/loadout"
                      state={{
                        openSlot: caseState.won.loadoutSlot,
                        preselectSkin: caseState.won.skinObject || undefined,
                      }}
                      className="home-btn home-btn-add-loadout"
                    >
                      <span className="home-btn-add-icon">+</span>
                      ADICIONAR AO LOADOUT
                    </Link>
                    <TrackedButton
                      type="button"
                      className="home-btn home-btn-glass"
                      onClick={() => setCaseState((s) => ({ ...s, won: null, wonPhase: null }))}
                    >
                      FECHAR
                    </TrackedButton>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Showcase panels ── */}
        <section id="sec-servidores" className="home-showcase">
          <div className="home-showcase-row home-showcase-reverse">
            <div className="home-sc-visual home-sc-visual--servers">
              <div className="home-sc-mockup">
                <div className="home-sc-mock-server">
                  <div className="home-sc-mock-row"><span className="mock-dot mock-green" /><span className="mock-name">Retake Dust2</span><span className="mock-map">de_dust2</span><span className="mock-players">8/10</span></div>
                  <div className="home-sc-top3">
                    <span className="home-sc-top3-label">TOP 3 KILLS</span>
                    <ol className="home-sc-top3-list">
                      <li className="home-sc-top3-item home-sc-top3-item--1"><span className="home-sc-top3-rank">🏆</span><span className="home-sc-top3-name">s1mple</span><span className="home-sc-top3-kills">24 kills</span></li>
                      <li className="home-sc-top3-item home-sc-top3-item--2"><span className="home-sc-top3-rank">#2</span><span className="home-sc-top3-name">ZywOo</span><span className="home-sc-top3-kills">19 kills</span></li>
                      <li className="home-sc-top3-item home-sc-top3-item--3"><span className="home-sc-top3-rank">#3</span><span className="home-sc-top3-name">NiKo</span><span className="home-sc-top3-kills">17 kills</span></li>
                    </ol>
                  </div>
                </div>
                <div className="home-sc-mock-row"><span className="mock-dot mock-green" /><span className="mock-name">Retake Mirage</span><span className="mock-map">de_mirage</span><span className="mock-players">6/10</span></div>
                <div className="home-sc-mock-row"><span className="mock-dot mock-yellow" /><span className="mock-name">DM FFA</span><span className="mock-map">de_inferno</span><span className="mock-players">18/20</span></div>
                <div className="home-sc-mock-row"><span className="mock-dot mock-green" /><span className="mock-name">Arena 1v1</span><span className="mock-map">am_plain</span><span className="mock-players">2/10</span></div>
              </div>
            </div>
            <div className="home-sc-content">
              <span className="home-sc-badge home-sc-badge--green">AO VIVO</span>
              <h2>SERVIDORES AO VIVO</h2>
              <p>Lista em tempo real com ping, jogadores e mapa. Conecte direto pelo Steam em um clique. Servidores 128 tick otimizados para treino e diversão.</p>
              <Link to="/servers" className="home-btn home-btn-primary">VER SERVIDORES</Link>
            </div>
          </div>

          <div className="home-showcase-row">
            <div className="home-sc-visual home-sc-visual--mix">
              <div className="home-sc-arena">
                <div className="home-sc-team home-sc-team--a">
                  <span className="home-sc-team-label">TEAM A</span>
                  <div className="home-sc-slot home-sc-slot--filled" /><div className="home-sc-slot home-sc-slot--filled" /><div className="home-sc-slot home-sc-slot--filled" /><div className="home-sc-slot home-sc-slot--filled" /><div className="home-sc-slot home-sc-slot--empty" />
                </div>
                <span className="home-sc-vs">VS</span>
                <div className="home-sc-team home-sc-team--b">
                  <span className="home-sc-team-label">TEAM B</span>
                  <div className="home-sc-slot home-sc-slot--filled" /><div className="home-sc-slot home-sc-slot--filled" /><div className="home-sc-slot home-sc-slot--filled" /><div className="home-sc-slot home-sc-slot--empty" /><div className="home-sc-slot home-sc-slot--empty" />
                </div>
              </div>
            </div>
            <div className="home-sc-content">
              <span className="home-sc-badge home-sc-badge--blue">COMPETITIVO</span>
              <h2>PRONTO PARA O MIX?</h2>
              <p>Jogue PUG solo ou monte seu Squad e dispute o ranking de times. Entre em uma sala ou crie a sua — lobby em tempo real, 5v5 e veto de mapas.</p>
              <Link to="/pug" className="home-btn home-btn-glass">ENTRAR NO MIX</Link>
            </div>
          </div>
        </section>

        {/* ── Play Like a Pro — apenas vídeos com gameplay (sem pessoas, sem marca) ── */}
        <section id="sec-treino" className="home-pro-showcase">
          <div className="home-pro-hero">
            <video
              className="home-pro-hero-video"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="https://refrag.gg/images/challenger.webm" type="video/webm" />
            </video>
            <div className="home-pro-hero-fallback" />
            <div className="home-pro-hero-overlay" />
            <div className="home-pro-hero-content">
              <span className="home-pro-hero-badge">TREINO PROFISSIONAL</span>
              <h2 className="home-pro-hero-title">PLAY LIKE A PRO</h2>
              <p className="home-pro-hero-sub">Ambiente competitivo. Servidores 128 tick. MIX (PUG e Squad) com gerenciamento de time.</p>
            </div>
          </div>

          {/* challenger.webm — gameplay aim/crossfire */}
          <div className="home-pro-video-row">
            <div className="home-pro-video-wrap">
              <video className="home-pro-video" autoPlay muted loop playsInline>
                <source src="https://refrag.gg/images/challenger.webm" type="video/webm" />
              </video>
            </div>
            <div className="home-pro-video-content">
              <span className="home-pro-video-badge">TREINO</span>
              <h2 className="home-pro-video-title">Afie seu jogo</h2>
              <p>Não apenas grind — treine com inteligência. Use ferramentas focadas para melhorar exatamente o que precisa. Aim, retakes e warmup em servidores 128 tick.</p>
              <Link to="/servers" className="home-btn home-btn-primary">VER SERVIDORES</Link>
            </div>
          </div>

          {/* PUG Level — ranking solo */}
          <div className="home-pro-video-row home-pro-video-row--reverse">
            <div className="home-pro-video-wrap">
              <img
                src="/images/home-pug-level.png"
                alt="Sistema de level no MIX (PUG)"
                className="home-pro-video home-pro-img"
              />
            </div>
            <div className="home-pro-video-content">
              <span className="home-pro-video-badge">PUG · RANKING SOLO</span>
              <h2 className="home-pro-video-title">Suba de nível jogando PUG</h2>
              <p>Partidas solo: +20 pts por vitória, level a cada 100 pts. Ranking individual separado — cada partida PUG conta para seu nível.</p>
              <Link to="/ranking" className="home-btn home-btn-glass">VER RANKING</Link>
            </div>
          </div>

          {/* Squad + Jogue como um pro */}
          <div className="home-pro-video-row">
            <div className="home-pro-video-wrap">
              <video className="home-pro-video" autoPlay muted loop playsInline>
                <source src="https://refrag.gg/images/challenger.webm" type="video/webm" />
              </video>
            </div>
            <div className="home-pro-video-content">
              <span className="home-pro-video-badge">MIX & SQUAD</span>
              <h2 className="home-pro-video-title">Jogue como um pro</h2>
              <p>PUG 5v5 ou partidas Squad com seu time. Ranking de times separado do ranking solo — entre no servidor com lobby em tempo real e veto de mapas.</p>
              <Link to="/pug" className="home-btn home-btn-primary">ENTRAR NO MIX</Link>
            </div>
          </div>
        </section>

        {/* ── Performance showcase (PUG + Warmup) ── */}
        <section id="sec-performance" className="home-perf">
          <div className="home-perf-bg" />
          <div className="home-perf-inner">
            <div className="home-perf-header">
              <span className="home-perf-badge">NOVO</span>
              <h2 className="home-perf-label">ANALISE DE PERFORMANCE</h2>
              <p className="home-perf-sub">
                PUG e Warmup em um so lugar. Heatmaps por mapa, K/D, HS% e estatisticas de round nas partidas.
                No Warmup, tempo de reacao, desempenho por arma e sugestoes de melhoria.
              </p>
            </div>
            <PerfCarousel />
            <div className="home-perf-warmup-block">
              <div className="home-perf-warmup-card">
                <span className="home-perf-warmup-icon">WARMUP</span>
                <h3 className="home-perf-warmup-title">Stats no treino</h3>
                <p className="home-perf-warmup-desc">
                  Jogue Deathmatch e veja na Performance: tempo de reacao (primeiro hit ate o kill),
                  HS%, K/D, kills por arma e onde voce mais acerta (cabeca, peito, pernas).
                  Dicas para melhorar seu aim.
                </p>
                <ul className="home-perf-warmup-list">
                  <li>Reacao (ms)</li>
                  <li>HS% e K/D</li>
                  <li>Arma mais letal</li>
                  <li>Hit location</li>
                </ul>
              </div>
            </div>
            <div className="home-perf-details">
              <div className="home-perf-detail">
                <span className="home-perf-detail-num">PUG</span>
                <span className="home-perf-detail-label">heatmaps + partidas</span>
              </div>
              <div className="home-perf-detail-sep" />
              <div className="home-perf-detail">
                <span className="home-perf-detail-num">WARMUP</span>
                <span className="home-perf-detail-label">reacao + armas</span>
              </div>
              <div className="home-perf-detail-sep" />
              <div className="home-perf-detail">
                <span className="home-perf-detail-num">HS%</span>
                <span className="home-perf-detail-label">em ambos</span>
              </div>
            </div>
            <div className="home-perf-cta">
              <Link to="/performance" className="home-btn home-btn-primary">VER PERFORMANCE</Link>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="home-final">
          <div className="home-final-glow" />
          <h2>Pronto para dominar?</h2>
          <p>Servidores, skins, MIX (PUG e Squad). Tudo em um só lugar.</p>
          <Link to="/servers" className="home-btn home-btn-primary home-btn-lg">COMECE AGORA</Link>
        </section>
      </main>

      <footer className="footer home-footer">
        <span>Snaptap · TREINO · LOADOUT · MIX · SQUAD</span>
      </footer>
    </div>
  );
}
