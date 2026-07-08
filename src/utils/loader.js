/**
 * loader.js — JSON veri yükleyici
 */

const _cache = new Map();

export async function loadJSON(path) {
  if (_cache.has(path)) return _cache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Yüklenemedi: ${path} (${res.status})`);
  const data = await res.json();
  _cache.set(path, data);
  return data;
}

export async function loadCountries() {
  return loadJSON('./data/countries/index.json');
}

export async function loadQuestions(countryId, roomId) {
  return loadJSON(`./data/questions/${countryId}/${roomId}.json`);
}

export async function loadWorldMap() {
  return loadJSON('./data/world-map.json');
}

export function clearCache() {
  _cache.clear();
}
