import { loadState, getState } from './utils/state.js';
import { loadCountries } from './utils/loader.js';
import { initSplash } from './screens/splash.js';
import { initChars } from './screens/chars.js';
import { initMap, refreshMapStars } from './screens/map.js';
import { initGameScreen, stopGameScreen } from './screens/game-screen.js';

let countries = [];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function boot() {
  loadState();

  // Önce splash göster
  initSplash(async () => {
    if (!countries.length) {
      try { countries = await loadCountries(); }
      catch (e) { alert('Veri yüklenemedi: ' + e.message); return; }
    }
    if (getState().char) { goToMap(); }
    else { initChars(() => goToMap()); showScreen('s-chars'); }
  });
  showScreen('s-splash');

  // Arka planda yükle
  try { countries = await loadCountries(); }
  catch (e) { console.warn('Arka plan yükleme başarısız:', e); }
}

async function goToMap() {
  showScreen('s-map');
  await initMap(countries, (country) => goToGame(country));
  refreshMapStars(countries);
  updateAllXP();
}

function goToGame(country) {
  showScreen('s-game');
  initGameScreen(
    country,
    () => { stopGameScreen(); goToMap(); },
    () => { refreshMapStars(countries); updateAllXP(); }
  );
}

function updateAllXP() {
  const xp = getState().xp;
  document.querySelectorAll('[id^="xp-"]').forEach(el => { el.textContent = xp; });
}

boot().catch(console.error);
