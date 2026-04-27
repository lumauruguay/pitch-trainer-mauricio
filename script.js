// BlueIA Pitch Trainer — v4.4
// TTS: Piper WASM (es_ES natural) con fallback Web Speech API
// Compatible: Safari 11+, Chrome, Brave, Android Chrome
// Sin Kokoro. Sin Siri. Sin acento inglés.

// ─── ESTADO GLOBAL ───────────────────────────────────────────────────────────
const state = {
  difficulty: 'curioso',
  currentPhase: 'name',
  scores: { name: 0, same: 0, frame: 0, aim: 0, game: 0 },
  attempts: { name: 0, same: 0, frame: 0, aim: 0, game: 0 },
  totalScore: 0,
  streak: 0,
  bestStreak: 0,
  isListening: false,
  isVoiceChatMode: false,
  isSpeaking: false,
  recognitionActive: false,
  currentOptions: [],
  sessionLog: [],
  sessionCount: 0,
  phaseHistory: { name: [], same: [], frame: [], aim: [], game: [] },
  unlockedDifficult: false,
  // Piper TTS
  piperReady: false,
  piperLoading: false,
  piperTTS: null,
  usePiper: false,
  // Web Speech fallback
  selectedVoiceName: null
};
const phases = ['name', 'same', 'frame', 'aim', 'game'];

// ─── ÁRBOL DE DECISIONES ─────────────────────────────────────────────────────
const arbol = {
  name: {
    mauricio: [
      { text: "Sí señor, ¿en qué le puedo ayudar?", type: 'neutral' },
      { text: "Estoy ocupado ahora, ¿qué necesita?", type: 'ocupado' },
      { text: "Mirá que yo de tecnología no entiendo mucho.", type: 'esceptico' },
      { text: "¿Y eso qué es exactamente?", type: 'curioso' },
      { text: "Cuénteme.", type: 'abierto' }
    ],
    hint: "Usá tu NAME: quién sos + qué resultado concreto generás. No des tu título.",
    options: [
      { text: "Soy Adrián Mariotti, fundador de BlueIA. Soy el ingeniero de IA que convierte el caos de un comercio en un sistema que trabaja solo.", quality: 'perfect', feedback: "PERFECTO ✅ — Identidad + resultado + lenguaje de dueño.", quote: "'Una KPI enciende una luz cuando le preguntan qué hace' — Priestley", nextMauricio: "Interesante. ¿Y qué significa eso para un supermercado?" },
      { text: "Soy consultor de tecnología e inteligencia artificial para empresas.", quality: 'ok', feedback: "REGULAR ⚠️ — Demasiado genérico. Hablá del resultado.", quote: "Meléndez: 'Primero tenés que conectar con su mundo.'", nextMauricio: "Hay muchos consultores. ¿Qué me diferencia esto?" },
      { text: "Vengo a contarle sobre BlueIA, una plataforma de IA para PyMEs uruguayas.", quality: 'bad', feedback: "INCORRECTO ❌ — Empezaste por la herramienta, no por el resultado.", quote: "Priestley: 'Describí el mundo que creás, no la herramienta.'", nextMauricio: "Ah, otra herramienta más. No tengo tiempo ahora." }
    ]
  },
  same: {
    mauricio: [
      { text: "¿Y qué tiene que ver eso con Imperio?", type: 'curioso' },
      { text: "Interesante, seguí.", type: 'abierto' },
      { text: "¿Pero vos conocés cómo funcionamos acá?", type: 'esceptico' },
      { text: "¿Cuánto tiempo lleva implementar algo así?", type: 'economico' },
      { text: "Andá directo al punto, que tengo cosas.", type: 'ocupado' }
    ],
    hint: "Nombrá el dolor que YA SIENTE. Si asiente, encontraste el SAME.",
    options: [
      { text: "Mauricio, estuve mirando cómo funciona Imperio. Tienen una comunidad enorme en Facebook, miles de seguidores, sorteos, videos. Pero toda esa fuerza hoy no le dice nada: qué promo dejó más margen, qué clientes volvieron, dónde se fue la plata. Cada día empieza de cero.", quality: 'perfect', feedback: "PERFECTO ✅ — Nombraste SU negocio, SU fuerza y SU punto ciego.", quote: "Priestley: 'Si asienten mientras hablás, encontraste el SAME.'", nextMauricio: "Es verdad eso. A veces hacemos una promo y no sabemos si funcionó." },
      { text: "La mayoría de los supermercados depende de una sola persona. Si no estás vos, se cae.", quality: 'ok', feedback: "BIEN ⚠️ — Buen dolor pero genérico. Personalizá más.", quote: "'Usá sus propias palabras, no las tuyas.' — Guion BlueIA", nextMauricio: "Sí, algo así pasa acá. ¿Qué propone usted?" },
      { text: "Con BlueIA puede automatizar sus procesos y tener dashboards en tiempo real.", quality: 'bad', feedback: "INCORRECTO ❌ — Saltaste a la solución sin validar el dolor.", quote: "Meléndez: 'Nunca ofrezcas la solución antes de que el cliente confirme su problema.'", nextMauricio: "¿Dashboards? No sé si necesito eso." }
    ]
  },
  frame: {
    mauricio: [
      { text: "Sí, eso nos pasa. ¿Cómo lo resolvés?", type: 'curioso' },
      { text: "¿Cuánto sale eso?", type: 'economico' },
      { text: "¿Y eso funciona para un super?", type: 'esceptico' },
      { text: "Dale, explicame rápido.", type: 'ocupado' },
      { text: "Me parece interesante. Seguí.", type: 'abierto' }
    ],
    hint: "Explicá POR QUÉ el problema existe. Tu diagnóstico único. No la solución todavía.",
    options: [
      { text: "El problema no es que trabajás poco, Mauricio. Es que Imperio no tiene memoria. Lo que pasa en caja, en stock, en redes y en WhatsApp se pierde. Sin esa memoria, no hay inteligencia. Y sin inteligencia, el crecimiento tiene un techo invisible.", quality: 'perfect', feedback: "PERFECTO ✅ — 'Imperio no tiene memoria' es una frase que no va a olvidar.", quote: "Priestley: 'Tu FRAME es tu foso competitivo.'", nextMauricio: "Nunca lo había pensado así. ¿Cómo se le da esa memoria?" },
      { text: "El problema es que no tienen un sistema integrado para gestionar todo.", quality: 'ok', feedback: "REGULAR ⚠️ — Correcto pero técnico. No conecta emocionalmente.", quote: "BlueIA FRAME: 'El negocio no tiene memoria. Cada día empieza de cero.'", nextMauricio: "¿Y eso qué costaría?" },
      { text: "La solución es un dashboard con métricas clave y automatizaciones de WhatsApp.", quality: 'bad', feedback: "INCORRECTO ❌ — Saltaste al AIM antes del FRAME.", quote: "Sin FRAME, el AIM suena a venta de software.", nextMauricio: "¿Cuánto sale?" }
    ]
  },
  aim: {
    mauricio: [
      { text: "¿Cuánto tiempo lleva ver resultados?", type: 'curioso' },
      { text: "¿Cuánto sale esto?", type: 'economico' },
      { text: "Sonó complicado. ¿Vos lo implementás todo?", type: 'esceptico' },
      { text: "¿Qué gano yo concretamente?", type: 'neutral' },
      { text: "Tengo que revisar mis números antes de decidir.", type: 'ocupado' }
    ],
    hint: "Nombrá la transformación concreta: tiempo, plata, tranquilidad. Sé específico.",
    options: [
      { text: "En el primer mes, mi objetivo es devolverle horas reales de su semana. Las consultas repetitivas de WhatsApp se responden solas. Tiene un tablero con sus números clave. Y recibe alertas cuando algo se desvía. No tiene que estar en todo.", quality: 'perfect', feedback: "PERFECTO ✅ — Tres transformaciones concretas: tiempo, claridad, autonomía.", quote: "Priestley: 'Ligá tu producto a más dinero, más tiempo o mejor calidad de vida.'", nextMauricio: "Eso de las consultas solas me interesa. Nos matan por WhatsApp." },
      { text: "BlueIA le da inteligencia de negocios avanzada con análisis predictivo y machine learning.", quality: 'bad', feedback: "INCORRECTO ❌ — 'Machine learning' no le dice nada a Mauricio.", quote: "'Hablá del resultado, no de la tecnología.'", nextMauricio: "No entiendo eso. ¿Y cuánto sale?" },
      { text: "El resultado es menos tiempo en tareas repetitivas y más claridad para decidir.", quality: 'ok', feedback: "BIEN ⚠️ — Correcto pero vago. Faltó especificidad.", quote: "'Sin AIM concreto, el pitch muere en el FRAME.'", nextMauricio: "¿Y qué significa eso en mi día a día?" }
    ]
  },
  game: {
    mauricio: [
      { text: "¿Impero sería el primero en la zona?", type: 'curioso' },
      { text: "¿Qué inversión estamos hablando?", type: 'economico' },
      { text: "Todo eso suena muy lindo, pero...", type: 'esceptico' },
      { text: "Interesante. ¿Cómo seguimos?", type: 'abierto' },
      { text: "Ok, mandame algo por escrito.", type: 'ocupado' }
    ],
    hint: "Convertí la venta en una causa. Él no compra tecnología, es el primero inteligente de la zona.",
    options: [
      { text: "Mi juego es que cualquier PyME de Canelones pueda tomar decisiones con la misma claridad que una gran cadena. Imperio ya es el referente en precio y cercanía. Yo quiero que sea también el primer supermercado verdaderamente inteligente de la zona. Con datos al nivel de Tienda Inglesa, pero a costo de PyME.", quality: 'perfect', feedback: "PERFECTO ✅ — 'El primero inteligente de Canelones'. Eso no se negocia por precio.", quote: "Priestley: 'El GAME convierte una venta en una causa. Identidad > precio.'", nextMauricio: "Me interesa. ¿Cuándo me puede mostrar algo concreto?" },
      { text: "Estamos ayudando a que las PyMEs de Uruguay sean más competitivas con inteligencia artificial.", quality: 'ok', feedback: "REGULAR ⚠️ — Faltó hacer a Imperio protagonista del GAME.", quote: "'El cliente debe sentir que es parte de algo más grande.' — Priestley", nextMauricio: "Suena bien. Mándeme información." },
      { text: "Tenemos un precio especial para los primeros clientes del programa.", quality: 'bad', feedback: "INCORRECTO ❌ — Cerraste con descuento en lugar de con visión.", quote: "'Cerrá siempre con el GAME antes de la oferta.'", nextMauricio: "¿Cuánto es ese precio especial?" }
    ]
  }
};

// ─── PERSONALIDADES ───────────────────────────────────────────────────────────
const personalities = {
  curioso:   { name: 'Curioso',    responseStyle: (a) => a.find(m => m.type === 'curioso')   || a[0] },
  ocupado:   { name: 'Ocupado',    responseStyle: (a) => a.find(m => m.type === 'ocupado')   || a[0] },
  esceptico: { name: 'Escéptico',  responseStyle: (a) => a.find(m => m.type === 'esceptico') || a[0] },
  economico: { name: 'Economista', responseStyle: (a) => a.find(m => m.type === 'economico') || a[0] },
  abierto:   { name: 'Abierto',    responseStyle: (a) => a.find(m => m.type === 'abierto')   || a[0] },
  dificil:   { name: '😤 Difícil', responseStyle: (a) => a.find(m => m.type === 'esceptico') || a[a.length - 1] }
};

// ─── PIPER TTS (WASM) ───────────────────────────────────────────────────────────
// Voz masculina es-ES de Piper (entrenada con voces reales, no sintetizada)
// Modelo: es_ES-sharvard-medium (~30MB, caché en IndexedDB automático)
const PIPER_VOICE = 'es_ES-sharvard-medium';
let piperModule = null;

async function initPiper() {
  if (state.piperLoading || state.piperReady) return;
  state.piperLoading = true;
  _setBadge('loading', 'Cargando voz Piper...');
  try {
    // Importar desde CDN oficial de diffusionstudio/vits-web
    const { PiperTTSClient } = await import(
      'https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@latest/dist/index.js'
    );
    piperModule = new PiperTTSClient();
    // Cargar modelo de voz español—se cachea automáticamente
    await piperModule.loadVoice(PIPER_VOICE);
    state.piperReady  = true;
    state.piperLoading = false;
    state.usePiper    = true;
    _setBadge('piper', '⭐ Piper TTS — es-ES natural');
    _updateStatusEl('✅ Voz Piper lista. ¡Calidad neutra!');
  } catch (err) {
    console.warn('[Piper] No cargó:', err);
    state.piperLoading = false;
    state.usePiper     = false;
    _initWebSpeech();
    _setBadge('system', 'Fallback: voz del sistema');
  }
}

async function speakWithPiper(text, onEnd) {
  if (!piperModule || !state.piperReady) { speakWithSystem(text, onEnd); return; }
  try {
    _setSpeakingUI(true);
    const audioBuffer = await piperModule.predict({ text, voiceId: PIPER_VOICE });
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await ctx.decodeAudioData(audioBuffer);
    const src  = ctx.createBufferSource();
    src.buffer = decoded;
    src.connect(ctx.destination);
    src.onended = () => { _setSpeakingUI(false); ctx.close(); if (onEnd) onEnd(); };
    src.start();
  } catch (err) {
    console.warn('[Piper speak]', err);
    _setSpeakingUI(false);
    speakWithSystem(text, onEnd);
  }
}

// ─── WEB SPEECH API (FALLBACK) ───────────────────────────────────────────────────
const MALE_VOICES = ['jorge','juan','diego','carlos','miguel','pedro','reed','rocko','eddy','grandpa'];

function _scoreVoice(v) {
  const n   = v.name.toLowerCase();
  const idx = MALE_VOICES.findIndex(m => n.includes(m));
  if (idx !== -1 && v.lang === 'es-MX') return 80 - idx;
  if (idx !== -1 && v.lang.startsWith('es')) return 60 - idx;
  if (v.lang === 'es-MX') return 20;
  if (v.lang === 'es-AR') return 15;
  if (v.lang.startsWith('es')) return 10;
  return 0;
}

function _getBestSystemVoice() {
  if (!window.speechSynthesis) return null;
  const all = window.speechSynthesis.getVoices();
  if (state.selectedVoiceName) {
    const found = all.find(v => v.name === state.selectedVoiceName);
    if (found) return found;
  }
  const esVoices = all.filter(v => v.lang.startsWith('es'));
  return esVoices.length
    ? esVoices.sort((a, b) => _scoreVoice(b) - _scoreVoice(a))[0]
    : (all[0] || null);
}

function _populateSystemPicker(voices) {
  const select = document.getElementById('voicePicker');
  if (!select || state.usePiper) return;
  const esVoices = voices.filter(v => v.lang.startsWith('es'));
  if (!esVoices.length) return;
  const sorted = [...esVoices].sort((a, b) => _scoreVoice(b) - _scoreVoice(a));
  select.style.display = 'block';
  select.innerHTML = sorted.map(v => {
    const isMale = MALE_VOICES.some(m => v.name.toLowerCase().includes(m));
    return `<option value="${v.name}">${isMale ? '♂' : '♀'} ${v.name} (${v.lang})</option>`;
  }).join('');
  if (!state.selectedVoiceName && sorted[0]) {
    state.selectedVoiceName = sorted[0].name;
    select.value = sorted[0].name;
  } else {
    select.value = state.selectedVoiceName || sorted[0].name;
  }
  select.onchange = () => {
    state.selectedVoiceName = select.value;
    _setBadge('system', select.value);
    speakText('Hola, soy Mauricio. Cuénteme.');
  };
}

function _initWebSpeech() {
  if (!window.speechSynthesis) return;
  const v = window.speechSynthesis.getVoices();
  if (v.length) _populateSystemPicker(v);
  window.speechSynthesis.onvoiceschanged = () =>
    _populateSystemPicker(window.speechSynthesis.getVoices());
}

let _speakDebounce = null;
function speakWithSystem(text, onEnd) {
  if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
  clearTimeout(_speakDebounce);
  _speakDebounce = setTimeout(() => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending)
      window.speechSynthesis.cancel();
    const utt   = new SpeechSynthesisUtterance(text);
    const voice = _getBestSystemVoice();
    if (voice) { utt.voice = voice; utt.lang = voice.lang; }
    else         utt.lang  = 'es-MX';
    utt.rate   = 0.86;
    utt.pitch  = 0.82;
    utt.volume = 1.0;
    utt.onstart = () => _setSpeakingUI(true);
    utt.onend   = () => { _setSpeakingUI(false); if (onEnd) onEnd(); };
    utt.onerror = () => { state.isSpeaking = false; if (onEnd) onEnd(); };
    window.speechSynthesis.speak(utt);
  }, 100);
}

// ─── FUNCIÓN PRINCIPAL TTS ────────────────────────────────────────────────────────
function speakText(text, onEnd) {
  if (state.usePiper && state.piperReady) speakWithPiper(text, onEnd);
  else speakWithSystem(text, onEnd);
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────────
function _setBadge(mode, label) {
  const badge  = document.getElementById('ttsEngineBadge');
  const select = document.getElementById('voicePicker');
  if (!badge) return;
  if (mode === 'loading') {
    badge.textContent = '⏳ ' + label;
    badge.style.color = '#f59e0b';
  } else if (mode === 'piper') {
    badge.textContent = label;
    badge.style.color = '#34d399'; // verde
    if (select) select.style.display = 'none'; // no necesitamos selector con Piper
  } else {
    badge.textContent = '🔉 ' + label;
    badge.style.color = '#818cf8';
  }
}
function _updateStatusEl(msg) {
  const el = document.getElementById('ttsEngineStatus');
  if (el) el.textContent = msg;
}
function _setSpeakingUI(active) {
  const ring = document.getElementById('speakingRing');
  const lbl  = document.getElementById('speakingLabel');
  state.isSpeaking = active;
  if (ring) ring.classList.toggle('active', active);
  if (lbl)  lbl.textContent = active ? '🔊 Hablando...' : '🔊 Listo';
}

// ─── RECONOCIMIENTO DE VOZ ────────────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang          = 'es-UY';
  recognition.continuous    = false;
  recognition.interimResults = true;
  recognition.onstart  = () => { state.recognitionActive = true; };
  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    const el = document.getElementById('transcriptText');
    if (el) el.textContent = transcript;
    if (e.results[e.results.length - 1].isFinal) handleVoiceInput(transcript);
  };
  recognition.onend   = () => { state.recognitionActive = false; if (state.isListening) { _cleanupListeningUI(); state.isListening = false; } };
  recognition.onerror = () => { state.recognitionActive = false; state.isListening = false; _cleanupListeningUI(); };
}

function _cleanupListeningUI() {
  const btn = document.getElementById('btnVoice'); if (btn) btn.classList.remove('listening');
  const lbl = document.getElementById('voiceLabel'); if (lbl) lbl.textContent = 'Hablar';
  const vt  = document.getElementById('voiceTranscript'); if (vt) vt.style.display = 'none';
}

// ─── NAVEGACIÓN ───────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id); if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}
function selectDifficulty(btn) {
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.difficulty = btn.dataset.difficulty;
}
function startTraining() {
  state.sessionCount++;
  updateSessionCounter();
  if (state.sessionCount >= 3 && !state.unlockedDifficult) { state.unlockedDifficult = true; unlockDifficultMode(); }
  resetState();
  showScreen('screenTraining');
  loadPhase('name');
}
function unlockDifficultMode() {
  const grid = document.querySelector('.difficulty-grid');
  if (!grid || document.querySelector('[data-difficulty="dificil"]')) return;
  const btn = document.createElement('button');
  btn.className = 'diff-btn';
  btn.dataset.difficulty = 'dificil';
  btn.setAttribute('onclick', 'selectDifficulty(this)');
  btn.innerHTML = `<span class="diff-emoji">😤</span><span class="diff-name">Difícil</span><span class="diff-desc">Desbloqueado · 3 sesiones</span>`;
  grid.appendChild(btn);
}
function updateSessionCounter() {
  const el = document.getElementById('sessionCounter'); if (el) el.textContent = 'Sesión #' + state.sessionCount + ' del día';
}
function resetState() {
  stopListening();
  if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending))
    window.speechSynthesis.cancel();
  state.currentPhase = 'name';
  state.scores   = { name: 0, same: 0, frame: 0, aim: 0, game: 0 };
  state.attempts = { name: 0, same: 0, frame: 0, aim: 0, game: 0 };
  state.totalScore = 0;
  state.streak = 0;
  state.sessionLog = [];
  updateScoreBadge();
  phases.forEach(p => {
    const el = document.getElementById('phase' + p.toUpperCase()); if (el) el.classList.remove('active', 'done');
    const st = document.getElementById('status' + p.toUpperCase()); if (st) st.textContent = '';
  });
  const ss = document.getElementById('sidebarScore'); if (ss) ss.textContent = '0';
  const st = document.getElementById('sidebarStreak'); if (st) st.textContent = '🔥 0';
}

// ─── FASES ────────────────────────────────────────────────────────────────────
function loadPhase(phase) {
  state.currentPhase = phase;
  const data = arbol[phase];
  const personality = personalities[state.difficulty] || personalities['curioso'];
  const badge = document.getElementById('currentPhaseBadge'); if (badge) badge.textContent = phase.toUpperCase();
  phases.forEach(p => {
    const el = document.getElementById('phase' + p.toUpperCase());
    if (el) { el.classList.remove('active'); if (p === phase) el.classList.add('active'); }
  });
  const mauricioMsg = personality.responseStyle(data.mauricio);
  const mtEl = document.getElementById('mauricioText'); if (mtEl) mtEl.textContent = mauricioMsg.text;
  const fb = document.getElementById('feedbackArea'); if (fb) fb.style.display = 'none';
  const tip = document.getElementById('contextTip'); if (tip) tip.style.display = 'flex';
  const tipText = document.getElementById('contextTipText'); if (tipText) tipText.textContent = data.hint;
  speakText(mauricioMsg.text);
  const opts = [...data.options].sort(() => Math.random() - 0.5);
  state.currentOptions = opts;
  renderOptions(opts);
}
function renderOptions(opts) {
  const grid = document.getElementById('optionsGrid'); if (!grid) return;
  grid.innerHTML = opts.map((opt, i) =>
    `<button class="option-btn" onclick="selectOption(${i})"><span class="option-label">${['A','B','C'][i]}</span><span>${opt.text}</span></button>`
  ).join('');
}
function selectOption(i) { state.attempts[state.currentPhase]++; processChoice(state.currentOptions[i]); }
function processChoice(opt) {
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  const isCorrect = opt.quality === 'perfect', isOk = opt.quality === 'ok';
  const points = isCorrect ? 3 : isOk ? 1 : 0;
  state.scores[state.currentPhase] += points;
  state.totalScore += points;
  if (isCorrect) { state.streak++; state.bestStreak = Math.max(state.streak, state.bestStreak); } else state.streak = 0;
  state.phaseHistory[state.currentPhase].push(opt.quality);
  state.sessionLog.push({ phase: state.currentPhase, quality: opt.quality });
  updateScoreBadge();
  const sS = document.getElementById('sidebarScore'); if (sS) sS.textContent = state.totalScore;
  const sT = document.getElementById('sidebarStreak'); if (sT) sT.textContent = '🔥 ' + state.streak;
  const fb = document.getElementById('feedbackArea'), fbc = document.getElementById('feedbackContent');
  if (fb && fbc) {
    fb.style.display = 'block';
    fbc.className = 'feedback-content ' + (isCorrect ? 'success' : isOk ? 'warning' : 'error');
    fbc.innerHTML = `<strong>${opt.feedback}</strong><div class="feedback-quote">${opt.quote}</div>`;
  }
  if (opt.nextMauricio) setTimeout(() => {
    const el = document.getElementById('mauricioText'); if (el) el.textContent = opt.nextMauricio;
    speakText(opt.nextMauricio);
  }, 1500);
  const phaseEl = document.getElementById('phase' + state.currentPhase.toUpperCase());
  const statusEl = document.getElementById('status' + state.currentPhase.toUpperCase());
  if (phaseEl && statusEl) { phaseEl.classList.remove('active'); phaseEl.classList.add('done'); statusEl.textContent = isCorrect ? '✅' : isOk ? '⚠️' : '❌'; }
  setTimeout(() => {
    const next = phases.indexOf(state.currentPhase) + 1;
    if (next < phases.length) loadPhase(phases[next]); else showResults();
  }, isCorrect ? 2500 : 3500);
}

// ─── VOZ (RECONOCIMIENTO) ────────────────────────────────────────────────────
function toggleVoice() { state.isListening ? stopListening() : startListening(); }
function startListening() {
  if (!recognition) { alert('Reconocimiento de voz no disponible en este browser.'); return; }
  if (state.recognitionActive) return;
  state.isListening = true;
  const btn = document.getElementById('btnVoice'); if (btn) btn.classList.add('listening');
  const lbl = document.getElementById('voiceLabel'); if (lbl) lbl.textContent = 'Escuchando...';
  const vt  = document.getElementById('voiceTranscript'); if (vt) vt.style.display = 'flex';
  const tt  = document.getElementById('transcriptText'); if (tt) tt.textContent = 'Esperando...';
  try { recognition.start(); } catch (e) { state.isListening = false; _cleanupListeningUI(); }
}
function stopListening() {
  if (!state.isListening) return;
  state.isListening = false;
  _cleanupListeningUI();
  if (state.recognitionActive) try { recognition.stop(); } catch (e) {}
}
function handleVoiceInput(transcript) {
  stopListening();
  const t = transcript.toLowerCase();
  let bestMatch = null, bestScore = 0;
  state.currentOptions.forEach((opt, i) => {
    const words = opt.text.toLowerCase().split(' ');
    const matches = words.reduce((acc, w) => acc + (t.includes(w) && w.length > 4 ? 1 : 0), 0);
    const score = matches / Math.max(words.length, 1);
    if (score > bestScore) { bestScore = score; bestMatch = i; }
  });
  if (bestScore > 0.12 && bestMatch !== null) selectOption(bestMatch);
  else {
    const rl = document.getElementById('responseLabel');
    if (rl) rl.textContent = '"' + transcript.substring(0, 60) + '..." — Elegí la opción más cercana:';
  }
}
function toggleVoiceChat() {
  state.isVoiceChatMode = !state.isVoiceChatMode;
  const btn = document.getElementById('btnVoiceChat'), lbl = document.getElementById('voiceChatLabel');
  if (state.isVoiceChatMode) { if (btn) btn.classList.add('active'); if (lbl) lbl.textContent = '🎤 Modo voz activo'; startListening(); }
  else { if (btn) btn.classList.remove('active'); if (lbl) lbl.textContent = 'Modo voz libre'; stopListening(); }
}
function repeatMauricio() { const el = document.getElementById('mauricioText'); if (el) speakText(el.textContent); }

// ─── RESULTADOS ───────────────────────────────────────────────────────────────
function calcPhaseAvg(phase) {
  const hist = state.phaseHistory[phase];
  if (!hist.length) return null;
  const sum = hist.reduce((a, q) => a + (q === 'perfect' ? 3 : q === 'ok' ? 1 : 0), 0);
  return Math.round((sum / (hist.length * 3)) * 100);
}
function showResults() {
  showScreen('screenResults');
  const total = state.totalScore, maxScore = phases.length * 3, pct = Math.round((total / maxScore) * 100);
  let icon = '🏆', title = '¡Pitch dominado!', subtitle = 'Estás listo para el lunes.';
  if (pct < 40) { icon = '😅'; title = 'Hay que practicar más'; subtitle = 'Repetí antes del lunes.'; }
  else if (pct < 70) { icon = '💪'; title = '¡Buen progreso!'; subtitle = 'Enfocate en las fases débiles.'; }
  const rIcon = document.getElementById('resultsIcon'); if (rIcon) rIcon.textContent = icon;
  const rTitle = document.getElementById('resultsTitle'); if (rTitle) rTitle.textContent = title;
  const rSub = document.getElementById('resultsSubtitle'); if (rSub) rSub.textContent = subtitle;
  updateScoreBadge();
  const grid = document.getElementById('resultsGrid');
  if (grid) grid.innerHTML = phases.map(p => {
    const s = state.scores[p], avg = calcPhaseAvg(p);
    const cls = s >= 3 ? 'good' : s >= 1 ? 'ok' : 'bad';
    return `<div class="result-card"><div class="result-phase">${p.toUpperCase()}</div><div class="result-score ${cls}">${s>=3?'✅':s>=1?'⚠️':'❌'}</div><div class="result-label">${s>=3?'Perfecto':s>=1?'Mejorable':'Repasar'}</div>${avg!==null?`<div class="result-trend">${avg}% histórico</div>`:''}</div>`;
  }).join('');
  const weak = phases.filter(p => state.scores[p] < 3).map(p => p.toUpperCase());
  const rSum = document.getElementById('resultsSummary');
  if (rSum) rSum.innerHTML = `<strong>Sesión #${state.sessionCount} · ${total}/${maxScore} (${pct}%)</strong><br>Mejor racha: 🔥 ${state.bestStreak}<br>${weak.length?'⚠️ Repasar: <strong>'+weak.join(', ')+'</strong>':'✅ Todo dominado'}`;
  const rRec = document.getElementById('resultsRecommendation');
  if (rRec) rRec.textContent = pct>=80?'💡 Estás listo. Confiá en tu NAME y FRAME.':pct>=50?'💡 Repetí '+(weak[0]||'FRAME')+'. Es tu fase más débil.':'💡 Practicá 3 sesiones más. SAME es donde más se gana.';
  buildCheatsheet();
}
function restartSameConfig() { startTraining(); }

// ─── CHEATSHEET ───────────────────────────────────────────────────────────────
const cheatsheetData = [
  { phase: 'NAME',  text: 'Soy Adrián Mariotti, fundador de BlueIA. Soy el ingeniero de IA que convierte el caos de tu comercio en un sistema que trabaja solo.' },
  { phase: 'SAME',  text: 'Estuve mirando Imperio. Tienen 9.500 seguidores en Facebook, sorteos, videos. Toda esa fuerza hoy no les dice nada: qué promo dejó más margen, qué clientes volvieron. Cada día empieza de cero.' },
  { phase: 'FRAME', text: 'El problema no es que trabajás poco. Es que Imperio no tiene memoria. Lo que pasa en caja, stock, redes y WhatsApp se pierde. Sin esa memoria, no hay inteligencia. Y sin inteligencia, el crecimiento tiene un techo invisible.' },
  { phase: 'AIM',   text: 'En el primer mes: las consultas repetitivas de WhatsApp se responden solas. Tenés un tablero con tus números clave. Y recibís alertas cuando algo importante se desvía. No tenés que estar en todo.' },
  { phase: 'GAME',  text: 'Mi juego es que cualquier PyME de Canelones tome decisiones con la misma claridad que una gran cadena. Imperio ya es el referente en precio y cercanía. Quiero que sea también el primer supermercado verdaderamente inteligente de la zona. Nivel Tienda Inglesa, costo de PyME.' }
];
function buildCheatsheet() {
  const el  = document.getElementById('cheatsheet');
  const fcC = document.getElementById('fcContent');
  const html = cheatsheetData.map(d => `<h3>${d.phase}</h3><p>${d.text}</p>`).join('');
  if (el)  el.innerHTML  = html;
  if (fcC) fcC.innerHTML = cheatsheetData.map(d => `<div class="fc-phase">${d.phase}</div><div class="fc-text">${d.text}</div>`).join('');
}
function toggleCheatsheet() {
  const el = document.getElementById('cheatsheet');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
function toggleFloatingCheatsheet() {
  const el = document.getElementById('floatingCheatsheet');
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
  if (el.style.display === 'block') buildCheatsheet();
}
function exportGuion() {
  const lines = [
    '=== GUION BlueIA — VISITA A MAURICIO · Imperio del Este, Salinas ===', '',
    ...cheatsheetData.map(d => `[ ${d.phase} ]\n${d.text}\n`),
    '--- Objeciones rápidas ---',
    '"No tengo tiempo"   → "Justo de eso se trata. BlueIA le devuelve tiempo. ¿5 minutos más?"',
    '"Debe ser caro"     → "El primer mes es diagnóstico. El costo es de una app de celular."',
    '"No entiendo de IA" → "No necesita entenderla. Igual que no entiende cómo funciona su freezer."', '',
    `Generado: ${new Date().toLocaleString('es-UY')} · Sesión #${state.sessionCount}`
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'guion-mauricio-blueia.txt';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
function updateScoreBadge() {
  const el = document.getElementById('scoreBadge'); if (el) el.textContent = 'Score: ' + state.totalScore;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
(function init() {
  const html = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  let theme = html.getAttribute('data-theme') || 'dark';
  html.setAttribute('data-theme', theme);
  if (toggle) toggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', theme);
  });
  buildCheatsheet();
  updateSessionCounter();
  // Iniciar Web Speech inmediatamente como base
  _initWebSpeech();
  // Cargar Piper en background (mejora de calidad transparente)
  // La app funciona con Web Speech desde el primer segundo
  // Piper toma control automáticamente cuando está listo
  setTimeout(initPiper, 500);
})();
