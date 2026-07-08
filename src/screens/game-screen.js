/**
 * game-screen.js — Oyun ekranı kontrolcüsü
 * HUD, joystick, kapı prompt yönetimi
 */

import { initGame, stopGame, setJoyDir, setSprinting, triggerNearDoor } from '../engine/game.js';
import { startQuestionSession } from '../ui/questions.js';
import { showRoomDone } from '../ui/roomdone.js';
import { getState } from '../utils/state.js';

let _onLeave = null;
let _onRoomComplete = null;
let _currentCountry = null;

/** Oyun ekranını başlat */
export function initGameScreen(country, onLeave, onRoomComplete) {
  _onLeave = onLeave;
  _onRoomComplete = onRoomComplete;
  _currentCountry = country;

  buildHUD(country);
  updateXPDisplay();
  initJoystick();
  initKeyboard();
  initRunButton();
  initDoorPrompt();

  const canvas = document.getElementById('cvs');
  initGame(country, canvas, {
    onDoorNear: handleDoorNear,
    onUpdate: updateXPDisplay,
  });
}

/** Oyunu durdur */
export function stopGameScreen() {
  stopGame();
}

function buildHUD(country) {
  document.getElementById('game-hud').innerHTML = `
    <button id="hud-back">← Harita</button>
    <span id="hud-country">${country.flag} ${country.name}</span>
    <span class="xp-pill">⭐ <span id="xp-game">0</span></span>
  `;
  document.getElementById('hud-back').addEventListener('click', () => {
    stopGame();
    _onLeave?.();
  });
}

function updateXPDisplay() {
  const el = document.getElementById('xp-game');
  if (el) el.textContent = getState().xp;
  const mapEl = document.getElementById('xp-map');
  if (mapEl) mapEl.textContent = getState().xp;
}

// ── Joystick ──
function initJoystick() {
  const wrap = document.getElementById('jstick-wrap');
  const knob = document.getElementById('jstick-knob');
  const R = 35;
  let active = false;

  function move(cx, cy) {
    const rect = wrap.getBoundingClientRect();
    const ox = cx - rect.left - 60;
    const oy = cy - rect.top - 60;
    const dist = Math.sqrt(ox * ox + oy * oy);
    const clamped = Math.min(dist, R);
    const a = Math.atan2(oy, ox);
    const nx = Math.cos(a) * clamped;
    const ny = Math.sin(a) * clamped;
    knob.style.left = (35 + nx) + 'px';
    knob.style.top  = (35 + ny) + 'px';
    setJoyDir(nx / R, ny / R);
  }

  function end() {
    active = false;
    knob.style.left = '35px';
    knob.style.top  = '35px';
    setJoyDir(0, 0);
  }

  wrap.addEventListener('touchstart', e => { e.preventDefault(); active = true; move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  wrap.addEventListener('touchmove',  e => { e.preventDefault(); if (active) move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  wrap.addEventListener('touchend',   e => { e.preventDefault(); end(); }, { passive: false });
  wrap.addEventListener('mousedown',  e => { active = true; move(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => { if (active) move(e.clientX, e.clientY); });
  window.addEventListener('mouseup',   () => { if (active) end(); });
}

// ── Klavye ──
const KB = {};
function initKeyboard() {
  window.addEventListener('keydown', e => {
    KB[e.key] = true;
    if (e.key === 'Shift') setSprinting(true);
    if (e.key === 'Enter') {
      const door = triggerNearDoor();
      if (door) openDoor(door.room);
    }
    updateKeyDir();
  });
  window.addEventListener('keyup', e => {
    delete KB[e.key];
    if (e.key === 'Shift') setSprinting(false);
    updateKeyDir();
  });
}

function updateKeyDir() {
  let x = 0, y = 0;
  if (KB['ArrowLeft']  || KB['a']) x = -1;
  if (KB['ArrowRight'] || KB['d']) x =  1;
  if (KB['ArrowUp']    || KB['w']) y = -1;
  if (KB['ArrowDown']  || KB['s']) y =  1;
  setJoyDir(x, y);
}

// ── Sprint butonu ──
function initRunButton() {
  const btn = document.getElementById('run-btn');
  btn.addEventListener('touchstart', e => { e.preventDefault(); setSprinting(true); btn.classList.add('pressed'); }, { passive: false });
  btn.addEventListener('touchend',   e => { e.preventDefault(); setSprinting(false); btn.classList.remove('pressed'); }, { passive: false });
  btn.addEventListener('mousedown',  () => { setSprinting(true); btn.classList.add('pressed'); });
  window.addEventListener('mouseup', () => { setSprinting(false); btn.classList.remove('pressed'); });
}

// ── Kapı prompt ──
function initDoorPrompt() {
  document.getElementById('door-prompt').addEventListener('click', () => {
    const door = triggerNearDoor();
    if (door) openDoor(door.room);
  });
}

function handleDoorNear(door) {
  const prompt = document.getElementById('door-prompt');
  if (door) {
    const prog = getState().progress[_currentCountry.id] || {};
    const done = (prog[door.room.id] || {}).done;
    document.getElementById('dp-icon').textContent = done ? '🔄' : door.room.icon;
    document.getElementById('dp-txt').textContent = door.room.name;
    prompt.classList.remove('hidden');
  } else {
    prompt.classList.add('hidden');
  }
}

function openDoor(room) {
  document.getElementById('door-prompt').classList.add('hidden');
  startQuestionSession(_currentCountry, room, (result) => {
    showRoomDone(
      result,
      _currentCountry,
      room,
      (nextRoom) => {
        // Sonraki oda — oyun devam eder
        _onRoomComplete?.(_currentCountry, room, result);
      },
      () => {
        stopGame();
        _onLeave?.();
      }
    );
    _onRoomComplete?.(_currentCountry, room, result);
  });
}
