/**
 * main.js — Uygulama giriş noktası ve ekran yöneticisi
 */

import { loadState, getState, setState } from './utils/state.js';
import { loadCountries } from './utils/loader.js';
import { initSplash } from './screens/splash.js';
import { initChars } from './screens/chars.js';
import { initMap, refreshMapStars } from './screens/map.js';
import { initGameScreen, stopGameScreen } from './screens/game-screen.js';

// ── Ekran geçişi ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Başlat ──
async function boot() {
  loadState();

  // Ülkeleri yükle
  let countries;
  try {
    countries = await loadCountries();
  } catch (e) {
    console.error('Ülkeler yüklenemedi:', e);
    return;
  }

  // ── SPLASH ──
  initSplash(() => {
    if (getState().char) {
      goToMap();
    } else {
      showScreen('s-chars');
    }
  });
  showScreen('s-splash');

  // ── KARAKTER SEÇİMİ ──
  initChars((charId) => {
    goToMap();
  });

  // ── HARİTA ──
  async function goToMap() {
    showScreen('s-map');
    await initMap(countries, (country) => {
      goToGame(country);
    });
    refreshMapStars(countries);
    updateAllXP();
  }

  // ── OYUN ──
  function goToGame(country) {
    showScreen('s-game');
    initGameScreen(
      country,
      () => { // Haritaya dön
        stopGameScreen();
        goToMap();
      },
      (country, room, result) => { // Oda tamamlandı
        refreshMapStars(countries);
        updateAllXP();
      }
    );
  }
}

function updateAllXP() {
  const xp = getState().xp;
  document.querySelectorAll('[id^="xp-"]').forEach(el => { el.textContent = xp; });
}

// Başlat
boot().catch(console.error);
