/**
 * questions.js — Soru modalı UI bileşeni
 * Soru panelini render eder, cevapları işler
 */

import { speak } from '../utils/tts.js';
import { addXP, markQuestionUsed, markRoomDone, getUsedQuestions, resetUsedQuestions } from '../utils/state.js';
import { loadQuestions } from '../utils/loader.js';

let session = { country: null, room: null, questions: [], idx: 0, correct: 0, streak: 0 };
let _onFinish = null;

const LABELS = { mcq: '🔤 Kelime', gap: '✏️ Boşluk Doldur', reading: '📖 Okuma', order: '🔀 Cümle Kur' };
const LETTERS = ['A', 'B', 'C', 'D'];

/** Oda için soru oturumu başlat */
export async function startQuestionSession(country, room, onFinish) {
  session = { country, room, questions: [], idx: 0, correct: 0, streak: 0 };
  _onFinish = onFinish;

  // Soruları yükle
  const allQuestions = await loadQuestions(country.id, room.id);

  // Kullanılmamış soruları filtrele
  const used = new Set(getUsedQuestions(country.id, room.id));
  let available = allQuestions.filter(q => !used.has(q.id));
  if (available.length < 3) {
    resetUsedQuestions(country.id, room.id);
    available = allQuestions;
  }

  // 5 rastgele soru seç
  session.questions = available
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(5, available.length));

  // Kullanıldı olarak işaretle
  session.questions.forEach(q => markQuestionUsed(country.id, room.id, q.id));

  // UI göster
  showPanel();
  renderQuestion();
}

/** Soruları kapat */
export function closeQuestions() {
  document.getElementById('q-overlay').classList.add('hidden');
}

function showPanel() {
  document.getElementById('q-overlay').classList.remove('hidden');
}

function renderQuestion() {
  const q = session.questions[session.idx];
  const total = session.questions.length;

  // Progress
  document.getElementById('qp-badge').textContent = LABELS[q.type] || q.type;
  document.getElementById('qp-prog').textContent = `${session.idx + 1} / ${total}`;
  document.getElementById('qp-pfill').style.width = `${(session.idx / total) * 100}%`;

  const body = document.getElementById('q-panel');
  // Sadece head + pbar'ı koru, body'i temizle
  const head = body.querySelector('.qp-head');
  const pbar = body.querySelector('.qp-pbar');

  // Mevcut içerik temizle (head ve pbar hariç)
  [...body.children].forEach(c => {
    if (c !== head && c !== pbar) c.remove();
  });

  // Okuma parçası
  if (q.ctx) {
    const ctx = el('div', 'qp-ctx', q.ctx);
    body.appendChild(ctx);
  }

  // Soru metni
  const qDiv = el('div', 'qp-q');
  const ttsBtn = el('button', 'qp-tts', '🔊');
  ttsBtn.addEventListener('click', () => speak(q.q));
  qDiv.appendChild(ttsBtn);
  qDiv.appendChild(document.createTextNode(q.q));
  body.appendChild(qDiv);

  // Soru tipi
  if (q.type === 'mcq' || q.type === 'reading') buildMCQ(q, body);
  else if (q.type === 'gap')   buildGap(q, body);
  else if (q.type === 'order') buildOrder(q, body);

  // Geri bildirim + devam
  body.appendChild(el('div', 'qp-fb', '', 'qfb'));
  const nxtBtn = el('button', 'nxt-btn', 'Devam Et ➡️', 'nxbtn');
  nxtBtn.addEventListener('click', nextQuestion);
  body.appendChild(nxtBtn);
}

function buildMCQ(q, body) {
  const wrap = el('div', 'qp-opts');
  q.opts.forEach((txt, i) => {
    const btn = el('div', 'qp-opt');
    btn.innerHTML = `<span class="opt-ltr">${LETTERS[i]}</span><span>${txt}</span>`;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      wrap.querySelectorAll('.qp-opt').forEach(o => o.classList.add('disabled'));
      if (i === q.ans) {
        btn.classList.add('ok');
        onCorrect(q);
      } else {
        btn.classList.add('ko');
        wrap.querySelectorAll('.qp-opt')[q.ans].classList.add('ok');
        onWrong(q);
      }
    });
    wrap.appendChild(btn);
  });
  body.appendChild(wrap);
}

function buildGap(q, body) {
  const row = el('div', 'gap-row');
  const inp = el('input', 'gap-inp');
  inp.placeholder = 'Cevabı yaz...';
  const btn = el('button', 'chk-btn', '✓');

  const check = () => {
    if (inp.disabled) return;
    inp.disabled = true; btn.disabled = true;
    const ok = inp.value.trim().toLowerCase() === q.blanks[0].toLowerCase();
    inp.classList.add(ok ? 'ok' : 'ko');
    ok ? onCorrect(q) : onWrong(q, `Doğru: "${q.blanks[0]}"`);
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  btn.addEventListener('click', check);
  row.appendChild(inp); row.appendChild(btn);
  body.appendChild(row);
  setTimeout(() => inp.focus(), 120);
}

let _ordSel = [];
function buildOrder(q, body) {
  _ordSel = [];
  const shuffled = q.words.slice().sort(() => Math.random() - 0.5);
  const ansRow = el('div', 'wans');
  const bank = el('div', 'wbank');

  ansRow.addEventListener('click', e => {
    const chip = e.target.closest('.wchip');
    if (!chip || chip.classList.contains('disabled')) return;
    const w = chip.textContent;
    _ordSel = _ordSel.filter(x => x !== w);
    chip.remove();
    bank.querySelectorAll('.wchip').forEach(c => { if (c.textContent === w) c.classList.remove('used'); });
  });

  shuffled.forEach(w => {
    const chip = el('div', 'wchip', w);
    chip.addEventListener('click', () => {
      if (chip.classList.contains('used')) return;
      chip.classList.add('used');
      _ordSel.push(w);
      const nc = el('div', 'wchip', w);
      ansRow.appendChild(nc);
    });
    bank.appendChild(chip);
  });

  const chkBtn = el('button', 'chk-btn', 'Kontrol');
  chkBtn.style.marginTop = '8px';
  chkBtn.addEventListener('click', () => {
    chkBtn.disabled = true;
    bank.querySelectorAll('.wchip').forEach(c => c.classList.add('used'));
    const result = _ordSel.join(' ');
    const ok = result.toLowerCase() === q.ans.toLowerCase();
    ansRow.classList.add(ok ? 'ok' : 'ko');
    ok ? onCorrect(q, 15) : onWrong(q, `Doğru: "${q.ans}"`);
  });

  body.appendChild(ansRow);
  body.appendChild(bank);
  body.appendChild(chkBtn);
}

function onCorrect(q, xpAmt = 10) {
  session.correct++;
  session.streak++;
  const bonus = session.streak > 2 ? 5 : 0;
  addXP(xpAmt + bonus);
  showFeedback(true, q.fb);
  showNext();
}

function onWrong(q, prefix = '') {
  session.streak = 0;
  showFeedback(false, `${prefix}${prefix ? ' — ' : ''}${q.fb}`);
  showNext();
}

function showFeedback(ok, msg) {
  const fb = document.getElementById('qfb');
  if (!fb) return;
  fb.className = `qp-fb ${ok ? 'ok' : 'ko'}`;
  fb.textContent = (ok ? '✅ Doğru! ' : '❌ ') + msg;
  fb.style.display = 'block';
}

function showNext() {
  const btn = document.getElementById('nxbtn');
  if (btn) btn.style.display = 'block';
}

function nextQuestion() {
  session.idx++;
  if (session.idx >= session.questions.length) finishSession();
  else renderQuestion();
}

function finishSession() {
  closeQuestions();
  const pct = session.correct / session.questions.length;
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
  addXP(stars * 20);
  markRoomDone(session.country.id, session.room.id, stars);
  if (_onFinish) _onFinish({ stars, correct: session.correct, total: session.questions.length });
}

// ── Yardımcı ──
function el(tag, className = '', text = '', id = '') {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  if (id) e.id = id;
  return e;
}
