/**
 * questions.js — Soru modalı UI bileşeni
 */

import { speak } from '../utils/tts.js';
import { addXP, markQuestionUsed, markRoomDone, getUsedQuestions, resetUsedQuestions } from '../utils/state.js';
import { loadQuestions } from '../utils/loader.js';

let session = { country: null, room: null, questions: [], idx: 0, correct: 0, streak: 0 };
let _onFinish = null;

const LABELS = { mcq: '🔤 Kelime', gap: '✏️ Boşluk Doldur', reading: '📖 Okuma', order: '🔀 Cümle Kur' };
const LETTERS = ['A', 'B', 'C', 'D'];

export async function startQuestionSession(country, room, onFinish) {
  session = { country, room, questions: [], idx: 0, correct: 0, streak: 0 };
  _onFinish = onFinish;

  const allQuestions = await loadQuestions(country.id, room.id);
  const used = new Set(getUsedQuestions(country.id, room.id));
  let available = allQuestions.filter(q => !used.has(q.id));
  if (available.length < 3) {
    resetUsedQuestions(country.id, room.id);
    available = allQuestions;
  }

  session.questions = available
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(5, available.length));

  session.questions.forEach(q => markQuestionUsed(country.id, room.id, q.id));

  document.getElementById('q-overlay').classList.remove('hidden');
  renderQuestion();
}

export function closeQuestions() {
  document.getElementById('q-overlay').classList.add('hidden');
}

function renderQuestion() {
  const q = session.questions[session.idx];
  const total = session.questions.length;
  const panel = document.getElementById('q-panel');

  // Paneli sıfırdan oluştur
  panel.innerHTML = `
    <div class="qp-head">
      <span class="qp-badge">${LABELS[q.type] || q.type}</span>
      <span class="qp-prog">${session.idx + 1} / ${total}</span>
    </div>
    <div class="qp-pbar">
      <div class="qp-pfill" style="width:${(session.idx / total) * 100}%"></div>
    </div>
    ${q.ctx ? `<div class="qp-ctx">${q.ctx}</div>` : ''}
    <div class="qp-q">
      <button class="qp-tts" id="tts-btn">🔊</button>
      ${q.q}
    </div>
    <div id="q-answer-area"></div>
    <div class="qp-fb" id="qfb"></div>
    <button class="nxt-btn" id="nxbtn">Devam Et ➡️</button>
  `;

  document.getElementById('tts-btn').addEventListener('click', () => speak(q.q));
  document.getElementById('nxbtn').addEventListener('click', nextQuestion);

  const area = document.getElementById('q-answer-area');
  if (q.type === 'mcq' || q.type === 'reading') buildMCQ(q, area);
  else if (q.type === 'gap') buildGap(q, area);
  else if (q.type === 'order') buildOrder(q, area);
}

function buildMCQ(q, area) {
  const wrap = document.createElement('div');
  wrap.className = 'qp-opts';
  q.opts.forEach((txt, i) => {
    const btn = document.createElement('div');
    btn.className = 'qp-opt';
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
  area.appendChild(wrap);
}

function buildGap(q, area) {
  const row = document.createElement('div');
  row.className = 'gap-row';
  const inp = document.createElement('input');
  inp.className = 'gap-inp';
  inp.placeholder = 'Cevabı yaz...';
  const btn = document.createElement('button');
  btn.className = 'chk-btn';
  btn.textContent = '✓';
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
  area.appendChild(row);
  setTimeout(() => inp.focus(), 120);
}

let _ordSel = [];
function buildOrder(q, area) {
  _ordSel = [];
  const shuffled = q.words.slice().sort(() => Math.random() - 0.5);
  const ansRow = document.createElement('div');
  ansRow.className = 'wans';
  const bank = document.createElement('div');
  bank.className = 'wbank';

  ansRow.addEventListener('click', e => {
    const chip = e.target.closest('.wchip');
    if (!chip || chip.classList.contains('disabled')) return;
    const w = chip.textContent;
    _ordSel = _ordSel.filter(x => x !== w);
    chip.remove();
    bank.querySelectorAll('.wchip').forEach(c => { if (c.textContent === w) c.classList.remove('used'); });
  });

  shuffled.forEach(w => {
    const chip = document.createElement('div');
    chip.className = 'wchip';
    chip.textContent = w;
    chip.addEventListener('click', () => {
      if (chip.classList.contains('used')) return;
      chip.classList.add('used');
      _ordSel.push(w);
      const nc = document.createElement('div');
      nc.className = 'wchip';
      nc.textContent = w;
      ansRow.appendChild(nc);
    });
    bank.appendChild(chip);
  });

  const chkBtn = document.createElement('button');
  chkBtn.className = 'chk-btn';
  chkBtn.textContent = 'Kontrol';
  chkBtn.style.marginTop = '8px';
  chkBtn.addEventListener('click', () => {
    chkBtn.disabled = true;
    bank.querySelectorAll('.wchip').forEach(c => c.classList.add('used'));
    const result = _ordSel.join(' ');
    const ok = result.toLowerCase() === q.ans.toLowerCase();
    ansRow.classList.add(ok ? 'ok' : 'ko');
    ok ? onCorrect(q, 15) : onWrong(q, `Doğru: "${q.ans}"`);
  });

  area.appendChild(ansRow);
  area.appendChild(bank);
  area.appendChild(chkBtn);
}

function onCorrect(q, xpAmt = 10) {
  session.correct++;
  session.streak++;
  addXP(xpAmt + (session.streak > 2 ? 5 : 0));
  showFeedback(true, q.fb);
  document.getElementById('nxbtn').style.display = 'block';
}

function onWrong(q, prefix = '') {
  session.streak = 0;
  showFeedback(false, (prefix ? prefix + ' — ' : '') + q.fb);
  document.getElementById('nxbtn').style.display = 'block';
}

function showFeedback(ok, msg) {
  const fb = document.getElementById('qfb');
  if (!fb) return;
  fb.className = `qp-fb ${ok ? 'ok' : 'ko'}`;
  fb.textContent = (ok ? '✅ Doğru! ' : '❌ ') + msg;
  fb.style.display = 'block';
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
