/**
 * chars.js — Karakter seçim ekranı
 */

import { setState } from '../utils/state.js';

const CHARACTERS = [
  {
    id: 'alex', name: 'Alex', role: '🧭 Kaşif',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <ellipse cx="40" cy="48" rx="12" ry="6" fill="rgba(0,0,0,.3)"/>
      <ellipse cx="40" cy="42" rx="18" ry="10" fill="#3a7fd4"/>
      <circle cx="40" cy="40" r="10" fill="#f5c07a"/>
      <rect x="33" y="30" width="14" height="8" rx="7" fill="#7a4520"/>
      <circle cx="37" cy="40" r="2" fill="#2d1a0a"/>
      <circle cx="43" cy="40" r="2" fill="#2d1a0a"/>
      <rect x="22" y="38" width="8" height="10" rx="4" fill="#3a7fd4"/>
      <rect x="50" y="38" width="8" height="10" rx="4" fill="#3a7fd4"/>
      <rect x="28" y="50" width="10" height="14" rx="5" fill="#1a3a6a"/>
      <rect x="42" y="50" width="10" height="14" rx="5" fill="#1a3a6a"/>
    </svg>`
  },
  {
    id: 'maya', name: 'Maya', role: '📚 Bilge',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <ellipse cx="40" cy="48" rx="12" ry="6" fill="rgba(0,0,0,.3)"/>
      <ellipse cx="40" cy="42" rx="18" ry="10" fill="#e84393"/>
      <circle cx="40" cy="40" r="10" fill="#e8a87c"/>
      <path d="M30 34 Q40 26 50 34" fill="#1a0a30"/>
      <rect x="29" y="37" width="7" height="5" rx="2.5" fill="none" stroke="#4a9de0" stroke-width="1.5"/>
      <rect x="44" y="37" width="7" height="5" rx="2.5" fill="none" stroke="#4a9de0" stroke-width="1.5"/>
      <circle cx="32" cy="39" r="1.5" fill="#1a1a2e"/>
      <circle cx="47" cy="39" r="1.5" fill="#1a1a2e"/>
      <rect x="20" y="38" width="8" height="10" rx="4" fill="#e84393"/>
      <rect x="52" y="38" width="8" height="10" rx="4" fill="#e84393"/>
      <ellipse cx="40" cy="58" rx="14" ry="10" fill="#8a20a0"/>
    </svg>`
  },
  {
    id: 'leo', name: 'Leo', role: '⚔️ Savaşçı',
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <ellipse cx="40" cy="48" rx="12" ry="6" fill="rgba(0,0,0,.3)"/>
      <ellipse cx="40" cy="42" rx="18" ry="10" fill="#2ea850"/>
      <circle cx="40" cy="40" r="10" fill="#c47840"/>
      <path d="M31 33 L35 27 L38 33 L40 25 L42 33 L45 27 L49 33" fill="#1a0800" stroke="#1a0800" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="37" cy="40" r="2" fill="#1a0800"/>
      <circle cx="43" cy="40" r="2" fill="#1a0800"/>
      <rect x="22" y="37" width="8" height="12" rx="4" fill="#2ea850"/>
      <rect x="50" y="37" width="8" height="12" rx="4" fill="#2ea850"/>
      <rect x="13" y="35" width="4" height="22" rx="2" fill="#c0c8d8"/>
      <rect x="11" y="43" width="8" height="3" rx="1.5" fill="#c0a030"/>
      <rect x="28" y="50" width="10" height="16" rx="5" fill="#1a3a1a"/>
      <rect x="42" y="50" width="10" height="16" rx="5" fill="#1a3a1a"/>
    </svg>`
  },
];

/** Karakter seçim ekranını oluştur */
export function initChars(onSelect) {
  const screen = document.getElementById('s-chars');
  screen.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 0;">
      <p class="chars-title">Karakterini Seç</p>
      <p class="chars-sub">Hangi kaşif olmak istersin?</p>
      <div class="chars-grid">
        ${CHARACTERS.map(c => `
          <div class="char-card" data-char="${c.id}">
            ${c.svg}
            <div class="char-name">${c.name}</div>
            <div class="char-role">${c.role}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  screen.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
      const charId = card.dataset.char;
      setState({ char: charId });
      onSelect(charId);
    });
  });
}
