/**
 * tts.js — Text-to-Speech yardımcısı
 * Web Speech API kullanır, İngilizce sesli okuma
 */

let _voice = null;

/** Mevcut İngilizce sesi bul ve önbelleğe al */
function findVoice() {
  if (_voice) return _voice;
  const voices = window.speechSynthesis?.getVoices() || [];
  _voice =
    voices.find(v => v.lang === 'en-US' && v.localService) ||
    voices.find(v => v.lang.startsWith('en-')) ||
    voices[0] ||
    null;
  return _voice;
}

/** İngilizce metni sesli oku */
export function speak(text, rate = 0.85) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  const v = findVoice();
  if (v) u.voice = v;

  window.speechSynthesis.speak(u);
}

/** Sesi durdur */
export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

// Sesler hazır olduğunda önbelleğe al
window.speechSynthesis?.addEventListener('voiceschanged', () => {
  _voice = null;
  findVoice();
});
