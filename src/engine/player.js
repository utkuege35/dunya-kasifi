/**
 * player.js — Top-down karakter çizimi
 * Canvas 2D ile kuş bakışı perspektif
 */

import { adjustBrightness } from './game.js';

const CHAR_STYLES = {
  alex: { skin: '#f5c07a', hair: '#4a2800', body: '#3a7fd4', legs: '#1a3a6a', boot: '#2d1500', acc: '#5c3317' },
  maya: { skin: '#e8a87c', hair: '#1a0a30', body: '#e84393', legs: '#8a20a0', boot: '#1a0830', acc: '#f5d040' },
  leo:  { skin: '#c47840', hair: '#1a0800', body: '#2ea850', legs: '#1a3a1a', boot: '#2d1500', acc: '#c0a030' },
};

/**
 * Top-down karakteri çiz
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Ekran X
 * @param {number} y - Ekran Y
 * @param {number} angle - Yön açısı (radyan)
 * @param {number} animTime - Yürüyüş animasyon zamanı
 * @param {number} speed - Hız
 * @param {number} runT - Koşu oranı (0-1)
 * @param {string} charId - 'alex' | 'maya' | 'leo'
 */
export function drawPlayer(ctx, x, y, angle, animTime, speed, runT, charId = 'alex') {
  const S = CHAR_STYLES[charId] || CHAR_STYLES.alex;
  const moving = speed > 0.3;
  const stride = moving ? Math.sin(animTime) * 12 : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);

  // Ayaklar
  [[-8, stride], [8, -stride]].forEach(([ox, oy]) => {
    ctx.save();
    ctx.translate(ox, 8 + oy);
    ctx.fillStyle = S.boot;
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Bacaklar
  [[-7, stride * 0.5], [7, -stride * 0.5]].forEach(([ox, oy]) => {
    ctx.save();
    ctx.translate(ox, 4 + oy);
    ctx.fillStyle = S.legs;
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Gövde
  const bodyG = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
  bodyG.addColorStop(0, adjustBrightness(S.body, 25));
  bodyG.addColorStop(1, S.body);
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath(); ctx.ellipse(-4, -4, 5, 4, Math.PI * 0.25, 0, Math.PI * 2); ctx.fill();

  // Kollar
  [[-14, stride * 0.4], [14, -stride * 0.4]].forEach(([ox, oy]) => {
    ctx.save();
    ctx.translate(ox, -2 + oy);
    ctx.fillStyle = S.body;
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = S.skin; ctx.beginPath(); ctx.arc(0, 8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Boyun
  ctx.fillStyle = S.skin; ctx.beginPath(); ctx.ellipse(0, -8, 4, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Baş
  const headG = ctx.createRadialGradient(-3, -16, 2, 0, -14, 13);
  headG.addColorStop(0, adjustBrightness(S.skin, 20)); headG.addColorStop(1, S.skin);
  ctx.fillStyle = headG; ctx.beginPath(); ctx.arc(0, -14, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.arc(-4, -17, 5, 0, Math.PI * 2); ctx.fill();

  // Saç / aksesuar
  ctx.fillStyle = S.hair;
  if (charId === 'alex') {
    ctx.beginPath(); ctx.ellipse(0, -14, 15, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = adjustBrightness(S.hair, 20);
    ctx.beginPath(); ctx.ellipse(0, -14, 11, 11, 0, 0, Math.PI * 2); ctx.fill();
  } else if (charId === 'leo') {
    ctx.beginPath(); ctx.arc(0, -14, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = adjustBrightness(S.hair, 15);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(Math.cos(a) * 18, -14 + Math.sin(a) * 18);
      ctx.lineTo(Math.cos(a + 0.3) * 12, -14 + Math.sin(a + 0.3) * 12);
      ctx.fill();
    }
  } else {
    ctx.beginPath(); ctx.arc(0, -14, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = adjustBrightness(S.hair, 10);
    ctx.beginPath(); ctx.arc(0, -20, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = S.acc; ctx.beginPath(); ctx.arc(5, -20, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Gözler
  ctx.fillStyle = 'rgba(0,0,0,.7)';
  ctx.beginPath(); ctx.arc(-5, -13, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -13, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.beginPath(); ctx.arc(-4, -14, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -14, 1, 0, Math.PI * 2); ctx.fill();

  // Maya gözlüğü
  if (charId === 'maya') {
    ctx.strokeStyle = '#4a9de0'; ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -15, 8, 5); ctx.strokeRect(2, -15, 8, 5);
    ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(2, -12); ctx.stroke();
  }

  // Leo yara izi
  if (charId === 'leo') {
    ctx.strokeStyle = 'rgba(140,60,20,.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(7, -15); ctx.stroke();
  }

  ctx.restore();
}
