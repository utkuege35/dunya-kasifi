/**
 * world.js — Prosedürel dünya üretici
 * Her ülke için farklı tile haritası oluşturur
 */

/**
 * Ülkeye göre 28x28 tile haritası üret
 * Tile tipleri: 0=zemin, 1=yol, 2=bina, 3=ağaç, 4=su, 5=kum
 */
export function generateWorld(country, SIZE, TILE) {
  const tiles = [];

  function noise(x, y) {
    const s = country.id.charCodeAt(0) * 31 + (country.id.charCodeAt(1) || 0) * 7;
    return Math.abs(Math.sin(x * s * 0.1 + y * 0.17 + s) * 43758.5453) % 1;
  }

  // Zemin oluştur
  for (let y = 0; y < SIZE; y++) {
    tiles[y] = [];
    for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y);
      let t = 0;
      if (country.id === 'egypt')     { t = n > 0.82 ? 2 : 5; }
      else if (country.id === 'australia') { t = n > 0.82 ? 2 : n > 0.72 ? 5 : 0; }
      else if (country.id === 'brazil')    { t = n > 0.80 ? 2 : n > 0.60 ? 3 : 0; }
      else { t = n > 0.80 ? 2 : n > 0.65 ? 3 : 0; }
      tiles[y][x] = t;
    }
  }

  // Ana yollar (yatay + dikey)
  [4, 14, 23].forEach(row => { for (let x = 0; x < SIZE; x++) tiles[row][x] = 1; });
  [4, 14, 23].forEach(col => { for (let y = 0; y < SIZE; y++) tiles[y][col] = 1; });

  // Kavşakları genişlet
  [4, 14, 23].forEach(ry => [4, 14, 23].forEach(rx => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (ry + dy >= 0 && ry + dy < SIZE && rx + dx >= 0 && rx + dx < SIZE)
        tiles[ry + dy][rx + dx] = 1;
    }
  }));

  // Su (brezilya ve mısır)
  if (country.id === 'brazil' || country.id === 'egypt') {
    const wy = Math.floor(SIZE / 2) + 3;
    for (let x = 0; x < SIZE; x++) { tiles[wy][x] = 4; tiles[wy + 1][x] = 4; }
  }

  // Oda pozisyonları (3 oda)
  const roomPositions = [
    { x: 7,  y: 7  },
    { x: 17, y: 7  },
    { x: 7,  y: 17 },
  ];

  // Bina döşe
  roomPositions.forEach((rp, i) => {
    if (i >= country.rooms.length) return;
    for (let dy = 0; dy <= 4; dy++) for (let dx = 0; dx <= 4; dx++) {
      if (rp.y + dy < SIZE && rp.x + dx < SIZE) tiles[rp.y + dy][rp.x + dx] = 2;
    }
    // Kapı girişi
    if (tiles[rp.y + 5]) {
      tiles[rp.y + 5][rp.x + 1] = 1;
      tiles[rp.y + 5][rp.x + 2] = 1;
    }
  });

  return { tiles, roomPositions, W: SIZE, H: SIZE };
}

/** Belirli koordinat solid (geçilmez) mi? */
export function isSolid(wx, wy, world, TILE, SIZE) {
  const tx = Math.floor(wx / TILE);
  const ty = Math.floor(wy / TILE);
  if (!world || tx < 0 || ty < 0 || tx >= SIZE || ty >= SIZE) return true;
  return world.tiles[ty][tx] === 2;
}
