/**
 * player.js — 3D karakter oluşturucu ve animasyon
 * Three.js ile detaylı karakter modeli
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const CHAR_COLORS = {
  alex: { skin: 0xf5c07a, hair: 0x4a2800, top: 0x3a7fd4, bottom: 0x1a3a6a, shoe: 0x2d1500, accent: 0xffcc44 },
  maya: { skin: 0xe8a87c, hair: 0x1a0a30, top: 0xe84393, bottom: 0x8a20a0, shoe: 0x1a0830, accent: 0xf5d040 },
  leo:  { skin: 0xc47840, hair: 0x1a0800, top: 0x2ea850, bottom: 0x1a3a1a, shoe: 0x2d1500, accent: 0xc0a030 },
};

export function createCharacter(charId = 'alex') {
  const colors = CHAR_COLORS[charId] || CHAR_COLORS.alex;
  const group = new THREE.Group();

  // Materyaller
  const mat = (color, emissive = 0x000000, emissiveInt = 0) =>
    new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: emissiveInt });

  const skinMat  = mat(colors.skin);
  const hairMat  = mat(colors.hair);
  const topMat   = mat(colors.top);
  const bottomMat = mat(colors.bottom);
  const shoeMat  = mat(colors.shoe);
  const accentMat = mat(colors.accent, colors.accent, 0.2);

  // ── BACAKLAR ──
  const legGeo = new THREE.CapsuleGeometry(0.18, 0.7, 4, 8);
  const legL = new THREE.Mesh(legGeo, bottomMat);
  legL.position.set(-0.22, 0.65, 0);
  legL.castShadow = true;
  group.add(legL);

  const legR = new THREE.Mesh(legGeo, bottomMat);
  legR.position.set(0.22, 0.65, 0);
  legR.castShadow = true;
  group.add(legR);

  // Ayakkabılar
  const shoeGeo = new THREE.BoxGeometry(0.28, 0.15, 0.4);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(-0.22, 0.18, 0.05);
  group.add(shoeL);
  const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
  shoeR.position.set(0.22, 0.18, 0.05);
  group.add(shoeR);

  // ── GÖVDE ──
  const bodyGeo = new THREE.CapsuleGeometry(0.32, 0.6, 4, 8);
  const body = new THREE.Mesh(bodyGeo, topMat);
  body.position.set(0, 1.45, 0);
  body.castShadow = true;
  group.add(body);

  // Bel (kemer)
  const beltGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.12, 12);
  const belt = new THREE.Mesh(beltGeo, mat(colors.shoe));
  belt.position.set(0, 1.08, 0);
  group.add(belt);

  // Kemer tokası
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.08), accentMat);
  buckle.position.set(0, 1.08, 0.35);
  group.add(buckle);

  // ── KOLLAR ──
  const armGeo = new THREE.CapsuleGeometry(0.12, 0.55, 4, 8);

  const armL = new THREE.Mesh(armGeo, topMat);
  armL.position.set(-0.48, 1.45, 0);
  armL.rotation.z = 0.15;
  armL.castShadow = true;
  group.add(armL);

  const armR = new THREE.Mesh(armGeo, topMat);
  armR.position.set(0.48, 1.45, 0);
  armR.rotation.z = -0.15;
  armR.castShadow = true;
  group.add(armR);

  // Eller
  const handGeo = new THREE.SphereGeometry(0.13, 8, 8);
  const handL = new THREE.Mesh(handGeo, skinMat);
  handL.position.set(-0.5, 1.05, 0);
  group.add(handL);
  const handR = new THREE.Mesh(handGeo, skinMat);
  handR.position.set(0.5, 1.05, 0);
  group.add(handR);

  // ── BOYUN ──
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 0.2, 8),
    skinMat
  );
  neck.position.set(0, 1.88, 0);
  group.add(neck);

  // ── KAFA ──
  const headGeo = new THREE.SphereGeometry(0.28, 12, 12);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 2.22, 0);
  head.castShadow = true;
  group.add(head);

  // Saç
  if (charId === 'alex') {
    // Şapka
    const hatBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.06, 12),
      hairMat
    );
    hatBrim.position.set(0, 2.42, 0);
    group.add(hatBrim);
    const hatTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.30, 0.22, 12),
      hairMat
    );
    hatTop.position.set(0, 2.56, 0);
    group.add(hatTop);
  } else if (charId === 'leo') {
    // Dikenli saç
    for (let i = 0; i < 6; i++) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.22, 4),
        hairMat
      );
      const a = (i / 6) * Math.PI * 2;
      spike.position.set(
        0 + Math.cos(a) * 0.18,
        2.48,
        0 + Math.sin(a) * 0.1
      );
      spike.rotation.z = Math.cos(a) * 0.5;
      spike.rotation.x = Math.sin(a) * 0.3;
      group.add(spike);
    }
    // Temel saç
    const hairBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairMat
    );
    hairBase.position.set(0, 2.22, 0);
    group.add(hairBase);
  } else {
    // Maya — saç topuzu
    const hairBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hairBase.position.set(0, 2.22, 0);
    group.add(hairBase);
    const bun = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      hairMat
    );
    bun.position.set(0, 2.55, -0.1);
    group.add(bun);
    // Gözlük
    const glassMat = mat(0x4a9de0);
    const glassL = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12), glassMat);
    glassL.position.set(-0.1, 2.22, 0.27);
    glassL.rotation.y = Math.PI / 2;
    group.add(glassL);
    const glassR = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12), glassMat);
    glassR.position.set(0.1, 2.22, 0.27);
    glassR.rotation.y = Math.PI / 2;
    group.add(glassR);
    // Gözlük köprüsü
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4), glassMat);
    bridge.position.set(0, 2.22, 0.27);
    bridge.rotation.z = Math.PI / 2;
    group.add(bridge);
  }

  // Gözler
  const eyeMat = mat(0x1a1a1a);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  eyeL.position.set(-0.1, 2.24, 0.26);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  eyeR.position.set(0.1, 2.24, 0.26);
  group.add(eyeR);

  // Göz parlaması
  const shineMat = mat(0xffffff);
  const shineL = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), shineMat);
  shineL.position.set(-0.09, 2.255, 0.295);
  group.add(shineL);
  const shineR = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), shineMat);
  shineR.position.set(0.11, 2.255, 0.295);
  group.add(shineR);

  // Leo kılıcı
  if (charId === 'leo') {
    const swordBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.8, 0.04),
      mat(0xc0c8d8)
    );
    swordBlade.position.set(-0.65, 1.3, 0);
    group.add(swordBlade);
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.05, 0.06),
      mat(colors.accent)
    );
    guard.position.set(-0.65, 0.95, 0);
    group.add(guard);
  }

  // Maya kitabı
  if (charId === 'maya') {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.32, 0.06),
      mat(colors.accent)
    );
    book.position.set(0.6, 1.1, 0.05);
    group.add(book);
  }

  // Referanslar animasyon için
  group.userData = {
    legL, legR, armL, armR,
    handL, handR, shoeL, shoeR,
    head, body,
    animTime: 0,
    moving: false,
    sprinting: false,
  };

  group.castShadow = true;

  // Ayarlar
  group.scale.set(1, 1, 1);

  return { group, mixer: null };
}

// Animasyon güncelleme — her frame çağrılır
export function updateCharacter(group, moving, sprinting, speed, delta) {
  const ud = group.userData;
  if (!ud || !ud.legL) return;

  if (moving) {
    ud.animTime += delta * (sprinting ? 8 : 5);
  } else {
    ud.animTime += delta * 1.5; // idle sway
  }

  const t = ud.animTime;

  if (moving) {
    const stride = Math.sin(t) * (sprinting ? 0.45 : 0.3);
    const armSwing = Math.sin(t) * (sprinting ? 0.5 : 0.35);

    // Bacak hareketi
    ud.legL.rotation.x = stride;
    ud.legR.rotation.x = -stride;
    ud.shoeL.position.z = Math.sin(t) * 0.08 + 0.05;
    ud.shoeR.position.z = -Math.sin(t) * 0.08 + 0.05;

    // Kol hareketi (ters bacak)
    ud.armL.rotation.x = -armSwing;
    ud.armR.rotation.x = armSwing;
    ud.handL.position.z = -Math.sin(t) * 0.1;
    ud.handR.position.z = Math.sin(t) * 0.1;

    // Gövde hafif sallanma
    ud.body.rotation.z = Math.sin(t * 0.5) * 0.04;

    // Koşarken öne eğilme
    if (sprinting) {
      group.rotation.x = 0.15;
    } else {
      group.rotation.x = 0;
    }

    // Bob hareketi (yukarı aşağı)
    const bob = Math.abs(Math.sin(t)) * 0.06;
    group.position.y = bob;

  } else {
    // Idle — hafif nefes alma
    const breathe = Math.sin(t) * 0.02;
    ud.body.scale.y = 1 + breathe;
    ud.head.position.y = 2.22 + breathe * 0.5;

    // Kollar dinlenme
    ud.armL.rotation.x *= 0.9;
    ud.armR.rotation.x *= 0.9;
    ud.legL.rotation.x *= 0.9;
    ud.legR.rotation.x *= 0.9;

    group.rotation.x = 0;
    group.position.y = 0;
  }
}
