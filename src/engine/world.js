/**
 * world.js — 3D dünya oluşturucu
 * Three.js ile ülkeye özel çevre
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const COUNTRY_THEMES = {
  japan: {
    groundColor: 0x2d4a1e, groundRough: 0x1a3a10,
    skyColor: 0x1a0a2e, fogColor: 0x1a0a2e,
    buildingColor: 0x2a1a3a, roofColor: 0xff3366,
    roadColor: 0x1a1a2a, treeColor: 0xff9aaa,
    accentColor: 0xff3366, lightColor: 0xff9944,
  },
  brazil: {
    groundColor: 0x1a4a0a, groundRough: 0x0d3008,
    skyColor: 0x030e06, fogColor: 0x051208,
    buildingColor: 0x1a3020, roofColor: 0x22dd55,
    roadColor: 0x1a2a10, treeColor: 0x0d4a10,
    accentColor: 0x22dd55, lightColor: 0xffdd44,
  },
  italy: {
    groundColor: 0x2a2010, groundRough: 0x1a1408,
    skyColor: 0x040820, fogColor: 0x060a20,
    buildingColor: 0xd4a56a, roofColor: 0xcc4422,
    roadColor: 0x2a2828, treeColor: 0x1a4010,
    accentColor: 0x4499ff, lightColor: 0xffe8aa,
  },
  egypt: {
    groundColor: 0x8a7040, groundRough: 0x6a5228,
    skyColor: 0x180c00, fogColor: 0x201000,
    buildingColor: 0xc8a84a, roofColor: 0xffcc00,
    roadColor: 0x6a5830, treeColor: 0x1a5010,
    accentColor: 0xffcc00, lightColor: 0xff8800,
  },
  australia: {
    groundColor: 0x6a3a18, groundRough: 0x4a2808,
    skyColor: 0x08001a, fogColor: 0x100028,
    buildingColor: 0x2a1820, roofColor: 0xaa66ff,
    roadColor: 0x302020, treeColor: 0x2a4010,
    accentColor: 0xaa66ff, lightColor: 0xff6644,
  },
};

export function createWorld(country, scene) {
  const theme = COUNTRY_THEMES[country.id] || COUNTRY_THEMES.japan;
  const doors = [];

  // Zemin — büyük düzlem, doku efekti için checker pattern
  createGround(scene, theme);

  // Yollar
  createRoads(scene, theme);

  // Odalar / binalar
  const roomPositions = [
    { x: -15, z: -15 },
    { x: 15, z: -15 },
    { x: 0, z: -25 },
  ];

  country.rooms.forEach((room, i) => {
    const pos = roomPositions[i] || { x: i * 15 - 15, z: -20 };
    const prog_key = `building_${i}`;
    const door = createBuilding(scene, theme, pos, room, country, i);
    doors.push(door);
  });

  // Dekorasyon
  createDecorations(scene, theme, country);

  // Çevre — ülkeye özel arka plan objeleri
  createEnvironment(scene, theme, country);

  return { doors };
}

function createGround(scene, theme) {
  // Ana zemin
  const groundGeo = new THREE.PlaneGeometry(100, 100, 20, 20);
  const groundMat = new THREE.MeshLambertMaterial({ color: theme.groundColor });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Zemin doku detayı — küçük kareler
  const tileGeo = new THREE.PlaneGeometry(98, 98);
  const tileMat = new THREE.MeshLambertMaterial({
    color: theme.groundRough,
    transparent: true,
    opacity: 0.3,
  });
  const tile = new THREE.Mesh(tileGeo, tileMat);
  tile.rotation.x = -Math.PI / 2;
  tile.position.y = 0.01;
  scene.add(tile);

  // Zemin çizgileri (grid)
  const gridHelper = new THREE.GridHelper(100, 25, theme.roadColor, theme.roadColor);
  gridHelper.position.y = 0.02;
  gridHelper.material.opacity = 0.15;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);
}

function createRoads(scene, theme) {
  const roadMat = new THREE.MeshLambertMaterial({ color: theme.roadColor });
  // Yatay yol
  const road1 = new THREE.Mesh(new THREE.PlaneGeometry(100, 5), roadMat);
  road1.rotation.x = -Math.PI / 2;
  road1.position.y = 0.03;
  scene.add(road1);
  // Dikey yol
  const road2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 100), roadMat);
  road2.rotation.x = -Math.PI / 2;
  road2.position.y = 0.03;
  scene.add(road2);
  // Şerit çizgisi
  const lineMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
  for (let i = -45; i < 45; i += 6) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.05, i);
    scene.add(line);
    const line2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.3), lineMat);
    line2.rotation.x = -Math.PI / 2;
    line2.position.set(i, 0.05, 0);
    scene.add(line2);
  }
}

function createBuilding(scene, theme, pos, room, country, idx) {
  const group = new THREE.Group();
  group.position.set(pos.x, 0, pos.z);

  const bW = 8, bH = 10, bD = 8;

  // Bina gövdesi
  const bodyGeo = new THREE.BoxGeometry(bW, bH, bD);
  const bodyMat = new THREE.MeshLambertMaterial({ color: theme.buildingColor });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = bH / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Çatı
  if (country.id === 'japan') {
    // Pagoda tarzı çatı
    const roofGeo = new THREE.ConeGeometry(7, 3, 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: theme.roofColor });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = bH + 1.5;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
    // İkinci katman
    const roof2 = new THREE.Mesh(new THREE.ConeGeometry(5, 2, 4), roofMat);
    roof2.position.y = bH + 4;
    roof2.rotation.y = Math.PI / 4;
    group.add(roof2);
  } else if (country.id === 'egypt') {
    // Piramit tarzı üst
    const roofGeo = new THREE.ConeGeometry(6, 5, 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: theme.roofColor });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = bH + 2.5;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
  } else {
    // Normal çatı
    const roofGeo = new THREE.BoxGeometry(bW + 1, 1, bD + 1);
    const roofMat = new THREE.MeshLambertMaterial({ color: theme.roofColor });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = bH + 0.5;
    group.add(roof);
  }

  // Pencereler
  const winMat = new THREE.MeshLambertMaterial({ color: 0xffffaa, emissive: 0x886600 });
  for (let row = 0; row < 2; row++) {
    for (let col = -1; col <= 1; col++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), winMat);
      win.position.set(col * 2.5, 3 + row * 3.5, bD / 2 + 0.01);
      group.add(win);
    }
  }

  // Kapı
  const doorMat = new THREE.MeshLambertMaterial({
    color: theme.accentColor,
    emissive: theme.accentColor,
    emissiveIntensity: 0.3,
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 0.2), doorMat);
  door.position.set(0, 1.75, bD / 2 + 0.1);
  group.add(door);

  // Kapı ışığı
  const doorLight = new THREE.PointLight(theme.accentColor, 1.5, 8);
  doorLight.position.set(0, 3, bD / 2 + 1);
  group.add(doorLight);

  // İsim tabelası
  scene.add(group);

  // Kapı bilgisi
  return {
    position: { x: pos.x, z: pos.z + bD / 2 },
    size: { w: bW, d: bD },
    room,
    idx,
  };
}

function createDecorations(scene, theme, country) {
  const seed = country.id.charCodeAt(0);

  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const r = 20 + ((seed * i * 37) % 20);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    // Ülkeye özel dekorasyon
    if (country.id === 'japan') createJapanDeco(scene, theme, x, z, i);
    else if (country.id === 'brazil') createBrazilDeco(scene, theme, x, z, i);
    else if (country.id === 'egypt') createEgyptDeco(scene, theme, x, z, i);
    else createGenericTree(scene, theme, x, z);
  }

  // Lambalar — yol boyunca
  for (let i = -40; i <= 40; i += 10) {
    createLamp(scene, theme, i, 3);
    createLamp(scene, theme, 3, i);
  }
}

function createJapanDeco(scene, theme, x, z, i) {
  if (i % 3 === 0) {
    // Kiraz ağacı
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0x4a2800 })
    );
    trunk.position.set(x, 2, z);
    trunk.castShadow = true;
    scene.add(trunk);
    // Çiçek topu
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xff9aaa })
    );
    bloom.position.set(x, 5, z);
    scene.add(bloom);
    const bloom2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xffb8c8 })
    );
    bloom2.position.set(x + 1, 6, z);
    scene.add(bloom2);
  } else {
    // Fener / Torii
    createGenericTree(scene, theme, x, z);
  }
}

function createBrazilDeco(scene, theme, x, z, i) {
  // Tropikal ağaç
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 6, 8),
    new THREE.MeshLambertMaterial({ color: 0x5a3818 })
  );
  trunk.position.set(x, 3, z);
  scene.add(trunk);
  // Yapraklar — birden fazla küre
  [0, 1, 2].forEach(j => {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(1.5 - j * 0.3, 8, 8),
      new THREE.MeshLambertMaterial({ color: j === 0 ? 0x0d4a10 : 0x1a6018 })
    );
    leaf.position.set(x + (j - 1) * 1.2, 6 + j * 0.5, z);
    scene.add(leaf);
  });
}

function createEgyptDeco(scene, theme, x, z, i) {
  if (i % 4 === 0) {
    // Mini piramit
    const pyr = new THREE.Mesh(
      new THREE.ConeGeometry(2, 3, 4),
      new THREE.MeshLambertMaterial({ color: 0xc8a84a })
    );
    pyr.position.set(x, 1.5, z);
    pyr.rotation.y = Math.PI / 4;
    pyr.castShadow = true;
    scene.add(pyr);
  } else {
    // Palmiye
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 5, 8),
      new THREE.MeshLambertMaterial({ color: 0x7a5a30 })
    );
    trunk.position.set(x, 2.5, z);
    scene.add(trunk);
    for (let p = 0; p < 5; p++) {
      const palmLeaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 3, 4),
        new THREE.MeshLambertMaterial({ color: 0x1a6010 })
      );
      const pa = (p / 5) * Math.PI * 2;
      palmLeaf.position.set(x + Math.cos(pa) * 1.5, 5.5, z + Math.sin(pa) * 1.5);
      palmLeaf.rotation.z = Math.PI * 0.4;
      palmLeaf.rotation.y = pa;
      scene.add(palmLeaf);
    }
  }
}

function createGenericTree(scene, theme, x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 3, 8),
    new THREE.MeshLambertMaterial({ color: 0x5a3a18 })
  );
  trunk.position.set(x, 1.5, z);
  trunk.castShadow = true;
  scene.add(trunk);
  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(2, 8, 8),
    new THREE.MeshLambertMaterial({ color: theme.treeColor })
  );
  foliage.position.set(x, 4, z);
  foliage.castShadow = true;
  scene.add(foliage);
}

function createLamp(scene, theme, x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 4, 6),
    new THREE.MeshLambertMaterial({ color: 0x888888 })
  );
  pole.position.set(x, 2, z);
  scene.add(pole);
  const light = new THREE.PointLight(theme.lightColor, 0.8, 12);
  light.position.set(x, 4.2, z);
  scene.add(light);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 6, 6),
    new THREE.MeshLambertMaterial({ color: theme.lightColor, emissive: theme.lightColor })
  );
  bulb.position.set(x, 4.2, z);
  scene.add(bulb);
}

function createEnvironment(scene, theme, country) {
  // Çevre duvarları / sınırlar
  const wallMat = new THREE.MeshLambertMaterial({ color: theme.buildingColor });
  [[-50, 0], [50, 0], [0, -50], [0, 50]].forEach(([wx, wz]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wx === 0 ? 100 : 1, 3, wz === 0 ? 1 : 100), wallMat);
    wall.position.set(wx, 1.5, wz);
    scene.add(wall);
  });

  // Ülkeye özel büyük arka plan objesi
  if (country.id === 'japan') {
    // Büyük Fuji dağı arkaplanda
    const mt = new THREE.Mesh(
      new THREE.ConeGeometry(30, 40, 8),
      new THREE.MeshLambertMaterial({ color: 0x4a2a5a })
    );
    mt.position.set(-60, 0, -80);
    scene.add(mt);
    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(8, 12, 8),
      new THREE.MeshLambertMaterial({ color: 0xe8e8ff })
    );
    snow.position.set(-60, 34, -80);
    scene.add(snow);
  } else if (country.id === 'egypt') {
    // Büyük piramitler arka planda
    [[-60, -70], [-45, -75], [-75, -72]].forEach(([px, pz], i) => {
      const size = 20 - i * 3;
      const pyr = new THREE.Mesh(
        new THREE.ConeGeometry(size, size * 1.2, 4),
        new THREE.MeshLambertMaterial({ color: 0xa87830 })
      );
      pyr.position.set(px, size * 0.6, pz);
      pyr.rotation.y = Math.PI / 4;
      scene.add(pyr);
    });
  } else if (country.id === 'brazil') {
    // Cristo Redentor silueti
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2, 10, 2),
      new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    body.position.set(50, 25, -70);
    scene.add(body);
    const arms = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.5, 1.5),
      new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    arms.position.set(50, 30, -70);
    scene.add(arms);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    head.position.set(50, 35.5, -70);
    scene.add(head);
  }
}
