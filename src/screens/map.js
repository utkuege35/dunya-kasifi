/**
 * map.js — Dünya haritası ekranı
 * Gerçek GeoJSON tabanlı SVG harita
 */

import { getState } from '../utils/state.js';
import { loadWorldMap } from '../utils/loader.js';

let _onCountrySelect = null;

/** Harita ekranını başlat */
export async function initMap(countries, onCountrySelect) {
  _onCountrySelect = onCountrySelect;
  buildMapHTML(countries);
  await injectLandPath();
  refreshStars(countries);
}

/** Harita pinlerindeki yıldızları güncelle */
export function refreshMapStars(countries) {
  refreshStars(countries);
}

function buildMapHTML(countries) {
  const screen = document.getElementById('s-map');
  screen.innerHTML = `
    <div class="topbar">
      <div class="topbar-logo">🌍 Dünya Kâşifi</div>
      <div class="xp-pill">⭐ <span id="xp-map">0</span> XP</div>
    </div>
    <div class="map-wrap">
      <svg class="map-svg" viewBox="0 0 960 500" xmlns="http://www.w3.org/2000/svg">
        ${svgDefs()}
        <rect width="960" height="500" fill="url(#ocean-grad)" rx="12"/>
        ${gridLines()}
        <path id="world-land" fill="url(#land-grad)" stroke="#2a5a38" stroke-width=".6" filter="url(#land-shadow)"/>
        ${countryHighlights(countries)}
        ${countryPins(countries)}
        ${compassRose()}
      </svg>
    </div>
    <div class="map-hint">Gitmek istediğin ülkeye dokun ✈️</div>
  `;

  // Pin tıklama olayları
  countries.forEach(c => {
    const el = document.getElementById(`pin-${c.id}`);
    if (el) el.addEventListener('click', () => _onCountrySelect?.(c));
  });
}

async function injectLandPath() {
  try {
    const data = await loadWorldMap();
    const el = document.getElementById('world-land');
    if (!el) return;
    // Supports both pre-rendered svg-path and topojson formats
    if (data.type === 'svg-path') {
      el.setAttribute('d', data.d);
    } else if (data.objects) {
      el.setAttribute('d', topoToPath(data));
    }
  } catch (e) {
    console.warn('Harita yüklenemedi:', e);
  }
}

function topoToPath(topo) {
  const arcs = topo.arcs;
  const scale = topo.transform.scale;
  const translate = topo.transform.translate;
  let d = '';

  function proj([px, py]) {
    const lon = px * scale[0] + translate[0];
    const lat = py * scale[1] + translate[1];
    return [((lon + 180) / 360 * 960).toFixed(1), ((90 - lat) / 180 * 500).toFixed(1)];
  }

  function arcPts(idx) {
    const rev = idx < 0;
    const arc = arcs[rev ? ~idx : idx];
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x, y]; });
  }

  topo.objects.land.geometries.forEach(geom => {
    const rings = geom.type === 'Polygon' ? [geom.arcs] : geom.arcs;
    rings.forEach(ring => {
      ring.forEach(arcIdxs => {
        let pts = arcIdxs.flatMap(ai => arcPts(ai));
        pts.forEach(([px, py], i) => {
          const [sx, sy] = proj([px, py]);
          d += i === 0 ? `M${sx},${sy}` : `L${sx},${sy}`;
        });
        d += 'Z';
      });
    });
  });

  return d;
}

function refreshStars(countries) {
  const prog = getState().progress;
  countries.forEach(c => {
    const g = document.getElementById(`pstars-${c.id}`);
    if (!g) return;
    const countryProg = prog[c.id] || {};
    const done = c.rooms.filter(r => (countryProg[r.id] || {}).done).length;
    g.innerHTML = c.rooms.map((_, i) =>
      i < done
        ? `<text y="0" x="${(i - 1) * 14}" text-anchor="middle" font-size="12">⭐</text>`
        : `<text y="0" x="${(i - 1) * 14}" text-anchor="middle" font-size="12" fill="#444" font-family="sans-serif">☆</text>`
    ).join('');
  });
}

// ── SVG parçaları ──
function svgDefs() {
  return `
  <defs>
    <radialGradient id="ocean-grad" cx="50%" cy="55%" r="75%">
      <stop offset="0%" stop-color="#0a1e3a"/>
      <stop offset="100%" stop-color="#050d18"/>
    </radialGradient>
    <linearGradient id="land-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e3a28"/>
      <stop offset="100%" stop-color="#122018"/>
    </linearGradient>
    <filter id="land-shadow" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="1" dy="2" stdDeviation="3" flood-color="#000" flood-opacity=".5"/>
    </filter>
  </defs>`;
}

function gridLines() {
  return `
  <line x1="0" y1="250" x2="960" y2="250" stroke="#fff" stroke-opacity=".04" stroke-width="1"/>
  <line x1="480" y1="0" x2="480" y2="500" stroke="#fff" stroke-opacity=".04" stroke-width="1"/>
  <line x1="0" y1="125" x2="960" y2="125" stroke="#fff" stroke-opacity=".02" stroke-width="1" stroke-dasharray="4,8"/>
  <line x1="0" y1="375" x2="960" y2="375" stroke="#fff" stroke-opacity=".02" stroke-width="1" stroke-dasharray="4,8"/>
  <line x1="240" y1="0" x2="240" y2="500" stroke="#fff" stroke-opacity=".02" stroke-width="1" stroke-dasharray="4,8"/>
  <line x1="720" y1="0" x2="720" y2="500" stroke="#fff" stroke-opacity=".02" stroke-width="1" stroke-dasharray="4,8"/>`;
}

// Ülke koordinatları (lon/lat → SVG px)
const PIN_COORDS = {
  japan:     { cx: 797, cy: 295 },
  brazil:    { cx: 275, cy: 292 },
  italy:     { cx: 512, cy: 267 },
  egypt:     { cx: 560, cy: 292 },
  australia: { cx: 756, cy: 403 },
};

function countryHighlights(countries) {
  const radii = { japan: [28,34], brazil: [44,36], italy: [24,26], egypt: [30,24], australia: [58,40] };
  return countries.map(c => {
    const { cx, cy } = PIN_COORDS[c.id] || { cx: 400, cy: 250 };
    const [rx, ry] = radii[c.id] || [30, 28];
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.color}" opacity=".15" style="pointer-events:none"/>`;
  }).join('');
}

function countryPins(countries) {
  return countries.map(c => {
    const { cx, cy } = PIN_COORDS[c.id] || { cx: 400, cy: 250 };
    return `
    <g class="cpin" id="pin-${c.id}" style="cursor:pointer">
      <circle cx="${cx}" cy="${cy}" r="36" fill="${c.color}" opacity=".06"/>
      <circle cx="${cx}" cy="${cy}" r="36" fill="none" stroke="${c.color}" stroke-width="1.5" stroke-dasharray="5,4" opacity=".55"/>
      <circle cx="${cx}" cy="${cy}" r="20" fill="rgba(${hexToRgb(c.color)},.22)" stroke="${c.color}" stroke-width="2"/>
      <text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="22" class="pflag">${c.flag}</text>
      <text x="${cx}" y="${cy + 28}" text-anchor="middle" font-size="10" fill="${lighten(c.color)}"
            font-weight="800" font-family="Nunito,sans-serif" letter-spacing=".5">${c.name.toUpperCase()}</text>
      <g id="pstars-${c.id}" transform="translate(${cx},${cy + 40})"></g>
    </g>`;
  }).join('');
}

function compassRose() {
  return `
  <g transform="translate(46,46)" opacity=".8">
    <circle r="20" fill="rgba(0,0,0,.55)" stroke="rgba(255,255,255,.1)" stroke-width="1"/>
    <polygon points="0,-16 3,-6 -3,-6" fill="#f5a623"/>
    <polygon points="0,16 3,6 -3,6" fill="rgba(255,255,255,.35)"/>
    <polygon points="-16,0 -6,3 -6,-3" fill="rgba(255,255,255,.35)"/>
    <polygon points="16,0 6,3 6,-3" fill="rgba(255,255,255,.35)"/>
    <text text-anchor="middle" y="-7" font-size="8" fill="#f5a623" font-weight="800" font-family="sans-serif">N</text>
    <circle r="3" fill="#f5a623" opacity=".7"/>
  </g>`;
}

// ── Renk yardımcıları ──
function hexToRgb(hex) {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
}
function lighten(hex) {
  return '#' + [1, 3, 5].map(i =>
    Math.min(255, parseInt(hex.slice(i, i + 2), 16) + 60).toString(16).padStart(2, '0')
  ).join('');
}
