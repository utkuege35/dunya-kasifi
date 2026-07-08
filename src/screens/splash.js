/**
 * splash.js — Açılış ekranı
 */

export function initSplash(onStart) {
  const screen = document.getElementById('s-splash');
  screen.innerHTML = `
    <span class="splash-globe">🌍</span>
    <h1 class="splash-title">Dünya Kâşifi</h1>
    <p class="splash-sub">Dünyayı gezerek İngilizce öğren — her ülkede yeni maceralar!</p>
    <button class="btn-primary" id="splash-start">Maceraya Başla 🚀</button>
  `;
  document.getElementById('splash-start').addEventListener('click', onStart);
}
