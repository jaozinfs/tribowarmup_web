import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { fetchSkins } from '../services/skinsService';
import { fetchLoadout, saveLoadout } from '../services/loadoutService';
import { fetchAgentsByTeam } from '../services/agentsService';
import { fetchStickers } from '../services/stickersService';
import { fetchKeychains } from '../services/keychainsService';
import { fetchMusicKits } from '../services/musicKitsService';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { HamburgerNav } from '../components/HamburgerNav';
import LoadoutCharacter3D from '../components/LoadoutCharacter3D';
import './LoadoutPage.css';
import { TrackedButton } from '../components/TrackedButton';

const LOADOUT_CACHE_KEY = 'cs2-loadout-cache';
const LOADOUT_TOP_TAB_KEY = 'cs2-loadout-top-tab';

const TAB_INVENTORY = 'inventory';
const TAB_MUSIC = 'music';
const TAB_LAB = 'lab';

// Categorias para layout tipo jogo: melee (faca + luvas) e armas por linha.
const CAT_MELEE = 'melee';
const CAT_RIFLE = 'rifle';
const CAT_SNIPER = 'sniper';
const CAT_PISTOL = 'pistol';
const CAT_SMG = 'smg';
const CAT_SHOTGUN = 'shotgun';
const CAT_HEAVY = 'heavy';

// main: true = slot fica ao redor do personagem (principais). false = só nas abas em cima.
const LOADOUT_SLOTS_CT = [
  { id: 'knife_ct', label: 'Faca CT', type: 'knife', slotKey: 'knife_ct', position: 'bottom-left', category: CAT_MELEE, main: true },
  { id: 'gloves_ct', label: 'Luvas CT', type: 'gloves', slotKey: 'gloves_ct', position: 'bottom-right', category: CAT_MELEE, main: true },
  { id: 'weapon_m4a1_silencer', label: 'M4A1-S', type: 'weapon', weaponId: 'weapon_m4a1_silencer', position: 'left', category: CAT_RIFLE, main: true },
  { id: 'weapon_m4a1', label: 'M4A4', type: 'weapon', weaponId: 'weapon_m4a1', position: 'top-left', category: CAT_RIFLE, main: true },
  { id: 'weapon_aug', label: 'AUG', type: 'weapon', weaponId: 'weapon_aug', position: 'top-left-mid', category: CAT_RIFLE, main: true },
  { id: 'weapon_famas', label: 'FAMAS', type: 'weapon', weaponId: 'weapon_famas', position: 'top-left-mid', category: CAT_RIFLE, main: false },
  { id: 'weapon_awp_ct', label: 'AWP', type: 'weapon', weaponId: 'weapon_awp_ct', position: 'right', category: CAT_SNIPER, main: true },
  { id: 'weapon_ssg08', label: 'SSG 08', type: 'weapon', weaponId: 'weapon_ssg08', position: 'right', category: CAT_SNIPER, main: false },
  { id: 'weapon_scar20', label: 'SCAR-20', type: 'weapon', weaponId: 'weapon_scar20', position: 'right', category: CAT_SNIPER, main: false },
  { id: 'weapon_hkp2000', label: 'P2000', type: 'weapon', weaponId: 'weapon_hkp2000', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_usp_silencer', label: 'USP-S', type: 'weapon', weaponId: 'weapon_usp_silencer', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_p250', label: 'P250', type: 'weapon', weaponId: 'weapon_p250', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_fiveseven', label: 'Five-SeveN', type: 'weapon', weaponId: 'weapon_fiveseven', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_cz75a', label: 'CZ75-Auto', type: 'weapon', weaponId: 'weapon_cz75a', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_deagle', label: 'Desert Eagle', type: 'weapon', weaponId: 'weapon_deagle', position: 'top-right', category: CAT_PISTOL, main: true },
  { id: 'weapon_revolver', label: 'R8 Revolver', type: 'weapon', weaponId: 'weapon_revolver', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_mp9', label: 'MP9', type: 'weapon', weaponId: 'weapon_mp9', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_mp7', label: 'MP7', type: 'weapon', weaponId: 'weapon_mp7', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_ump45', label: 'UMP-45', type: 'weapon', weaponId: 'weapon_ump45', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_p90', label: 'P90', type: 'weapon', weaponId: 'weapon_p90', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_bizon', label: 'PP-Bizon', type: 'weapon', weaponId: 'weapon_bizon', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_nova', label: 'Nova', type: 'weapon', weaponId: 'weapon_nova', position: 'left', category: CAT_SHOTGUN, main: false },
  { id: 'weapon_mag7', label: 'MAG-7', type: 'weapon', weaponId: 'weapon_mag7', position: 'left', category: CAT_SHOTGUN, main: false },
  { id: 'weapon_xm1014', label: 'XM1014', type: 'weapon', weaponId: 'weapon_xm1014', position: 'left', category: CAT_SHOTGUN, main: false },
  { id: 'weapon_m249', label: 'M249', type: 'weapon', weaponId: 'weapon_m249', position: 'left', category: CAT_HEAVY, main: false },
  { id: 'weapon_negev', label: 'Negev', type: 'weapon', weaponId: 'weapon_negev', position: 'left', category: CAT_HEAVY, main: false },
];

const LOADOUT_SLOTS_T = [
  { id: 'knife_t', label: 'Faca T', type: 'knife', slotKey: 'knife_t', position: 'bottom-left', category: CAT_MELEE, main: true },
  { id: 'gloves_t', label: 'Luvas T', type: 'gloves', slotKey: 'gloves_t', position: 'bottom-right', category: CAT_MELEE, main: true },
  { id: 'weapon_ak47', label: 'AK-47', type: 'weapon', weaponId: 'weapon_ak47', position: 'left', category: CAT_RIFLE, main: true },
  { id: 'weapon_galilar', label: 'Galil AR', type: 'weapon', weaponId: 'weapon_galilar', position: 'top-left', category: CAT_RIFLE, main: true },
  { id: 'weapon_sg556', label: 'SG 553', type: 'weapon', weaponId: 'weapon_sg556', position: 'top-left-mid', category: CAT_RIFLE, main: false },
  { id: 'weapon_awp_t', label: 'AWP', type: 'weapon', weaponId: 'weapon_awp_t', position: 'right', category: CAT_SNIPER, main: true },
  { id: 'weapon_ssg08', label: 'SSG 08', type: 'weapon', weaponId: 'weapon_ssg08', position: 'right', category: CAT_SNIPER, main: false },
  { id: 'weapon_glock', label: 'Glock-18', type: 'weapon', weaponId: 'weapon_glock', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_p250', label: 'P250', type: 'weapon', weaponId: 'weapon_p250', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_tec9', label: 'Tec-9', type: 'weapon', weaponId: 'weapon_tec9', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_cz75a', label: 'CZ75-Auto', type: 'weapon', weaponId: 'weapon_cz75a', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_deagle', label: 'Desert Eagle', type: 'weapon', weaponId: 'weapon_deagle', position: 'top-right', category: CAT_PISTOL, main: true },
  { id: 'weapon_revolver', label: 'R8 Revolver', type: 'weapon', weaponId: 'weapon_revolver', position: 'top-right', category: CAT_PISTOL, main: false },
  { id: 'weapon_mac10', label: 'Mac-10', type: 'weapon', weaponId: 'weapon_mac10', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_mp7', label: 'MP7', type: 'weapon', weaponId: 'weapon_mp7', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_ump45', label: 'UMP-45', type: 'weapon', weaponId: 'weapon_ump45', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_p90', label: 'P90', type: 'weapon', weaponId: 'weapon_p90', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_bizon', label: 'PP-Bizon', type: 'weapon', weaponId: 'weapon_bizon', position: 'left', category: CAT_SMG, main: false },
  { id: 'weapon_sawedoff', label: 'Sawed-Off', type: 'weapon', weaponId: 'weapon_sawedoff', position: 'left', category: CAT_SHOTGUN, main: false },
  { id: 'weapon_mag7', label: 'MAG-7', type: 'weapon', weaponId: 'weapon_mag7', position: 'left', category: CAT_SHOTGUN, main: false },
  { id: 'weapon_xm1014', label: 'XM1014', type: 'weapon', weaponId: 'weapon_xm1014', position: 'left', category: CAT_SHOTGUN, main: false },
  { id: 'weapon_m249', label: 'M249', type: 'weapon', weaponId: 'weapon_m249', position: 'left', category: CAT_HEAVY, main: false },
  { id: 'weapon_negev', label: 'Negev', type: 'weapon', weaponId: 'weapon_negev', position: 'left', category: CAT_HEAVY, main: false },
];

const WEAPON_CATEGORY_TABS = [CAT_RIFLE, CAT_SNIPER, CAT_PISTOL, CAT_SMG, CAT_SHOTGUN, CAT_HEAVY];

const CATEGORY_LABELS = {
  [CAT_MELEE]: 'Faca e luvas',
  [CAT_RIFLE]: 'Rifles',
  [CAT_SNIPER]: 'Sniper',
  [CAT_PISTOL]: 'Pistolas',
  [CAT_SMG]: 'SMGs',
  [CAT_SHOTGUN]: 'Shotguns',
  [CAT_HEAVY]: 'Pesadas',
};

/** Para slots AWP CT/TR, o modal deve filtrar pelo tipo AWP do catálogo (id pode ser weapon_awp ou awp). */
function getWeaponFilterTypeForSlot(weaponId, types) {
  if (weaponId !== 'weapon_awp_ct' && weaponId !== 'weapon_awp_t') return weaponId;
  const awpType = types?.find(
    (t) =>
      t.keys?.has('weapon_awp') ||
      t.keys?.has('awp') ||
      t.id === 'weapon_awp' ||
      t.id === 'awp' ||
      (t.label && t.label.toLowerCase().includes('awp'))
  );
  return awpType?.id ?? 'weapon_awp';
}

function SkinCard({ skin, selected, onSelect }) {
  return (
    <TrackedButton
      type="button"
      className={`skin-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(skin)}
    >
      <img src={skin.image} alt={skin.name} loading="lazy" />
      <span className="skin-name">{skin.name}</span>
    </TrackedButton>
  );
}

function clampNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(v, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function StickerChip({ sticker, onClick }) {
  return (
    <TrackedButton type="button" className="lab-chip" onClick={onClick}>
      {sticker?.image ? <img src={sticker.image} alt={sticker.name || 'Sticker'} loading="lazy" /> : <div className="lab-chip-fallback" />}
      <div className="lab-chip-title">{sticker?.name || 'Selecionar sticker'}</div>
    </TrackedButton>
  );
}

function KeychainChip({ keychain, onClick }) {
  return (
    <TrackedButton type="button" className="lab-chip" onClick={onClick}>
      {keychain?.image ? <img src={keychain.image} alt={keychain.name || 'Chaveiro'} loading="lazy" /> : <div className="lab-chip-fallback" />}
      <div className="lab-chip-title">{keychain?.name || 'Selecionar chaveiro'}</div>
    </TrackedButton>
  );
}

function MusicKitCard({ kit, selected, onSelect }) {
  return (
    <TrackedButton
      type="button"
      className={`music-kit-card${selected ? ' selected' : ''}`}
      onClick={() => onSelect(kit)}
      title={kit?.name || ''}
    >
      <div className="music-kit-thumb">
        {kit?.image ? <img src={kit.image} alt={kit.name || ''} loading="lazy" /> : <div className="music-kit-thumb-fallback" />}
      </div>
      <div className="music-kit-name">{kit?.name || '—'}</div>
    </TrackedButton>
  );
}

const CARD_MIN_WIDTH = 140;
const CARD_GAP = 12;
const ROWS_PER_PAGE = 4;

function getTypesFromSkins(skins) {
  if (!skins?.length) return [];
  // Agrupar por label para evitar duplicatas (mesma arma com id e name diferentes)
  const byLabel = new Map(); // label -> Map(key -> count)
  for (const s of skins) {
    const key = s.weapon?.id ?? s.weapon?.name ?? '';
    const label = s.weapon?.name ?? s.weapon?.id ?? 'Outro';
    if (!key || !label) continue;
    if (!byLabel.has(label)) byLabel.set(label, new Map());
    const keyCounts = byLabel.get(label);
    keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
  }
  // Para cada label, usar a chave mais comum e guardar todas as chaves (para filtro)
  const types = [];
  for (const [label, keyCounts] of byLabel) {
    let bestKey = '';
    let bestCount = 0;
    const allKeys = new Set();
    for (const [k, c] of keyCounts) {
      allKeys.add(k);
      if (c > bestCount) {
        bestKey = k;
        bestCount = c;
      }
    }
    types.push({ id: bestKey, label, keys: allKeys });
  }
  return types.sort((a, b) => a.label.localeCompare(b.label));
}

function SkinTabContent({ skins, selectedSkin, onSelect, search, onSearch, typeFilter, onTypeFilter, types, selectedTypeIds, isWeaponTab, loadout, hideTypeDropdown, selectedWeaponSlotKey }) {
  const gridRef = useRef(null);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  const filtered = useMemo(() => {
    if (!skins) return [];
    let result = skins;
    if (typeFilter) {
      const selectedType = types.find(t => t.id === typeFilter);
      const matchKeys = selectedType?.keys ?? new Set([typeFilter]);
      result = result.filter(s => {
        const key = s.weapon?.id ?? s.weapon?.name;
        return key && matchKeys.has(key);
      });
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(s => s.name?.toLowerCase().includes(q));
    }
    return result;
  }, [skins, search, typeFilter, types]);

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const cols = Math.max(2, Math.floor((w + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP)));
      setItemsPerPage(cols * ROWS_PER_PAGE);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const start = (page - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [search, skins, typeFilter]);

  if (!skins) return null;

  return (
    <div className="skin-tab-content">
      <div className="skin-filters-row">
        <div className="skin-search-row">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            className="skin-search-input"
            placeholder="Buscar skins..."
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
        {!hideTypeDropdown && (
        <div className="skin-type-dropdown-wrap">
          <select
            className="skin-type-dropdown"
            value={typeFilter || ''}
            onChange={e => onTypeFilter(e.target.value || '')}
          >
            <option value="">{types.length ? '— Todos os tipos —' : '—'}</option>
            {types.map(t => {
              const hasSelection = isWeaponTab && (t.keys || t.id)
                ? (Object.keys(loadout?.weapons || {}).some(k => t.keys?.has(k)) ||
                   Object.values(loadout?.weapons || {}).some(w => t.id === w?.weapon?.id || t.id === w?.weapon?.name || t.keys?.has(w?.weapon?.id) || t.keys?.has(w?.weapon?.name)))
                : selectedTypeIds?.has(t.id);
              return (
                <option key={t.id} value={t.id}>
                  {t.label}{hasSelection ? ' ✓' : ''}
                </option>
              );
            })}
          </select>
        </div>
        )}
        <span className="skin-count">{filtered.length} skins</span>
      </div>

      <div className="skin-grid" ref={gridRef}>
        {paginated.map(skin => {
          const weaponKey = skin.weapon?.id ?? skin.weapon?.name;
          const isSelected = isWeaponTab && weaponKey
            ? (() => {
                const w = selectedWeaponSlotKey
                  ? loadout?.weapons?.[selectedWeaponSlotKey]
                  : (loadout?.weapons?.[weaponKey] ?? Object.values(loadout?.weapons || {}).find(
                      w => w?.weapon?.id === weaponKey || w?.weapon?.name === weaponKey
                    ));
                return w && (w?.id === skin.id || w?.skin_id === skin.id);
              })()
            : (selectedSkin?.id === skin.id || selectedSkin?.skin_id === skin.id);
          return (
            <SkinCard
              key={skin.id}
              skin={skin}
              selected={isSelected}
              onSelect={() => onSelect(skin, isWeaponTab ? weaponKey : undefined)}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="skin-empty">Nenhuma skin encontrada</div>
      ) : totalPages > 1 && (
        <div className="skin-pagination">
          <TrackedButton
            className="btn-page"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← ANTERIOR
          </TrackedButton>
          <span className="page-info">
            Página {page} de {totalPages}
          </span>
          <TrackedButton
            className="btn-page"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            PRÓXIMA →
          </TrackedButton>
        </div>
      )}
    </div>
  );
}

/** StatTrak — sempre visível em cada arma (com ou sem skin). */
function WeaponStattrakRow({ weaponId, skin, onStattrakToggle, variant = 'tab' }) {
  if (!weaponId || !onStattrakToggle) return null;
  const hasStattrak = skin?.stattrak === true;
  return (
    <label
      className={`stattrak-toggle stattrak-toggle--${variant}${hasStattrak ? ' stattrak-toggle--on' : ''}`}
      onClick={(e) => e.stopPropagation()}
      title={hasStattrak ? 'Desativar StatTrak™' : 'Ativar StatTrak™'}
    >
      <input
        type="checkbox"
        checked={!!hasStattrak}
        onChange={(e) => {
          e.stopPropagation();
          onStattrakToggle(weaponId, e.target.checked);
        }}
      />
      <span className="stattrak-toggle-track">
        <span className="stattrak-toggle-thumb" />
      </span>
      <span className="stattrak-toggle-label">ST</span>
    </label>
  );
}

/** StatTrak — faca (knife_ct / knife_t) também pode ter ST. */
function KnifeStattrakRow({ slotKey, skin, onStattrakToggle, variant = 'tab' }) {
  if (!slotKey || !onStattrakToggle) return null;
  const hasStattrak = skin?.stattrak === true;
  return (
    <label
      className={`stattrak-toggle stattrak-toggle--${variant}${hasStattrak ? ' stattrak-toggle--on' : ''}`}
      onClick={(e) => e.stopPropagation()}
      title={hasStattrak ? 'Desativar StatTrak™' : 'Ativar StatTrak™'}
    >
      <input
        type="checkbox"
        checked={!!hasStattrak}
        onChange={(e) => {
          e.stopPropagation();
          onStattrakToggle(slotKey, e.target.checked);
        }}
      />
      <span className="stattrak-toggle-track">
        <span className="stattrak-toggle-thumb" />
      </span>
      <span className="stattrak-toggle-label">ST</span>
    </label>
  );
}

function LoadoutCharacterView({ side, onSideChange, loadout, onSlotClick, slotsConfig, onAgentClick, onStattrakToggle, onKnifeStattrakToggle }) {
  const [activeCategoryTab, setActiveCategoryTab] = useState(CAT_RIFLE);
  const [agentPulse, setAgentPulse] = useState(0);

  const getCurrentSkinForSlot = (slot) => {
    if (slot.type === 'knife' && slot.slotKey) return loadout?.[slot.slotKey] ?? null;
    if (slot.type === 'gloves' && slot.slotKey) return loadout?.[slot.slotKey] ?? null;
    if (slot.type === 'weapon' && slot.weaponId) return loadout?.weapons?.[slot.weaponId] ?? null;
    return null;
  };

  /** Polar/anel: todos os slots com `main=true` ficam ao redor do personagem. */
  const mainSlots = slotsConfig.filter((s) => s.main === true);
  const categoryOnlySlots = React.useMemo(() => {
    const byCat = new Map();
    slotsConfig.forEach((slot) => {
      if (slot.type !== 'weapon') return;
      // “Resto em cima”: mostrar apenas slots de armas que NÃO estão no anel polar.
      if (slot.main === true) return;
      if (slot.category === CAT_MELEE) return;
      const cat = slot.category || 'weapon';
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(slot);
    });
    return byCat;
  }, [slotsConfig]);

  const currentTabSlots = categoryOnlySlots.get(activeCategoryTab) || [];

  return (
    <div className="loadout-character-view">
      {/* Abas de categorias em cima */}
      <div className="loadout-category-tabs-wrap">
        <div className="loadout-category-tabs" role="tablist">
          {WEAPON_CATEGORY_TABS.map((cat) => (
            <TrackedButton
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategoryTab === cat}
              className={`loadout-category-tab ${activeCategoryTab === cat ? 'active' : ''}`}
              onClick={() => setActiveCategoryTab(cat)}
            >
              {CATEGORY_LABELS[cat] || cat}
            </TrackedButton>
          ))}
        </div>
        <div className="loadout-category-tab-content">
          {currentTabSlots.map((slot) => {
            const skin = getCurrentSkinForSlot(slot);
            const isWeapon = slot.type === 'weapon' && slot.weaponId;
            const hasStattrak = isWeapon && skin?.stattrak === true;
            const showSkinVisual = Boolean(skin?.image);
            const showSkinText = Boolean(skin && (skin.name || skin.paint_index || skin.paint));
            return (
              <TrackedButton
                key={slot.id}
                type="button"
                className="loadout-slot loadout-slot-weapon"
                onClick={() => onSlotClick(slot)}
                title={skin ? (skin.name || slot.label) : `Selecionar skin - ${slot.label}`}
              >
                <div className="loadout-slot-inner">
                  {showSkinVisual ? (
                    <>
                      <img src={skin.image} alt={skin.name || slot.label} className="loadout-slot-img" />
                      <span className={`loadout-slot-name${hasStattrak ? ' loadout-slot-name--stattrak' : ''}`}>
                        {hasStattrak ? 'StatTrak\u2122 ' : ''}{skin.name || slot.label}
                      </span>
                    </>
                  ) : showSkinText ? (
                    <>
                      <span className="loadout-slot-img loadout-slot-img--text-fallback" aria-hidden>
                        🔫
                      </span>
                      <span className={`loadout-slot-name${hasStattrak ? ' loadout-slot-name--stattrak' : ''}`}>
                        {hasStattrak ? 'StatTrak\u2122 ' : ''}{skin.name || slot.label}
                      </span>
                    </>
                  ) : (
                    <span className="loadout-slot-placeholder">
                      <span className="loadout-slot-label">{slot.label}</span>
                      Escolher
                    </span>
                  )}
                  {isWeapon ? (
                    <WeaponStattrakRow
                      weaponId={slot.weaponId}
                      skin={skin}
                      onStattrakToggle={onStattrakToggle}
                      variant="tab"
                    />
                  ) : null}
                </div>
              </TrackedButton>
            );
          })}
        </div>
      </div>

      <p className="loadout-pick-side-label">Escolha o lado</p>
      <div className="loadout-side-toggle">
        <TrackedButton
          type="button"
          className={`loadout-side-card loadout-side-card--ct ${side === 'ct' ? 'active' : ''}`}
          onClick={() => onSideChange('ct')}
          aria-pressed={side === 'ct'}
        >
          <span className="loadout-side-card-badge">CT</span>
          <span className="loadout-side-card-title">Contra-Terrorista</span>
          <span className="loadout-side-card-desc">SAS · Tático</span>
        </TrackedButton>
        <TrackedButton
          type="button"
          className={`loadout-side-card loadout-side-card--t ${side === 't' ? 'active' : ''}`}
          onClick={() => onSideChange('t')}
          aria-pressed={side === 't'}
        >
          <span className="loadout-side-card-badge">T</span>
          <span className="loadout-side-card-title">Terrorista</span>
          <span className="loadout-side-card-desc">Balkan · Romanov</span>
        </TrackedButton>
      </div>

      {/* Faca/luvas no anel + grade com todas as armas abaixo */}
      <div className="loadout-character-wrap">
      <div className={`loadout-character-stage loadout-character-stage--${side}`}>
        <div className="loadout-character-stage-inner">
          <TrackedButton
            type="button"
            className="loadout-agent-top-btn"
            onClick={() => onAgentClick?.(side)}
            title="Trocar agent"
          >
            <span className="loadout-agent-top-icon" aria-hidden>🕵</span>
            <span className="loadout-agent-top-text">Trocar Agent</span>
            <span className="loadout-agent-top-current">{(side === 'ct' ? loadout?.agent_ct?.name : loadout?.agent_t?.name) || 'Padrão'}</span>
          </TrackedButton>
          {(() => {
            const agent = side === 'ct' ? loadout?.agent_ct : loadout?.agent_t;
            const img = agent?.image;
            if (img) {
              return (
                <TrackedButton
                  type="button"
                  className={`loadout-agent-center${agentPulse ? ' loadout-agent-center--pulse' : ''}`}
                  onClick={() => {
                    // animação visual + abre modal (botão de cima continua existindo)
                    setAgentPulse((p) => (p + 1) % 1_000_000);
                    onAgentClick?.(side);
                  }}
                  title="Trocar agent"
                >
                  <div className="loadout-agent-center-shadow" aria-hidden />
                  <img className="loadout-agent-center-img" src={img} alt={agent?.name || 'Agent'} loading="eager" />
                </TrackedButton>
              );
            }
            return <LoadoutCharacter3D side={side} />;
          })()}
        </div>
        {mainSlots.map((slot) => {
          const skin = getCurrentSkinForSlot(slot);
          const showSkinVisual = Boolean(skin?.image);
          const showSkinText = Boolean(skin && (skin.name || skin.paint_index || skin.paint));
          const meleeEmoji = slot.type === 'knife' ? '🔪' : '🧤';
          const isWeapon = slot.type === 'weapon' && slot.weaponId;
          const isKnife = slot.type === 'knife' && slot.slotKey;
          return (
            <TrackedButton
              key={slot.id}
              type="button"
              className={`loadout-slot loadout-slot--${slot.position}`}
              onClick={() => onSlotClick(slot)}
              title={skin ? (skin.name || slot.label) : `Selecionar skin - ${slot.label}`}
            >
              <div className="loadout-slot-inner">
                {isWeapon ? (
                  <WeaponStattrakRow
                    weaponId={slot.weaponId}
                    skin={skin}
                    onStattrakToggle={onStattrakToggle}
                    variant="main"
                  />
                ) : null}
                {isKnife ? (
                  <KnifeStattrakRow
                    slotKey={slot.slotKey}
                    skin={skin}
                    onStattrakToggle={onKnifeStattrakToggle}
                    variant="main"
                  />
                ) : null}
                {showSkinVisual ? (
                  <>
                    <img src={skin.image} alt={skin.name || slot.label} className="loadout-slot-img" />
                    <span className="loadout-slot-name">{skin.name || slot.label}</span>
                  </>
                ) : showSkinText ? (
                  <>
                    <span className="loadout-slot-img loadout-slot-img--text-fallback" aria-hidden>
                      {meleeEmoji}
                    </span>
                    <span className="loadout-slot-name">{skin.name || slot.label}</span>
                  </>
                ) : (
                  <span className="loadout-slot-placeholder">
                    <span className="loadout-slot-label">{slot.label}</span>
                    Clique para escolher
                  </span>
                )}
              </div>
            </TrackedButton>
          );
        })}
      </div>

      </div>
    </div>
  );
}

export default function LoadoutPage() {
  const auth = useAuth();
  const profile = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const steamId = auth.steamId;
  const [skins, setSkins] = useState(null);
  const [activeTab, setActiveTab] = useState('knife');
  const [search, setSearch] = useState({ knife: '', weapon: '', gloves: '' });
  const [typeFilter, setTypeFilter] = useState({ knife: '', weapon: '', gloves: '' });
  const [loadout, setLoadout] = useState(null);
  const [loadoutFetched, setLoadoutFetched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [side, setSide] = useState('ct');
  const [openSlot, setOpenSlot] = useState(null);
  const [agentModal, setAgentModal] = useState({ open: false, side: 'ct' });
  const [agentSearch, setAgentSearch] = useState('');
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [topTab, setTopTab] = useState(() => {
    try {
      const v = localStorage.getItem(LOADOUT_TOP_TAB_KEY);
      if (v === TAB_MUSIC || v === TAB_LAB || v === TAB_INVENTORY) return v;
    } catch { /* ignore */ }
    return TAB_INVENTORY;
  });

  useEffect(() => {
    try { localStorage.setItem(LOADOUT_TOP_TAB_KEY, topTab); } catch { /* ignore */ }
  }, [topTab]);

  const [stickersCatalog, setStickersCatalog] = useState(null);
  const [keychainsCatalog, setKeychainsCatalog] = useState(null);
  const [musicKitsCatalog, setMusicKitsCatalog] = useState(null);
  const [labWeaponKey, setLabWeaponKey] = useState(null);
  const [labPicker, setLabPicker] = useState({ open: false, type: null, idx: null });
  const [labSearch, setLabSearch] = useState('');
  const [musicSearch, setMusicSearch] = useState('');
  const [musicPage, setMusicPage] = useState(1);
  const MUSIC_PAGE_SIZE = 36;
  const previewBoxRef = useRef(null);
  const previewImgRef = useRef(null);
  const previewImgMetaRef = useRef({ w: 0, h: 0 }); // natural dims
  const [previewRotate, setPreviewRotate] = useState(false);

  // Presets visuais para o preview no site (ingame segue schema/offset do plugin).
  const STICKER_RANGE = 0.2;
  const CHARM_RANGE = 0.05;
  const pxFromOffset = (off, range, pxRadius) => (off / range) * pxRadius;
  const STICKER_PRESET_OFFSETS = [
    { x: -0.12, y: -0.05 },
    { x: -0.04, y: 0.03 },
    { x: 0.05, y: 0.01 },
    { x: 0.13, y: -0.04 },
  ];
  const CHARM_PRESET_OFFSET = { x: 0.11, y: 0.09 };

  useEffect(() => {
    let cancelled = false;
    if (topTab !== TAB_LAB) return;
    (async () => {
      try {
        const [s, k] = await Promise.all([fetchStickers(), fetchKeychains()]);
        if (!cancelled) {
          setStickersCatalog(Array.isArray(s) ? s : []);
          setKeychainsCatalog(Array.isArray(k) ? k : []);
        }
      } catch {
        if (!cancelled) {
          setStickersCatalog([]);
          setKeychainsCatalog([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [topTab]);

  // reset paging when search changes
  useEffect(() => { setMusicPage(1); }, [musicSearch]);

  useEffect(() => {
    let cancelled = false;
    if (topTab !== TAB_MUSIC) return;
    (async () => {
      try {
        const m = await fetchMusicKits();
        if (!cancelled) setMusicKitsCatalog(Array.isArray(m) ? m : []);
      } catch {
        if (!cancelled) setMusicKitsCatalog([]);
      }
    })();
    return () => { cancelled = true; };
  }, [topTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'error') {
      setError('Falha ao entrar com Steam. Tente novamente.');
      window.history.replaceState({}, '', '/loadout');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSkins();
        if (!cancelled) setSkins(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!steamId) {
      setLoadoutFetched(true);
      return;
    }
    let cancelled = false;
    setLoadoutFetched(false);
    const norm = (l) => {
      if (!l) {
        return { agent_ct: null, agent_t: null, music_kit: null, knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };
      }
      const legacyKnife = l.knife || null;
      const legacyGloves = l.gloves || null;
      return {
        agent_ct: l.agent_ct ?? null,
        agent_t: l.agent_t ?? null,
        music_kit: l.music_kit ?? l.musicKit ?? null,
        knife_ct: l.knife_ct ?? legacyKnife,
        knife_t: l.knife_t ?? legacyKnife,
        weapons: l.weapons && typeof l.weapons === 'object' ? l.weapons : (l.weapon ? { [l.weapon?.weapon?.id || 'weapon']: l.weapon } : {}),
        gloves_ct: l.gloves_ct ?? legacyGloves,
        gloves_t: l.gloves_t ?? legacyGloves,
      };
    };
    async function loadLoadout() {
      try {
        const data = await fetchLoadout(steamId);
        if (!cancelled) {
          setLoadout(data ? norm(data) : norm(null));
          if (data) {
            try {
              localStorage.setItem(LOADOUT_CACHE_KEY, JSON.stringify({ steamId, loadout: norm(data) }));
            } catch { /* ignore */ }
          }
        }
      } catch {
        try {
          const cached = localStorage.getItem(LOADOUT_CACHE_KEY);
          if (cached && steamId) {
            try {
              const { steamId: cachedId, loadout: cachedLoadout } = JSON.parse(cached);
              if (!cancelled && cachedId === steamId && cachedLoadout) setLoadout(norm(cachedLoadout));
            } catch { /* ignore */ }
          }
          if (!cancelled) setLoadout(norm(null));
        } catch {
          if (!cancelled) setLoadout(norm(null));
        }
      } finally {
        if (!cancelled) setLoadoutFetched(true);
      }
    }
    loadLoadout();
    return () => { cancelled = true; };
  }, [steamId]);

  useEffect(() => {
    const state = location.state;
    if (!state?.openSlot || !loadoutFetched || !skins || !steamId) return;
    const slot = state.openSlot;
    const preselectSkin = state.preselectSkin;
    navigate('/loadout', { replace: true, state: {} });
    if (slot.type === 'knife' && (slot.slotKey === 'knife_ct' || slot.slotKey === 'knife_t')) {
      setSide(slot.slotKey === 'knife_ct' ? 'ct' : 't');
    } else if (slot.type === 'gloves' && (slot.slotKey === 'gloves_ct' || slot.slotKey === 'gloves_t')) {
      setSide(slot.slotKey === 'gloves_ct' ? 'ct' : 't');
    } else if (slot.type === 'weapon' && slot.weaponId) {
      const ctOnly = ['weapon_m4a1', 'weapon_m4a1_silencer', 'weapon_aug', 'weapon_famas', 'weapon_awp_ct', 'weapon_usp_silencer', 'weapon_hkp2000', 'weapon_fiveseven', 'weapon_scar20', 'weapon_mp9', 'weapon_nova'];
      const tOnly = ['weapon_ak47', 'weapon_galilar', 'weapon_sg556', 'weapon_awp_t', 'weapon_glock', 'weapon_tec9', 'weapon_mac10', 'weapon_sawedoff'];
      const isCt = slot.weaponId.includes('_ct') || ctOnly.includes(slot.weaponId);
      const isT = slot.weaponId.includes('_t') || tOnly.includes(slot.weaponId);
      setSide(isT ? 't' : isCt ? 'ct' : 'ct');
    }
    if (preselectSkin) {
      setLoadout((prev) => {
        const base = prev ?? { knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };
        if (slot.type === 'knife' && slot.slotKey) {
          return { ...base, [slot.slotKey]: preselectSkin };
        }
        if (slot.type === 'weapon' && slot.weaponId) {
          return { ...base, weapons: { ...(base.weapons || {}), [slot.weaponId]: preselectSkin } };
        }
        return base;
      });
      if (steamId) {
        const base = loadout ?? { knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };
        let next = base;
        if (slot.type === 'knife' && slot.slotKey) next = { ...base, [slot.slotKey]: preselectSkin };
        else if (slot.type === 'weapon' && slot.weaponId) next = { ...base, weapons: { ...(base.weapons || {}), [slot.weaponId]: preselectSkin } };
        saveLoadout(steamId, next).catch(() => {});
      }
    }
    setOpenSlot(slot);
  }, [location.state, loadoutFetched, skins, steamId]);

  const normalizeLoadout = (l) => {
    if (!l) return { agent_ct: null, agent_t: null, knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };
    const legacyGloves = l.gloves || null;
    return {
      agent_ct: l.agent_ct ?? null,
      agent_t: l.agent_t ?? null,
      music_kit: l.music_kit ?? null,
      knife_ct: l.knife_ct ?? null,
      knife_t: l.knife_t ?? null,
      weapons: l.weapons && typeof l.weapons === 'object' ? l.weapons : (l.weapon ? { [l.weapon?.weapon?.id || 'weapon']: l.weapon } : {}),
      gloves_ct: l.gloves_ct ?? legacyGloves,
      gloves_t: l.gloves_t ?? legacyGloves,
    };
  };

  const baseLoadout = loadout ?? { agent_ct: null, agent_t: null, music_kit: null, knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };

  /** Enriquece itens do loadout (da API) com image/name do catálogo de skins para os quadradinhos exibirem a skin salva. */
  const safeLoadout = useMemo(() => {
    if (!skins) return baseLoadout;
    const findInCatalog = (list, item, options = {}) => {
      if (!list?.length || !item) return item ?? null;
      const { allowWeaponOnlyFallback = true } = options;
      const itemIds = [item.id, item.skin_id].filter(v => v != null).map(v => String(v));
      const byId = list.find(s => {
        const sid = s.id != null ? String(s.id) : null;
        const sSkinId = s.skin_id != null ? String(s.skin_id) : null;
        return itemIds.some(a => a && (a === sid || a === sSkinId));
      });
      if (byId) return { ...item, image: byId.image ?? item.image, name: byId.name ?? item.name };
      const paint = String(item.paint_index ?? item.paint ?? '');
      const weaponId = item.weapon?.id ?? item.weapon?.name ?? '';
      const match = list.find(s => {
        const sw = s.weapon?.id ?? s.weapon?.name ?? '';
        const sp = String(s.paint_index ?? s.paint ?? '');
        const exact = sw && sw === weaponId && sp === paint;
        const weaponOnly = allowWeaponOnlyFallback && weaponId && sw === weaponId;
        return exact || weaponOnly;
      });
      if (match) return { ...item, image: match.image ?? item.image, name: match.name ?? item.name };
      return { ...item, name: item.name ?? 'Skin' };
    };
    return {
      // manter agentes (não vêm do catálogo de skins)
      agent_ct: baseLoadout.agent_ct ?? null,
      agent_t: baseLoadout.agent_t ?? null,
      // manter também o kit de música atual no objeto seguro
      music_kit: baseLoadout.music_kit ?? null,
      knife_ct: baseLoadout.knife_ct ? findInCatalog(skins.knives, baseLoadout.knife_ct, { allowWeaponOnlyFallback: false }) : null,
      knife_t: baseLoadout.knife_t ? findInCatalog(skins.knives, baseLoadout.knife_t, { allowWeaponOnlyFallback: false }) : null,
      gloves_ct: baseLoadout.gloves_ct ? findInCatalog(skins.gloves, baseLoadout.gloves_ct, { allowWeaponOnlyFallback: false }) : null,
      gloves_t: baseLoadout.gloves_t ? findInCatalog(skins.gloves, baseLoadout.gloves_t, { allowWeaponOnlyFallback: false }) : null,
      weapons: baseLoadout.weapons && typeof baseLoadout.weapons === 'object'
        ? Object.fromEntries(
            Object.entries(baseLoadout.weapons).map(([k, v]) => [k, findInCatalog(skins.weapons, v) ?? v])
          )
        : {},
    };
  }, [loadout, skins]);

  const handleLogout = async () => {
    await auth.logout();
    setLoadout(null);
    setLoadoutFetched(false);
    try {
      localStorage.removeItem(LOADOUT_CACHE_KEY);
    } catch { /* ignore */ }
  };

  const handleSelectSkin = (type, skin, weaponId, slotKey) => {
    setLoadout(prev => {
      const base = prev ?? { knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };
      if (type === 'weapon' && weaponId) {
        return { ...base, weapons: { ...(base.weapons || {}), [weaponId]: skin } };
      }
      if (type === 'knife' && (slotKey === 'knife_ct' || slotKey === 'knife_t')) {
        return { ...base, [slotKey]: skin };
      }
      if (type === 'gloves' && (slotKey === 'gloves_ct' || slotKey === 'gloves_t')) {
        return { ...base, [slotKey]: skin };
      }
      return { ...base, [type]: skin };
    });
  };

  const handleSearch = (type, value) => {
    setSearch(prev => ({ ...prev, [type]: value }));
  };

  const handleTypeFilter = (type, value) => {
    setTypeFilter(prev => ({ ...prev, [type]: value }));
  };

  const handleSlotClick = (slot) => {
    setOpenSlot(slot);
  };

  const handleSlotSkinSelect = (skin, weaponId) => {
    const type = openSlot?.type;
    const wId = type === 'weapon' ? openSlot?.weaponId : undefined;
    const slotKey = openSlot?.slotKey;
    if (!type) {
      setOpenSlot(null);
      return;
    }
    const base = loadout ?? { knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };
    let next;
    if (type === 'weapon' && wId) {
      next = { ...base, weapons: { ...(base.weapons || {}), [wId]: skin } };
    } else if (type === 'knife' && (slotKey === 'knife_ct' || slotKey === 'knife_t')) {
      next = { ...base, [slotKey]: skin };
    } else if (type === 'gloves' && (slotKey === 'gloves_ct' || slotKey === 'gloves_t')) {
      next = { ...base, [slotKey]: skin };
    } else {
      next = { ...base, [type]: skin };
    }
    setLoadout(next);
    setOpenSlot(null);
    if (steamId) {
      saveLoadout(steamId, next)
        .then((persisted) => {
          const normalized = normalizeLoadout(persisted);
          setLoadout(normalized);
          try {
            localStorage.setItem(LOADOUT_CACHE_KEY, JSON.stringify({ steamId, loadout: normalized }));
          } catch { /* ignore */ }
        })
        .catch(() => setError('Falha ao salvar. Tente novamente.'));
    }
  };

  const getCurrentSkinForSlot = (slot) => {
    if (slot.type === 'knife' && slot.slotKey) return safeLoadout[slot.slotKey];
    if (slot.type === 'gloves' && slot.slotKey) return safeLoadout[slot.slotKey];
    if (slot.type === 'weapon' && slot.weaponId) return safeLoadout.weapons?.[slot.weaponId] ?? null;
    return null;
  };

  const handleSave = async () => {
    if (!steamId) {
      setError('Entre com Steam para salvar seu loadout.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const persisted = await saveLoadout(steamId, safeLoadout);
      const next = normalizeLoadout(persisted);
      setLoadout(next);
      try {
        localStorage.setItem(LOADOUT_CACHE_KEY, JSON.stringify({ steamId, loadout: next }));
      } catch { /* ignore */ }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const skinDataByTab = {
    knife: skins?.knives,
    weapon: skins?.weapons,
    gloves: skins?.gloves,
  };

  const getSelectedSkin = (tabId, forSlotKey) => {
    if (tabId === 'knife') return forSlotKey ? safeLoadout[forSlotKey] : (safeLoadout.knife_ct ?? safeLoadout.knife_t);
    if (tabId === 'gloves') return forSlotKey ? safeLoadout[forSlotKey] : (safeLoadout.gloves_ct ?? safeLoadout.gloves_t);
    if (tabId === 'weapon') {
      const tf = typeFilter.weapon;
      if (!tf) return null;
      return safeLoadout.weapons?.[tf] ?? Object.values(safeLoadout.weapons || {}).find(
        w => w?.weapon?.id === tf || w?.weapon?.name === tf
      ) ?? null;
    }
    return null;
  };

  const getSelectedTypeIds = (tabId, forSlotKey) => {
    const knifeItem = tabId === 'knife' && forSlotKey ? safeLoadout[forSlotKey] : (tabId === 'knife' ? (safeLoadout.knife_ct ?? safeLoadout.knife_t) : null);
    const glovesItem = tabId === 'gloves' && forSlotKey ? safeLoadout[forSlotKey] : (tabId === 'gloves' ? (safeLoadout.gloves_ct ?? safeLoadout.gloves_t) : null);
    if (tabId === 'knife' && knifeItem?.weapon?.id) return new Set([knifeItem.weapon.id]);
    if (tabId === 'gloves' && glovesItem?.weapon?.id) return new Set([glovesItem.weapon.id]);
    if (tabId === 'weapon' && safeLoadout.weapons) {
      const keys = Object.keys(safeLoadout.weapons);
      const fromValues = Object.values(safeLoadout.weapons).flatMap(w => [w?.weapon?.id, w?.weapon?.name].filter(Boolean));
      return new Set([...keys, ...fromValues]);
    }
    return new Set();
  };

  if (auth.loading || (loading && !skins)) {
    return (
      <div className="loadout-page">
        <div className="loadout-loading">
          <div className="spinner" />
          <span>{auth.loading ? 'VERIFICANDO LOGIN...' : 'CARREGANDO SKINS...'}</span>
        </div>
      </div>
    );
  }

  if (!steamId) {
    return (
      <div className="loadout-page">
        <div className="scanlines" />
        <div className="grid-bg" />
        <header className="header">
          <div className="header-left">
            <Link to="/" className="logo-hex" aria-label="Início" />
            <div>
              <div className="header-title">LOADOUT</div>
              <div className="header-sub">SKINS · PERSONALIZAÇÃO</div>
            </div>
          </div>
          <HamburgerNav activePath="/loadout" auth={auth} profile={profile} returnTo="/loadout" />
        </header>
        <div className="loadout-container">
          <header className="loadout-header">
            <h1 className="loadout-title">LOADOUT</h1>
            <p className="loadout-desc loadout-login-hint">
              Entre com Steam no menu acima para configurar suas skins no servidor.
            </p>
          </header>
          {error && <div className="loadout-error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="loadout-page">
      <div className="scanlines" />
      <div className="grid-bg" />
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo-hex" aria-label="Início" />
          <div>
            <div className="header-title">LOADOUT</div>
            <div className="header-sub">SKINS · PERSONALIZAÇÃO</div>
          </div>
        </div>
        <HamburgerNav activePath="/loadout" auth={auth} profile={profile} returnTo="/loadout" />
      </header>
      <div className="loadout-container">
        <header className="loadout-header">
          <h1 className="loadout-title">LOADOUT</h1>
          <p className="loadout-desc">Escolha as skins que deseja usar no servidor e salve.</p>
        </header>

        {error && (
          <div className="loadout-error">{error}</div>
        )}

        {skins && (
          <>
            {!loadoutFetched ? (
              <div className="loadout-loading-saved">
                <div className="spinner" />
                <span>Carregando loadout salvo...</span>
              </div>
            ) : (
              <section className="loadout-section loadout-character-section">
                <div className="loadout-top-tabs" role="tablist" aria-label="Loadout tabs">
                  <TrackedButton
                    type="button"
                    role="tab"
                    aria-selected={topTab === TAB_INVENTORY}
                    className={`loadout-top-tab${topTab === TAB_INVENTORY ? ' active' : ''}`}
                    onClick={() => setTopTab(TAB_INVENTORY)}
                  >
                    Inventário
                  </TrackedButton>
                  <TrackedButton
                    type="button"
                    role="tab"
                    aria-selected={topTab === TAB_MUSIC}
                    className={`loadout-top-tab${topTab === TAB_MUSIC ? ' active' : ''}`}
                    onClick={() => setTopTab(TAB_MUSIC)}
                  >
                    Kit de músicas
                  </TrackedButton>
                  <TrackedButton
                    type="button"
                    role="tab"
                    aria-selected={topTab === TAB_LAB}
                    className={`loadout-top-tab${topTab === TAB_LAB ? ' active' : ''}`}
                    onClick={() => setTopTab(TAB_LAB)}
                  >
                    Skins Lab
                  </TrackedButton>
                </div>

                {topTab === TAB_INVENTORY && (
                <LoadoutCharacterView
                  side={side}
                  onSideChange={setSide}
                  loadout={safeLoadout}
                  onSlotClick={handleSlotClick}
                  slotsConfig={side === 'ct' ? LOADOUT_SLOTS_CT : LOADOUT_SLOTS_T}
                    onAgentClick={(clickedSide) => {
                      setAgentSearch('');
                      setAgentModal({ open: true, side: clickedSide });
                      setAgentsLoading(true);
                      fetchAgentsByTeam(clickedSide === 'ct' ? 'counter-terrorists' : 'terrorists')
                        .then((list) => setAgents(Array.isArray(list) ? list : []))
                        .catch(() => setAgents([]))
                        .finally(() => setAgentsLoading(false));
                    }}
                    onStattrakToggle={async (weaponId, enabled) => {
                      const base = loadout ?? { knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };
                      const curW = base.weapons?.[weaponId] || {};
                      const next = normalizeLoadout({
                        ...base,
                        weapons: { ...(base.weapons || {}), [weaponId]: { ...curW, stattrak: enabled } },
                      });
                      setLoadout(next);
                      if (steamId) {
                        try { await saveLoadout(steamId, next); } catch { /* ignore */ }
                      }
                    }}
                  onKnifeStattrakToggle={async (slotKey, enabled) => {
                    const base = loadout ?? { knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };
                    const curKnife = base?.[slotKey] || {};
                    const next = normalizeLoadout({
                      ...base,
                      [slotKey]: { ...curKnife, stattrak: enabled },
                    });
                    setLoadout(next);
                    if (steamId) {
                      try { await saveLoadout(steamId, next); } catch { /* ignore */ }
                    }
                  }}
                  />
                )}

                {topTab === TAB_MUSIC && (
                  <div className="music-tab">
                    <div className="music-tab-header">
                      <div className="music-tab-title">Kit de músicas (MVP)</div>
                      <div className="music-tab-sub">Clique para selecionar e salvar no seu loadout.</div>
                    </div>
                    <div className="music-selected-row">
                      <div className="music-selected-title">Selecionado</div>
                      <div className="music-selected-card">
                        {safeLoadout?.music_kit?.image ? (
                          <img src={safeLoadout.music_kit.image} alt={safeLoadout.music_kit.name || ''} />
                        ) : (
                          <div className="music-selected-fallback" />
                        )}
                        <div className="music-selected-name">{safeLoadout?.music_kit?.name || 'Sem kit'}</div>
                        <TrackedButton
                          type="button"
                          className="music-selected-clear"
                          onClick={async () => {
                            const next = normalizeLoadout({ ...(safeLoadout || {}), music_kit: null });
                            setLoadout(next);
                            if (steamId) {
                              try { await saveLoadout(steamId, next); } catch { /* ignore */ }
                            }
                          }}
                        >
                          Remover
                        </TrackedButton>
                      </div>
                    </div>

                    <div className="music-search-row">
                      <input
                        value={musicSearch}
                        onChange={(e) => setMusicSearch(e.target.value)}
                        placeholder="Buscar música..."
                      />
                    </div>

                    <div className="music-kits-grid">
                      {(() => {
                        const all = (musicKitsCatalog || [])
                          // prefer unique by def_index (stattrak duplicates share def_index)
                          .reduce((acc, m) => {
                            const k = String(m?.def_index ?? m?.id);
                            if (!acc.map.has(k)) { acc.map.set(k, true); acc.list.push(m); }
                            return acc;
                          }, { map: new Map(), list: [] }).list
                          .filter((m) => {
                            const q = (musicSearch || '').trim().toLowerCase();
                            if (!q) return true;
                            return String(m?.name || '').toLowerCase().includes(q) || String(m?.id || '').includes(q);
                          });

                        const totalPages = Math.max(1, Math.ceil(all.length / MUSIC_PAGE_SIZE));
                        const page = Math.min(Math.max(1, musicPage), totalPages);
                        const slice = all.slice((page - 1) * MUSIC_PAGE_SIZE, page * MUSIC_PAGE_SIZE);
                        const selectedDef = safeLoadout?.music_kit?.def_index ?? safeLoadout?.music_kit?.id ?? safeLoadout?.music_kit ?? null;

                        return (
                          <>
                            {slice.map((m) => {
                              const selected = selectedDef != null && String(selectedDef) === String(m?.def_index ?? m?.id);
                              return (
                                <MusicKitCard
                                  key={m.id}
                                  kit={m}
                                  selected={selected}
                                  onSelect={async (kit) => {
                                    const next = normalizeLoadout({
                                      ...(safeLoadout || {}),
                                      music_kit: kit ? { def_index: kit?.def_index, id: kit?.id, name: kit?.name, image: kit?.image } : null,
                                    });
                                    setLoadout(next);
                                    if (steamId) {
                                      try { await saveLoadout(steamId, next); } catch { /* ignore */ }
                                    }
                                  }}
                                />
                              );
                            })}

                            <div className="music-pagination">
                              <TrackedButton type="button" disabled={page <= 1} onClick={() => setMusicPage((p) => Math.max(1, p - 1))}>Anterior</TrackedButton>
                              <div className="music-pagination-label">Página {page} / {totalPages}</div>
                              <TrackedButton type="button" disabled={page >= totalPages} onClick={() => setMusicPage((p) => Math.min(totalPages, p + 1))}>Próxima</TrackedButton>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {topTab === TAB_LAB && (
                  <div className="skins-lab">
                    <div className="skins-lab-left">
                      <div className="skins-lab-title">Skins Lab</div>
                      <div className="skins-lab-sub">Escolha uma arma do seu loadout para craft.</div>

                      <div className="skins-lab-weapon-list">
                        {Object.entries(safeLoadout?.weapons || {}).map(([weaponKey, w]) => {
                          const skin = w?.skin ?? w;
                          const img = skin?.image;
                          const name = skin?.name ?? w?.weapon?.name ?? weaponKey;
                          const active = (labWeaponKey ?? '') === weaponKey || (!labWeaponKey && weaponKey === Object.keys(safeLoadout?.weapons || {})[0]);
                          return (
                            <TrackedButton
                              key={weaponKey}
                              type="button"
                              className={`skins-lab-weapon-card${active ? ' active' : ''}`}
                              onClick={() => setLabWeaponKey(weaponKey)}
                            >
                              {img ? <img src={img} alt={name} loading="lazy" /> : <div className="skins-lab-weapon-fallback" />}
                              <div className="skins-lab-weapon-name">{name}</div>
                              <div className="skins-lab-weapon-key">{weaponKey}</div>
                            </TrackedButton>
                          );
                        })}
                        {Object.keys(safeLoadout?.weapons || {}).length === 0 && (
                          <div className="skins-lab-empty">Selecione skins no Inventário para habilitar o Skins Lab.</div>
                        )}
                      </div>
                    </div>

                    <div className="skins-lab-right">
                      {(() => {
                        const weapons = safeLoadout?.weapons || {};
                        const keys = Object.keys(weapons);
                        const selectedKey = labWeaponKey ?? keys[0];
                        if (!selectedKey) return <div className="skins-lab-empty-right">Nenhuma arma selecionada.</div>;

                        const w = weapons[selectedKey] || {};
                        const stickers = Array.isArray(w?.stickers) ? w.stickers : [null, null, null, null];
                        const charm = w?.charm ?? null;

                        const stickerById = (id) => (stickersCatalog || []).find((s) => String(s?.def_index ?? s?.id) === String(id));
                        const keychainById = (id) => (keychainsCatalog || []).find((k) => String(k?.def_index ?? k?.id) === String(id));

                        const setWeaponData = async (patch, opts = { persist: true }) => {
                          const defaultBase = { agent_ct: null, agent_t: null, music_kit: null, knife_ct: null, knife_t: null, weapons: {}, gloves_ct: null, gloves_t: null };
                          const persist = opts.persist !== false && !!steamId;

                          // Quando for para persistir, calculamos "next" diretamente (evita race do React
                          // onde computed pode estar null/antigo quando chamamos saveLoadout).
                          if (persist) {
                            const base = loadout ?? defaultBase;
                            const baseWeapons = base.weapons && typeof base.weapons === 'object' ? base.weapons : {};
                            const curW = baseWeapons[selectedKey] || {};
                            const computed = normalizeLoadout({
                              ...base,
                              weapons: { ...baseWeapons, [selectedKey]: { ...(curW || {}), ...patch } },
                            });
                            setLoadout(computed);
                            try { await saveLoadout(steamId, computed); } catch { /* ignore */ }
                            return;
                          }

                          // Quando persist=false (ex.: durante drag), atualiza só em memória usando prev state.
                          setLoadout((prev) => {
                            const base = prev ?? defaultBase;
                            const baseWeapons = base.weapons && typeof base.weapons === 'object' ? base.weapons : {};
                            const curW = baseWeapons[selectedKey] || {};
                            return normalizeLoadout({
                              ...base,
                              weapons: { ...baseWeapons, [selectedKey]: { ...(curW || {}), ...patch } },
                            });
                          });
                        };

                        const updateSticker = async (idx, patch, opts = { persist: true }) => {
                          const nextArr = [0, 1, 2, 3].map((i) => {
                            const cur = stickers[i] && typeof stickers[i] === 'object' ? stickers[i] : null;
                            if (i !== idx) return cur;
                            return { ...(cur || {}), ...patch };
                          });
                          await setWeaponData({ stickers: nextArr }, opts);
                        };

                        return (
                          <>
                            <div className="skins-lab-editor-title">Editor · {selectedKey}</div>

                              <div className="skins-lab-preview">
                              <div className="skins-lab-preview-bg" ref={previewBoxRef}>
                                {(w?.skin?.image || w?.image) ? (
                                  <img
                                    ref={previewImgRef}
                                    className={`skins-lab-preview-img ${previewRotate ? 'rotate90' : ''}`}
                                    src={w?.skin?.image || w?.image}
                                    alt={w?.skin?.name || w?.name || selectedKey}
                                    draggable={false}
                                    onLoad={(e) => {
                                      // Alguns assets vêm "em pé". Rotaciona pra facilitar o posicionamento.
                                      const img = e.currentTarget;
                                      const nw = img?.naturalWidth || 0;
                                      const nh = img?.naturalHeight || 0;
                                      previewImgMetaRef.current = { w: nw, h: nh };
                                      setPreviewRotate(nh > nw * 1.15);
                                    }}
                                  />
                                ) : (
                                  <div className="skins-lab-preview-img-fallback" />
                                )}
                                {[0, 1, 2, 3].map((idx) => {
                                  const s = stickers[idx];
                                  const st = s?.stickerId ? stickerById(s.stickerId) : null;
                                  if (!st?.image) return null;

                                  const scale = clampNum(s?.scale, 1);
                                  const rot = clampNum(s?.rotation, 0);
                                  const fallbackPreset = STICKER_PRESET_OFFSETS[idx] || { x: 0, y: 0 };
                                  const ox = s?.stickerId ? clampNum(s?.offsetX, fallbackPreset.x) : clampNum(s?.offsetX, 0);
                                  const oy = s?.stickerId ? clampNum(s?.offsetY, fallbackPreset.y) : clampNum(s?.offsetY, 0);

                                  // Convert stored offsets to preview pixels (simple mapping)
                                  const box = previewBoxRef.current?.getBoundingClientRect?.();
                                  const pxRadius = Math.max(90, Math.min(180, Math.floor(((box?.width || 360) * 0.42))));
                                  const px = pxFromOffset(ox, STICKER_RANGE, pxRadius);
                                  const py = pxFromOffset(oy, STICKER_RANGE, pxRadius);

                                  return (
                                    <div
                                      key={idx}
                                      className="skins-lab-sticker-drag"
                                      style={{
                                      transform: `translate(${px}px, ${py}px) rotate(12deg) skewX(-10deg) scale(0.9) rotate(${rot}deg) scale(${clampNum(scale, 0.6)})`,
                                      }}
                                      title={`Sticker ${idx + 1}`}
                                    >
                                      <img src={st.image} alt={st.name || ''} draggable={false} />
                                      <div className="skins-lab-sticker-badge">{idx + 1}</div>
                                    </div>
                                  );
                                })}

                                {(() => {
                                  const kc = charm?.charmId ? keychainById(charm.charmId) : null;
                                  if (!kc?.image) return null;
                                  const ox = charm?.charmId ? clampNum(charm?.offsetX, CHARM_PRESET_OFFSET.x) : clampNum(charm?.offsetX, 0);
                                  const oy = charm?.charmId ? clampNum(charm?.offsetY, CHARM_PRESET_OFFSET.y) : clampNum(charm?.offsetY, 0);
                                  const box = previewBoxRef.current?.getBoundingClientRect?.();
                                  const pxRadius = Math.max(90, Math.min(180, Math.floor(((box?.width || 360) * 0.42))));
                                  const px = pxFromOffset(ox, CHARM_RANGE, pxRadius);
                                  const py = pxFromOffset(oy, CHARM_RANGE, pxRadius);
                                  return (
                                    <div
                                      className="skins-lab-charm-drag"
                                      style={{ transform: `translate(${px}px, ${py}px) rotate(12deg) skewX(-10deg) scale(0.9)` }}
                                      title="Chaveiro"
                                    >
                                      <img src={kc.image} alt={kc.name || ''} draggable={false} />
                                      <div className="skins-lab-charm-badge">C</div>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="skins-lab-preview-hint">Posicionamento predefinido automático (como no plugin).</div>
                            </div>

                            <div className="skins-lab-slots">
                              {[0, 1, 2, 3].map((i) => {
                                const s = stickers[i];
                                const sticker = s?.stickerId ? stickerById(s.stickerId) : null;
                                return (
                                  <div key={i} className="skins-lab-slot">
                                    <div className="skins-lab-slot-label">Sticker {i + 1}</div>
                                    <StickerChip
                                      sticker={sticker}
                                      onClick={() => {
                                        setLabSearch('');
                                        setLabPicker({ open: true, type: 'sticker', idx: i });
                                      }}
                                    />
                                    <div className="skins-lab-controls">
                                      <label>
                                        Wear
                                        <input
                                          type="range"
                                          step="0.01"
                                          min="0"
                                          max="1"
                                          value={s?.wear ?? 1}
                                          onChange={(e) => updateSticker(i, { wear: clamp01(e.target.value, 1) }, { persist: false })}
                                          onMouseUp={(e) => updateSticker(i, { wear: clamp01(e.target.value, 1) }, { persist: true })}
                                          onTouchEnd={(e) => updateSticker(i, { wear: clamp01(e.target.value, 1) }, { persist: true })}
                                        />
                                      </label>
                                      <label>
                                        Scale
                                        <input
                                          type="range"
                                          step="0.01"
                                          min="0.4"
                                          max="1.2"
                                          value={s?.scale ?? 1}
                                          onChange={(e) => updateSticker(i, { scale: clampNum(e.target.value, 1) }, { persist: false })}
                                          onMouseUp={(e) => updateSticker(i, { scale: clampNum(e.target.value, 1) }, { persist: true })}
                                          onTouchEnd={(e) => updateSticker(i, { scale: clampNum(e.target.value, 1) }, { persist: true })}
                                        />
                                      </label>
                                      <label>
                                        Rotation
                                        <input
                                          type="range"
                                          step="1"
                                          min="-180"
                                          max="180"
                                          value={s?.rotation ?? 0}
                                          onChange={(e) => updateSticker(i, { rotation: clampNum(e.target.value, 0) }, { persist: false })}
                                          onMouseUp={(e) => updateSticker(i, { rotation: clampNum(e.target.value, 0) }, { persist: true })}
                                          onTouchEnd={(e) => updateSticker(i, { rotation: clampNum(e.target.value, 0) }, { persist: true })}
                                        />
                                      </label>
                                      <TrackedButton
                                        type="button"
                                        className="skins-lab-clear"
                                        onClick={() => updateSticker(i, { stickerId: null }, { persist: true })}
                                      >
                                        Limpar
                                      </TrackedButton>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skins-lab-slot charm-slot">
                              <div className="skins-lab-slot-label">Chaveiro</div>
                              <KeychainChip
                                keychain={charm?.charmId ? keychainById(charm.charmId) : null}
                                onClick={() => {
                                  setLabSearch('');
                                  setLabPicker({ open: true, type: 'keychain', idx: null });
                                }}
                              />
                              <div className="skins-lab-controls">
                                <label>
                                  Posição
                                  <select
                                    value={charm?.attachIndex ?? 0}
                                    onChange={(e) =>
                                      setWeaponData({
                                        charm: { ...(charm || {}), attachIndex: clampNum(e.target.value, 0), seed: charm?.seed ?? 1 },
                                      })
                                    }
                                  >
                                    <option value={0}>0 (padrão)</option>
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                    <option value={5}>5</option>
                                  </select>
                                </label>
                                <label>Offset Z <input type="range" step="0.01" min="-0.25" max="0.25" value={charm?.offsetZ ?? 0} onChange={(e) => setWeaponData({ charm: { ...(charm || {}), offsetZ: clampNum(e.target.value, 0), seed: charm?.seed ?? 1 } })} /></label>
                                <TrackedButton type="button" className="skins-lab-clear" onClick={() => setWeaponData({ charm: null })}>Remover</TrackedButton>
                              </div>
                            </div>

                            {!!labPicker?.open && (
                              <div className="lab-modal-overlay" onMouseDown={() => setLabPicker({ open: false, type: null, idx: null })}>
                                <div className="lab-modal" onMouseDown={(e) => e.stopPropagation()}>
                                  <div className="lab-modal-header">
                                    <div className="lab-modal-title">{labPicker.type === 'sticker' ? 'Selecionar sticker' : 'Selecionar chaveiro'}</div>
                                    <TrackedButton type="button" className="lab-modal-close" onClick={() => setLabPicker({ open: false, type: null, idx: null })}>✕</TrackedButton>
                                  </div>
                                  <div className="lab-modal-search">
                                    <input value={labSearch} onChange={(e) => setLabSearch(e.target.value)} placeholder="Buscar..." />
                                  </div>
                                  <div className="lab-modal-grid">
                                    {(labPicker.type === 'sticker' ? (stickersCatalog || []) : (keychainsCatalog || []))
                                      .filter((it) => {
                                        const q = (labSearch || '').trim().toLowerCase();
                                        if (!q) return true;
                                        const n = String(it?.name || '').toLowerCase();
                                        return n.includes(q) || String(it?.id || '').includes(q);
                                      })
                                      .slice(0, 250)
                                      .map((it) => (
                                        <TrackedButton
                                          key={it.id}
                                          type="button"
                                          className="lab-modal-item"
                                          onClick={async () => {
                                            if (labPicker.type === 'sticker') {
                                              const preset = STICKER_PRESET_OFFSETS[labPicker.idx] || { x: 0, y: 0 };
                                              await updateSticker(labPicker.idx, {
                                                stickerId: it.def_index ?? it.defIndex ?? it.id,
                                                schema: 1337,
                                                wear: 1,
                                                offsetX: preset.x,
                                                offsetY: preset.y,
                                              });
                                            } else {
                                              // Usa preset fixo no frontend e offsets padrão no payload.
                                              await setWeaponData({
                                                charm: {
                                                  ...(charm || {}),
                                                  charmId: it.def_index ?? it.defIndex ?? it.id,
                                                  seed: charm?.seed ?? 0,
                                                  attachIndex: charm?.attachIndex ?? 0,
                                                  offsetX: CHARM_PRESET_OFFSET.x,
                                                  offsetY: CHARM_PRESET_OFFSET.y,
                                                  offsetZ: 0,
                                                },
                                              });
                                            }
                                            setLabPicker({ open: false, type: null, idx: null });
                                          }}
                                        >
                                          {it.image ? <img src={it.image} alt={it.name || ''} loading="lazy" /> : <div className="lab-chip-fallback" />}
                                          <div className="lab-modal-item-name">{it.name}</div>
                                        </TrackedButton>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </section>
            )}

            {agentModal.open && (
              <div
                className="loadout-agent-modal-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="loadout-agent-title"
                onClick={(e) => e.target === e.currentTarget && setAgentModal({ open: false, side: 'ct' })}
              >
                <div className="loadout-agent-modal">
                  <div className="loadout-agent-modal-header">
                    <h2 id="loadout-agent-title">Selecionar Agent — {agentModal.side === 'ct' ? 'CT' : 'TR'}</h2>
                    <TrackedButton type="button" className="loadout-agent-modal-close" onClick={() => setAgentModal({ open: false, side: 'ct' })} aria-label="Fechar">×</TrackedButton>
                  </div>
                  <div className="loadout-agent-modal-body">
                    <div className="loadout-agent-search-row">
                      <span className="search-icon">⌕</span>
                      <input
                        type="text"
                        className="skin-search-input"
                        placeholder="Buscar agents..."
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                      />
                    </div>
                    {agentsLoading ? (
                      <div className="loadout-agent-loading">Carregando agents...</div>
                    ) : (
                      <div className="loadout-agent-grid">
                        {agents
                          .filter((a) => (agentSearch || '').trim() ? (a?.name || '').toLowerCase().includes(agentSearch.trim().toLowerCase()) : true)
                          .slice(0, 120)
                          .map((a) => (
                            <TrackedButton
                              key={a.id}
                              type="button"
                              className="loadout-agent-card"
                              onClick={async () => {
                                const picked = {
                                  id: a.id,
                                  name: a.name,
                                  team: a.team,
                                  rarity: a.rarity,
                                  image: a.image,
                                  model_player: a.model_player,
                                  original: a.original,
                                  // CharacterDefIndex numérico (ByMykel). Se vier vazio, extrair de agent-5205 — não usar o id literal no plugin.
                                  def_index: (() => {
                                    if (a.def_index != null && String(a.def_index).trim() !== '') return String(a.def_index);
                                    const idStr = a.id != null ? String(a.id) : '';
                                    const m = /^agent-(\d+)$/i.exec(idStr);
                                    return m ? m[1] : idStr;
                                  })(),
                                };
                                const next = agentModal.side === 'ct'
                                  ? { ...safeLoadout, agent_ct: picked }
                                  : { ...safeLoadout, agent_t: picked };
                                setLoadout(next);
                                if (steamId) {
                                  try { await saveLoadout(steamId, next); } catch { /* ignore */ }
                                }
                                setAgentModal({ open: false, side: 'ct' });
                              }}
                            >
                              <img className="loadout-agent-img" src={a.image} alt={a.name} loading="lazy" />
                              <div className="loadout-agent-meta">
                                <div className="loadout-agent-name">{a.name}</div>
                                <div className="loadout-agent-rarity">{a?.rarity?.name || ''}</div>
                              </div>
                            </TrackedButton>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {openSlot && (
              <div
                className="loadout-skin-modal-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="loadout-modal-title"
                onClick={(e) => e.target === e.currentTarget && setOpenSlot(null)}
              >
                <div className="loadout-skin-modal">
                  <div className="loadout-skin-modal-header">
                    <h2 id="loadout-modal-title">Selecionar skin — {openSlot.label}</h2>
                    <TrackedButton
                      type="button"
                      className="loadout-skin-modal-close"
                      onClick={() => setOpenSlot(null)}
                      aria-label="Fechar"
                    >
                      ×
                    </TrackedButton>
                  </div>
                  <div className="loadout-skin-modal-body">
                    <SkinTabContent
                      skins={skinDataByTab[openSlot.type]}
                      selectedSkin={getCurrentSkinForSlot(openSlot)}
                      onSelect={(s, weaponId) => handleSlotSkinSelect(s, weaponId)}
                      search={search[openSlot.type]}
                      onSearch={(v) => handleSearch(openSlot.type, v)}
                      typeFilter={openSlot.type === 'weapon' ? getWeaponFilterTypeForSlot(openSlot.weaponId, getTypesFromSkins(skinDataByTab[openSlot.type])) : typeFilter[openSlot.type]}
                      onTypeFilter={openSlot.type === 'weapon' ? () => {} : (v) => handleTypeFilter(openSlot.type, v)}
                      types={getTypesFromSkins(skinDataByTab[openSlot.type])}
                      selectedTypeIds={getSelectedTypeIds(openSlot.type, openSlot.slotKey)}
                      isWeaponTab={openSlot.type === 'weapon'}
                      loadout={safeLoadout}
                      hideTypeDropdown={openSlot.type === 'weapon'}
                      selectedWeaponSlotKey={openSlot.type === 'weapon' ? openSlot.weaponId : undefined}
                    />
                  </div>
                  <div className="loadout-skin-modal-footer">
                    <TrackedButton
                      type="button"
                      className="loadout-skin-modal-close-btn"
                      onClick={() => setOpenSlot(null)}
                    >
                      Fechar
                    </TrackedButton>
                  </div>
                </div>
              </div>
            )}

           
          </>
        )}
      </div>
    </div>
  );
}
