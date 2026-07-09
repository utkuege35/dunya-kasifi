/**
 * game.js — Top-down oyun motoru
 * Dünya oluşturma, oyuncu hareketi, kamera, render
 */

import { drawPlayer } from './player.js';
import { generateWorld, isSolid } from './world.js';
import { getState } from '../utils/state.js';

export const TILE = 48;
const WORLD_SIZE = 28;

// Ülke renk temaları
const THEMES = {
  japan:     { ground:'#1a1a2e', road:'#2a2040', roadLine:'#403060', tree:'#1a4a1a', building:'#2a1a3a', buildingTop:'#3a2a4a', water:'#0a1a3a', sand:'#3a3a2a', sky:'#0a0518', accent:'#ff3366' },
  brazil:    { ground:'#0a2010', road:'#1a3010', roadLine:'#2a4a10', tree:'#0a3a10', building:'#1a3020', buildingTop:'#2a4a30', water:'#0a1a30', sand:'#2a3a10', sky:'#030e06', accent:'#22dd55' },
  italy:     { ground:'#1a1828', road:'#2a2840', roadLine:'#3a3860', tree:'#182818', building:'#2a2838', buildingTop:'#3a3848', water:'#0a0a2a', sand:'#2a2818', sky:'#040412', accent:'#4499ff' },
  egypt:     { ground:'#2a2010', road:'#3a3018', roadLine:'#4a4020', tree:'#1a3010', building:'#3a2808', buildingTop:'#4a3810', water:'#0a1020', sand:'#3a2c10', sky:'#120800', accent:'#ffcc00' },
  australia: { ground:'#201818', road:'#302828', roadLine:'#403838', tree:'#1a2810', building:'#2a1820', buildingTop:'#3a2830', water:'#080820', sand:'#302010', sky:'#080210', accent:'#aa66ff' },
};

// Motor durumu
let state = {
  country: null,
  world: null,
  theme: null,
  p: { wx: 0, wy: 0, angle: 0, speed: 0, animTime: 0, bobPhase: 0, runT: 0 },
  cam: { wx: 0, wy: 0 },
  joyDir: { x: 0, y: 0 },
  sprinting: false,
  nearDoor: null,
  particles: [],
  time: 0,
  W: 0, H: 0,
  raf: null,
  onDoorNear: null,   // callback(door | null)
  onUpdate: null,     // callback() — her frame
};

/** Oyunu başlat */
export function initGame(country, canvas, callbacks = {}) {
  if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null; }

  state.country = country;
  state.theme = THEMES[country.id] || THEMES.japan;
  state.world = generateWorld(country, WORLD_SIZE, TILE);
  state.W = canvas.width = window.innerWidth;
state.H = canvas.height = window.innerHeight;
  state.p = { wx: TILE * 14.5, wy: TILE * 21, angle: Math.PI * 1.5, speed: 0, animTime: 0, bobPhase: 0, runT: 0 };
  state.cam = { wx: 0, wy: 0 };
  state.joyDir = { x: 0, y: 0 };
  state.sprinting = false;
  state.nearDoor = null;
  state.particles = [];
  state.time = 0;
  state.onDoorNear = callbacks.onDoorNear || null;
  state.onUpdate = callbacks.onUpdate || null;

  const ctx = canvas.getContext('2d');
  state.raf = requestAnimationFrame(() => loop(ctx));
}

/** Oyunu durdur */
export function stopGame() {
  if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null; }
}

/** Joystick yönünü güncelle */
export function setJoyDir(x, y) { state.joyDir = { x, y }; }

/** Sprint durumunu güncelle */
export function setSprinting(v) { state.sprinting = v; }

/** En yakın kapıyı tetikle */
export function triggerNearDoor() { return state.nearDoor; }

// Ana döngü
function loop(ctx) {
  update();
  render(ctx);
  state.raf = requestAnimationFrame(() => loop(ctx));
}

function update() {
  const p = state.p;
  const { x: ix, y: iy } = state.joyDir;
  const len = Math.sqrt(ix * ix + iy * iy);
  const moving = len > 0.08;
  const spd = state.sprinting ? 4.8 : 2.4;

  if (moving) {
    const targetAngle = Math.atan2(iy, ix);
    let diff = targetAngle - p.angle;
    while (diff > Math.PI)  diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    p.angle += diff * 0.18;
    p.speed += (spd - p.speed) * 0.15;
  } else {
    p.speed *= 0.72;
  }

  const nx = p.wx + Math.cos(p.angle) * p.speed;
  const ny = p.wy + Math.sin(p.angle) * p.speed;
  if (!isSolid(nx, p.wy, state.world, TILE, WORLD_SIZE)) p.wx = nx;
  if (!isSolid(p.wx, ny, state.world, TILE, WORLD_SIZE)) p.wy = ny;
  p.wx = Math.max(TILE, Math.min((WORLD_SIZE - 1) * TILE, p.wx));
  p.wy = Math.max(TILE, Math.min((WORLD_SIZE - 1) * TILE, p.wy));

  state.time += 16;
  if (moving) {
    p.animTime += state.sprinting ? 0.18 : 0.10;
    p.bobPhase += state.sprinting ? 0.22 : 0.12;
    p.runT = Math.min(1, p.runT + 0.08);
  } else {
    p.animTime *= 0.9;
    p.runT = Math.max(0, p.runT - 0.06);
    p.bobPhase += 0.02;
  }

  // Kamera takibi
  const tcx = p.wx - state.W * 0.4;
  const tcy = p.wy - state.H * 0.4;
  state.cam.wx += (tcx - state.cam.wx) * 0.1;
  state.cam.wy += (tcy - state.cam.wy) * 0.1;
  state.cam.wx = Math.max(0, Math.min(WORLD_SIZE * TILE - state.W, state.cam.wx));
  state.cam.wy = Math.max(0, Math.min(WORLD_SIZE * TILE - state.H, state.cam.wy));

  // Kapı yakınlığı
  checkDoors();

  // Parçacık efekti
  if (state.time % 22 === 0) {
    state.particles.push({
      wx: p.wx + (Math.random() - .5) * 40,
      wy: p.wy + (Math.random() - .5) * 40,
      vx: (Math.random() - .5) * 0.5,
      vy: -Math.random() * 0.5 - 0.2,
      life: 1, size: Math.random() * 3 + 1,
      color: state.theme.accent, alpha: 0.35,
    });
  }
  state.particles = state.particles.filter(pt => {
    pt.wx += pt.vx; pt.wy += pt.vy; pt.life -= 0.018; return pt.life > 0;
  });

  if (state.onUpdate) state.onUpdate();
}

function checkDoors() {
  const p = state.p;
  const c = state.country;
  const prog = getState().progress[c.id] || {};
  let found = null;

  state.world.roomPositions.forEach((rp, i) => {
    if (i >= c.rooms.length) return;
    const doorWx = (rp.x + 1.5) * TILE;
    const doorWy = (rp.y + 4.5) * TILE;
    const dist = Math.hypot(p.wx - doorWx, p.wy - doorWy);
    if (dist < TILE * 1.8) {
      const room = c.rooms[i];
      const unlocked = i === 0 || (prog[c.rooms[i - 1]?.id] || {}).done;
      if (unlocked) found = { room, idx: i, wx: doorWx, wy: doorWy };
    }
  });

  if (found !== state.nearDoor) {
    state.nearDoor = found;
    if (state.onDoorNear) state.onDoorNear(found);
  }
}

function render(ctx) {
  const { W, H, cam, p, world, theme, country, particles, time } = state;
  const cx = cam.wx, cy = cam.wy;
  ctx.clearRect(0, 0, W, H);

  // Gökyüzü
  ctx.fillStyle = theme.sky;
  ctx.fillRect(0, 0, W, H);

  // Yıldızlar
  const seed = country.id.charCodeAt(0);
  for (let i = 0; i < 55; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.4 + i % 3 * 0.2})`;
    ctx.fillRect((i * 173 + seed * 7) % W, (i * 97 + seed * 3) % (H * 0.6), i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }

  // Ay/güneş
  if (country.id === 'egypt' || country.id === 'brazil') {
    const sg = ctx.createRadialGradient(W - 80, 50, 5, W - 80, 50, 40);
    sg.addColorStop(0, 'rgba(255,220,80,.9)'); sg.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W - 80, 50, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,80,.8)'; ctx.beginPath(); ctx.arc(W - 80, 50, 18, 0, Math.PI * 2); ctx.fill();
  } else {
    const mg = ctx.createRadialGradient(W - 70, 45, 6, W - 70, 45, 30);
    mg.addColorStop(0, 'rgba(220,235,255,.8)'); mg.addColorStop(1, 'rgba(100,140,220,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(W - 70, 45, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(230,240,255,.85)'; ctx.beginPath(); ctx.arc(W - 70, 45, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.sky; ctx.beginPath(); ctx.arc(W - 62, 40, 13, 0, Math.PI * 2); ctx.fill();
  }

  // Uzak arka plan
  drawFarBG(ctx, W, H, cx, theme, country);

  // Tile'lar
  const startTX = Math.max(0, Math.floor(cx / TILE) - 1);
  const startTY = Math.max(0, Math.floor(cy / TILE) - 1);
  const endTX = Math.min(WORLD_SIZE, startTX + Math.ceil(W / TILE) + 3);
  const endTY = Math.min(WORLD_SIZE, startTY + Math.ceil(H / TILE) + 3);

  for (let ty = startTY; ty < endTY; ty++) {
    for (let tx = startTX; tx < endTX; tx++) {
      drawTile(ctx, world.tiles[ty][tx], tx * TILE - cx, ty * TILE - cy, tx, ty, theme, country, time);
    }
  }

  // Binalar (odalar)
  const prog = getState().progress[country.id] || {};
  country.rooms.forEach((room, i) => {
    const rp = world.roomPositions[i]; if (!rp) return;
    const unlocked = i === 0 || (prog[country.rooms[i - 1]?.id] || {}).done;
    const done = (prog[room.id] || {}).done;
    drawBuilding(ctx, rp.x * TILE - cx, rp.y * TILE - cy, room, unlocked, done, theme, country.color);
  });

  // Parçacıklar
  particles.forEach(pt => {
    const sx = pt.wx - cx, sy = pt.wy - cy;
    ctx.save(); ctx.globalAlpha = pt.life * pt.alpha;
    ctx.fillStyle = pt.color; ctx.shadowBlur = 8; ctx.shadowColor = pt.color;
    ctx.beginPath(); ctx.arc(sx, sy, pt.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // Oyuncu gölgesi
  const px = p.wx - cx, py = p.wy - cy;
  ctx.save(); ctx.globalAlpha = 0.3;
  ctx.fillStyle = 'rgba(0,0,0,.6)';
  ctx.beginPath(); ctx.ellipse(px, py + 6, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Oyuncu
  drawPlayer(ctx, px, py, p.angle, p.animTime, p.speed, p.runT, getState().char);

  // Kapı oku
  if (state.nearDoor) {
    const d = state.nearDoor;
    const sx = d.wx - cx, sy = d.wy - cy;
    const t = time / 400;
    ctx.save();
    ctx.fillStyle = country.color; ctx.shadowBlur = 14; ctx.shadowColor = country.color;
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('▼', sx, sy - 28 + Math.sin(t) * 5);
    ctx.restore();
  }

  // Minimap
  drawMinimap(ctx, W, H, world, theme, country, p, prog);
}

function drawFarBG(ctx, W, H, cx, theme, country) {
  const off = cx * 0.12;
  ctx.save(); ctx.globalAlpha = 0.15;
  const drawShape = (fn) => fn();
  if (country.id === 'japan') {
    ctx.fillStyle = '#660020';
    for (let i = 0; i < 5; i++) {
      const bx = 50 + i * 420 - off % 420;
      const bh = H * 0.5;
      for (let f = 0; f < 3; f++) {
        const fw = 60 - f * 14;
        ctx.fillRect(bx - fw / 2, H - bh * 0.4 + f * bh * 0.18, fw, 8);
        ctx.fillRect(bx - fw / 2 + 8, H - bh * 0.4 + f * bh * 0.18 + 8, fw - 16, bh * 0.18);
      }
    }
  } else if (country.id === 'egypt') {
    ctx.fillStyle = '#2a1800';
    for (let i = 0; i < 4; i++) {
      const bx = 100 + i * 480 - off % 480; const bh = H * 0.45;
      ctx.beginPath(); ctx.moveTo(bx, H); ctx.lineTo(bx + bh * 0.8, H - bh); ctx.lineTo(bx + bh * 1.6, H); ctx.fill();
    }
  } else if (country.id === 'brazil') {
    ctx.fillStyle = '#003300';
    for (let i = 0; i < 4; i++) {
      const bx = 80 + i * 500 - off % 500;
      ctx.beginPath(); ctx.moveTo(bx - 80, H); ctx.lineTo(bx, H - H * 0.4); ctx.lineTo(bx + 80, H); ctx.fill();
    }
  }
  ctx.restore();
}

function drawTile(ctx, tile, sx, sy, tx, ty, theme, country, time) {
  const S = TILE;
  if (tile === 0) {
    const shade = (tx + ty) % 2 === 0 ? 0 : 6;
    ctx.fillStyle = adjustBrightness(theme.ground, shade);
    ctx.fillRect(sx, sy, S, S);
  } else if (tile === 1) {
    ctx.fillStyle = theme.road; ctx.fillRect(sx, sy, S, S);
    if (tx % 4 === 0) { ctx.fillStyle = theme.roadLine; ctx.fillRect(sx + S / 2 - 2, sy, 4, S); }
  } else if (tile === 3) {
    ctx.fillStyle = theme.ground; ctx.fillRect(sx, sy, S, S);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(sx + S / 2 + 4, sy + S / 2 + 6, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3a18'; ctx.fillRect(sx + S / 2 - 4, sy + S / 2 - 8, 8, 16);
    ctx.fillStyle = adjustBrightness(theme.tree, -15);
    ctx.beginPath(); ctx.arc(sx + S / 2, sy + S / 2 - 6, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.tree;
    ctx.beginPath(); ctx.arc(sx + S / 2 - 3, sy + S / 2 - 10, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = adjustBrightness(theme.tree, 20);
    ctx.beginPath(); ctx.arc(sx + S / 2 + 2, sy + S / 2 - 14, 9, 0, Math.PI * 2); ctx.fill();
  } else if (tile === 4) {
    const wave = Math.sin(time / 800 + tx * 0.5 + ty * 0.5) * 0.5 + 0.5;
    ctx.fillStyle = theme.water; ctx.fillRect(sx, sy, S, S);
    ctx.strokeStyle = `rgba(100,160,255,${0.15 + wave * 0.1})`; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const wo = Math.sin(time / 600 + i) * 4;
      ctx.beginPath(); ctx.moveTo(sx, sy + 12 + i * 14 + wo); ctx.lineTo(sx + S, sy + 12 + i * 14 + wo); ctx.stroke();
    }
  } else if (tile === 5) {
    ctx.fillStyle = theme.sand; ctx.fillRect(sx, sy, S, S);
  } else if (tile === 2) {
    ctx.fillStyle = theme.building; ctx.fillRect(sx, sy, S, S);
  }
}

function drawBuilding(ctx, sx, sy, room, unlocked, done, theme, color) {
  const S = TILE, BW = 4 * S, BH = 4 * S;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(sx + 8, sy + 8, BW, BH);
  const bg = ctx.createLinearGradient(sx, sy, sx, sy + BH);
  bg.addColorStop(0, theme.buildingTop); bg.addColorStop(1, theme.building);
  ctx.fillStyle = bg; ctx.fillRect(sx, sy, BW, BH);
  ctx.strokeStyle = color + '44'; ctx.lineWidth = 2; ctx.strokeRect(sx + 1, sy + 1, BW - 2, BH - 2);
  for (let wy2 = 1; wy2 < 3; wy2++) for (let wx2 = 0; wx2 < 3; wx2++) {
    ctx.fillStyle = 'rgba(255,220,100,.07)'; ctx.fillRect(sx + wx2 * S + 8, sy + wy2 * S + 8, S - 16, S - 16);
    ctx.strokeStyle = 'rgba(255,220,100,.12)'; ctx.lineWidth = 1;
    ctx.strokeRect(sx + wx2 * S + 8, sy + wy2 * S + 8, S - 16, S - 16);
  }
  ctx.fillStyle = adjustBrightness(theme.buildingTop, 15); ctx.fillRect(sx + 4, sy + 4, BW - 8, 12);
  ctx.font = '24px serif'; ctx.textAlign = 'center';
  ctx.fillText(room.icon, sx + BW / 2, sy + BH / 2 + 8);
  ctx.fillStyle = unlocked ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)';
  ctx.font = 'bold 10px "Nunito",sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(room.name, sx + BW / 2, sy - 8);
  const doorX = sx + S + 4; const doorY = sy + BH;
  if (unlocked) {
    ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = color;
    ctx.fillStyle = color; ctx.fillRect(doorX, doorY - 6, S - 8, 12);
    ctx.restore();
    ctx.fillStyle = adjustBrightness(color, -30); ctx.fillRect(doorX + 4, doorY - 4, S - 16, 8);
    if (done) { ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.fillText('⭐', sx + BW / 2, sy - 22); }
  } else {
    ctx.fillStyle = '#333'; ctx.fillRect(doorX, doorY - 6, S - 8, 12);
    ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.fillText('🔒', sx + BW / 2, sy + BH / 2 - 16);
  }
  ctx.textAlign = 'left';
}

function drawMinimap(ctx, W, H, world, theme, country, p, prog) {
  const MM = 90, pad = 10, ts = MM / WORLD_SIZE;
  const mx = W - MM - pad, my = pad;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(mx - 2, my - 2, MM + 4, MM + 4, 6); ctx.fill(); ctx.stroke();
  for (let ty = 0; ty < WORLD_SIZE; ty++) for (let tx = 0; tx < WORLD_SIZE; tx++) {
    const t = world.tiles[ty][tx];
    ctx.fillStyle = t === 1 ? theme.road : (t === 2 || t >= 10) ? theme.building : t === 3 ? theme.tree : t === 4 ? '#0a1a40' : t === 5 ? theme.sand : theme.ground;
    ctx.fillRect(mx + tx * ts, my + ty * ts, ts + 0.5, ts + 0.5);
  }
  ctx.fillStyle = '#fff'; ctx.shadowBlur = 4; ctx.shadowColor = '#fff';
  ctx.beginPath(); ctx.arc(mx + (p.wx / TILE) * ts, my + (p.wy / TILE) * ts, 3, 0, Math.PI * 2); ctx.fill();
  country.rooms.forEach((r, i) => {
    const rp = world.roomPositions[i]; if (!rp) return;
    const done = (prog[r.id] || {}).done;
    ctx.fillStyle = done ? '#66bb6a' : country.color; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(mx + (rp.x + 2) * ts, my + (rp.y + 2) * ts, 4, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

export function adjustBrightness(hex, amt) {
  if (!hex || hex[0] !== '#') return hex;
  return '#' + [1, 3, 5].map(i =>
    Math.min(255, Math.max(0, parseInt(hex.slice(i, i + 2), 16) + amt))
      .toString(16).padStart(2, '0')
  ).join('');
}
