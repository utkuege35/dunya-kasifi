/**
 * state.js — Merkezi durum yönetimi
 * localStorage ile senkronize çalışır
 */

const STORAGE_KEY = 'dunya-kasifi-v1';

const defaultState = {
  xp: 0,
  char: null,          // seçilen karakter: 'alex' | 'maya' | 'leo'
  progress: {},        // { countryId: { roomId: { done, stars } } }
  usedQuestions: {},   // { 'countryId_roomId': [id, id, ...] }
};

// Bellekteki state
let _state = { ...defaultState };

/** localStorage'dan yükle */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      _state = { ...defaultState, ...saved };
    }
  } catch (e) {
    console.warn('State yüklenemedi, varsayılan kullanılıyor:', e);
  }
}

/** localStorage'a kaydet */
export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch (e) {
    console.warn('State kaydedilemedi:', e);
  }
}

/** Tüm state'i oku (readonly) */
export function getState() {
  return _state;
}

/** State'i güncelle ve kaydet */
export function setState(patch) {
  _state = { ..._state, ...patch };
  saveState();
}

/** XP ekle */
export function addXP(amount) {
  _state.xp += amount;
  saveState();
}

/** Oda tamamlandı olarak işaretle */
export function markRoomDone(countryId, roomId, stars) {
  if (!_state.progress[countryId]) _state.progress[countryId] = {};
  const prev = _state.progress[countryId][roomId] || {};
  _state.progress[countryId][roomId] = {
    done: true,
    stars: Math.max(prev.stars || 0, stars),
  };
  saveState();
}

/** Soruyu görüldü olarak kaydet (tekrar çıkmasın) */
export function markQuestionUsed(countryId, roomId, questionId) {
  const key = `${countryId}_${roomId}`;
  if (!_state.usedQuestions[key]) _state.usedQuestions[key] = [];
  if (!_state.usedQuestions[key].includes(questionId)) {
    _state.usedQuestions[key].push(questionId);
    saveState();
  }
}

/** Bir oda için kullanılmış soru listesi */
export function getUsedQuestions(countryId, roomId) {
  return _state.usedQuestions[`${countryId}_${roomId}`] || [];
}

/** Kullanılmış soru listesini sıfırla (oda tekrar oynanınca) */
export function resetUsedQuestions(countryId, roomId) {
  const key = `${countryId}_${roomId}`;
  _state.usedQuestions[key] = [];
  saveState();
}

/** State'i tamamen sıfırla (debug için) */
export function resetState() {
  _state = { ...defaultState };
  localStorage.removeItem(STORAGE_KEY);
}
