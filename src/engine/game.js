/**
 * game.js — Three.js 3D oyun motoru
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { createWorld } from './world.js';
import { createCharacter, updateCharacter } from './player.js';
import { getState } from '../utils/state.js';

// Motor durumu
let state = {
  scene: null, camera: null, renderer: null,
  character: null, mixer: null,
  world: null, country: null,
  clock: null,
  p: { x: 0, z: 0, angle: 0, speed: 0, sprinting: false },
  joyDir: { x: 0, y: 0 },
  sprinting: false,
  nearDoor: null,
  doors: [],
  raf: null,
  W: 0, H: 0,
  onDoorNear: null,
  onUpdate: null,
};

export function initGame(country, canvas, callbacks = {}) {
  if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null; }

  state.country = country;
  state.onDoorNear = callbacks.onDoorNear || null;
  state.onUpdate = callbacks.onUpdate || null;
  state.W = canvas.width = window.innerWidth;
  state.H = canvas.height = window.innerHeight;
  state.joyDir = { x: 0, y: 0 };
  state.sprinting = false;
  state.nearDoor = null;

  // Scene
  const scene = new THREE.Scene();
  state.scene = scene;
  scene.fog = new THREE.Fog(0x87ceeb, 40, 120);
  scene.background = new THREE.Color(0x87ceeb);

  // Camera — third person, karakterin arkasından
  const camera = new THREE.PerspectiveCamera(65, state.W / state.H, 0.1, 200);
  state.camera = camera;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(state.W, state.H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  state.renderer = renderer;

  // Clock
  state.clock = new THREE.Clock();

  // Işıklar
  setupLights(scene, country);

  // Dünya
  const { worldGroup, doors } = createWorld(country, scene);
  state.doors = doors;

  // Karakter
  const { group, mixer } = createCharacter(getState().char || 'alex');
  group.position.set(0, 0, 10);
  scene.add(group);
  state.character = group;
  state.mixer = mixer;
  state.p = { x: 0, z: 10, angle: 0, speed: 0 };

  // Kamera başlangıç
  updateCamera();

  state.raf = requestAnimationFrame(loop);
}

export function stopGame() {
  if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null; }
  if (state.renderer) { state.renderer.dispose(); }
}

export function setJoyDir(x, y) { state.joyDir = { x, y }; }
export function setSprinting(v) { state.sprinting = v; }
export function triggerNearDoor() { return state.nearDoor; }

function loop() {
  state.raf = requestAnimationFrame(loop);
  const delta = state.clock.getDelta();
  update(delta);
  state.renderer.render(state.scene, state.camera);
}

function update(delta) {
  const p = state.p;
  const { x: ix, y: iy } = state.joyDir;
  const len = Math.sqrt(ix * ix + iy * iy);
  const moving = len > 0.08;
  const spd = state.sprinting ? 8 : 4;

  if (moving) {
    const targetAngle = Math.atan2(ix, iy);
    let diff = targetAngle - p.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    p.angle += diff * 0.15;
    p.speed += (spd - p.speed) * 0.12;
  } else {
    p.speed *= 0.75;
  }

  const nx = p.x + Math.sin(p.angle) * p.speed * delta;
  const nz = p.z + Math.cos(p.angle) * p.speed * delta;

  // Collision check
  if (!checkCollision(nx, p.z)) p.x = nx;
  if (!checkCollision(p.x, nz)) p.z = nz;

  // Sınırlar
  p.x = Math.max(-45, Math.min(45, p.x));
  p.z = Math.max(-45, Math.min(45, p.z));

  // Karakter pozisyon + rotasyon
  if (state.character) {
    state.character.position.set(p.x, 0, p.z);
    state.character.rotation.y = p.angle;
  }

  // Animasyon
  if (state.mixer) state.mixer.update(delta);
  if (state.character) {
    updateCharacter(state.character, moving, state.sprinting, p.speed, delta);
  }

  // Kamera takibi
  updateCamera();

  // Kapı kontrol
  checkDoors();

  if (state.onUpdate) state.onUpdate();
}

function updateCamera() {
  const p = state.p;
  const camDist = 8;
  const camHeight = 5;
  const camX = p.x - Math.sin(p.angle) * camDist;
  const camZ = p.z - Math.cos(p.angle) * camDist;
  state.camera.position.lerp(new THREE.Vector3(camX, camHeight, camZ), 0.1);
  state.camera.lookAt(p.x, 1.5, p.z);
}

function checkCollision(x, z) {
  // Bina collision boxes
  for (const door of state.doors) {
    const bx = door.position.x, bz = door.position.z;
    const hw = door.size.w / 2 + 1, hd = door.size.d / 2 + 1;
    if (x > bx - hw && x < bx + hw && z > bz - hd && z < bz + hd) {
      // Kapının önünde ise geç
      if (Math.abs(z - (bz + hd)) < 1.5) return false;
      return true;
    }
  }
  return false;
}

function checkDoors() {
  const p = state.p;
  const c = state.country;
  const prog = getState().progress[c.id] || {};
  let found = null;

  state.doors.forEach((door, i) => {
    if (i >= c.rooms.length) return;
    const dist = Math.sqrt((p.x - door.position.x) ** 2 + (p.z - door.position.z) ** 2);
    if (dist < 4) {
      const room = c.rooms[i];
      const unlocked = i === 0 || (prog[c.rooms[i - 1]?.id] || {}).done;
      if (unlocked) found = { room, idx: i };
    }
  });

  if (found !== state.nearDoor) {
    state.nearDoor = found;
    if (state.onDoorNear) state.onDoorNear(found);
  }
}

function setupLights(scene, country) {
  // Ambient
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  // Güneş
  const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 150;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.bias = -0.001;
  scene.add(sun);

  // Ülkeye göre gökyüzü rengi ve ışık
  const skyColors = {
    japan: 0x1a0a2e, brazil: 0x0a1f0a, italy: 0x040820,
    egypt: 0x180c00, australia: 0x08001a
  };
  scene.background = new THREE.Color(skyColors[country.id] || 0x87ceeb);
  scene.fog = new THREE.Fog(skyColors[country.id] || 0x87ceeb, 50, 130);
}

// Resize
window.addEventListener('resize', () => {
  if (!state.renderer) return;
  state.W = window.innerWidth;
  state.H = window.innerHeight;
  state.camera.aspect = state.W / state.H;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(state.W, state.H);
});
