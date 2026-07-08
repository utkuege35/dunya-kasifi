/**
 * roomdone.js — Oda tamamlandı ekranı
 */

import { getState } from '../utils/state.js';

const EMOJIS = ['🎉', '🌟', '🏆', '🥳', '🎊'];

/**
 * Oda tamamlandı kartını göster
 * @param {object} result - { stars, correct, total }
 * @param {object} country
 * @param {object} room
 * @param {Function} onNext - "Devam" butonuna basılınca
 * @param {Function} onMap  - "Haritaya Dön" butonuna basılınca
 */
export function showRoomDone(result, country, room, onNext, onMap) {
  const { stars } = result;
  const xpGained = stars * 20;
  const rooms = country.rooms;
  const ci = rooms.findIndex(r => r.id === room.id);
  const nextRoom = rooms[ci + 1];

  const card = document.getElementById('rd-card');
  card.innerHTML = `
    <div class="rd-emoji">${EMOJIS[Math.floor(Math.random() * EMOJIS.length)]}</div>
    <div class="rd-title">${stars === 3 ? 'Mükemmel!' : stars === 2 ? 'Harika!' : 'İyi İş!'}</div>
    <div class="rd-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <div class="rd-xp">+${xpGained} XP <small>kazandın!</small></div>
    <div class="rd-btns">
      <button class="btn-primary" id="rd-next-btn">
        ${nextRoom ? `${nextRoom.icon} ${nextRoom.name} ➡️` : '🌍 Haritaya Dön'}
      </button>
      <button class="btn-secondary" id="rd-map-btn">🌍 Haritaya Dön</button>
    </div>
  `;

  document.getElementById('rd-next-btn').addEventListener('click', () => {
    closeRoomDone();
    if (nextRoom) onNext(nextRoom);
    else onMap();
  });
  document.getElementById('rd-map-btn').addEventListener('click', () => {
    closeRoomDone();
    onMap();
  });

  document.getElementById('rd-overlay').classList.remove('hidden');
}

export function closeRoomDone() {
  document.getElementById('rd-overlay').classList.add('hidden');
}
