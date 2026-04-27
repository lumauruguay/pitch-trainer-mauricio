// BlueIA Pitch Trainer — v4.2
// Fix: Siri (Voz 1) prioridad máxima absoluta en Safari macOS

// ─── ESTADO GLOBAL ───────────────────────────────────────────────────────────
const state = {
  difficulty: 'curioso',
  currentPhase: 'name',
  phaseIndex: 0,
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
  kokoroReady: false,
  kokoroPipeline: null,
  kokoroLoading: false,
  selectedKokoroVoice: 'hm_omega',
  useKokoro: false,
  selectedSystemVoiceName: null,
  voiceScanInterval: null   // para el re-scan que busca Siri
};
const phases = ['name', 'same', 'frame', 'aim', 'game'];

// ─── ÁRBOL DE DECISIONES ─────────────────────────────────────────────────────
const arbol = {
  name: {
    mauricio: [
      { text: "Sí señor, ¿en qué le puedo ayudar?", type: 'neutral' },
      { text: "Estoy ocupado ahora, ¿qué necesita?", type: 'ocupado' },
      { text: "Mirá que yo de tecnología no entiendo mucho...", type: 'esceptico' },
      { text: "¿Y eso qué es exactamente?", type: 'curioso' },
      { text: "Cuénteme.", type: 'abierto' }
    ],
    hint: "Usá tu NAME: quién sos + qué resultado concreto generás. No des tu título.",
    options: [
      {
        text: "Soy Adrián Mariotti, fundador de BlueIA. Soy el ingeniero de IA que convierte el caos de un comercio en un sistema que trabaja solo.",
        quality: 'perfect',
        feedback: "PERFECTO ✅ — Identidad + resultado + lenguaje de dueño. Mauricio entendió en 10 segundos.",
        quote: "'Una KPI enciende una luz cuando le preguntan qué hace' — Priestley",
        nextMauricio: "Ah, interesante. ¿Y qué significa eso para un supermercado?"
      },
      {
        text: "Soy consultor de tecnología e inteligencia artificial para empresas.",
        quality: 'ok',
        feedback: "REGULAR ⚠️ — Demasiado genérico. 'Consultor de tecnología' no le dice nada. Hablá del resultado.",
        quote: "Meléndez: 'Un preguntador es un gran argumentador. Pero primero tenés que conectar con su mundo.'",
        nextMauricio: "Mmm, hay muchos consultores de tecnología. ¿Qué me diferencia esto de lo que ya tengo?"
      },
      {
        text: "Vengo a contarle sobre BlueIA, una plataforma de IA para PyMEs uruguayas.",
        quality: 'bad',
        feedback: "INCORRECTO ❌ — Empezaste por la herramienta, no por el resultado. Mauricio ya apagó el interés.",
        quote: "Priestley: 'No describas lo que hacés — describí el mundo que creás para tu cliente.'",
        nextMauricio: "Ah, otra herramienta más... No tengo tiempo ahora."
      }
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
      {
        text: "Mauricio, estuve mirando cómo funciona Imperio. Tienen una comunidad enorme en Facebook, miles de seguidores, sorteos, videos. Pero toda esa fuerza hoy no le dice nada: qué promo dejó más margen, qué clientes volvieron, dónde se fue la plata. Cada día empieza de cero.",
        quality: 'perfect',
        feedback: "PERFECTO ✅ — Demostraste que hiciste la tarea. Nombraste SU negocio, SU fuerza y SU punto ciego.",
        quote: "Priestley: 'Si asienten mientras hablás, encontraste el SAME.'",
        nextMauricio: "Es verdad eso... a veces hacemos una promo y no sabemos bien si funcionó o no."
      },
      {
        text: "La mayoría de los supermercados depende de una sola persona para todo. Si no estás vos, se cae.",
        quality: 'ok',
        feedback: "BIEN ⚠️ — Buen dolor, pero genérico. No habló de Imperio específicamente. Personalizá más.",
        quote: "'Usá sus propias palabras, no las tuyas.' — Guion BlueIA",
        nextMauricio: "Sí, algo así pasa acá también. ¿Qué propone usted?"
      },
      {
        text: "Con BlueIA puede automatizar sus procesos y tener dashboards en tiempo real.",
        quality: 'bad',
        feedback: "INCORRECTO ❌ — Saltaste directo a la solución sin validar el dolor. Mauricio no conectó aún.",
        quote: "Meléndez: 'Nunca ofrezcas la solución antes de que el cliente confirme su problema.'",
        nextMauricio: "¿Dashboards? No sé si necesito eso ahora mismo..."
      }
    ]
  },
  frame: {
    mauricio: [
      { text: "Sí, eso nos pasa. ¿Pero cómo lo resolvés vos?", type: 'curioso' },
      { text: "¿Cuánto sale eso?", type: 'economico' },
      { text: "¿Y eso funciona realmente para un super?", type: 'esceptico' },
      { text: "Dale, explicame rápido.", type: 'ocupado' },
      { text: "Me parece interesante. Seguí.", type: 'abierto' }
    ],
    hint: "Explicá POR QUÉ el problema existe. Tu diagnóstico único. No la solución todavía.",
    options: [
      {
        text: "El problema no es que trabajás poco, Mauricio. Es que Imperio no tiene memoria. Lo que pasa en caja, en stock, en redes y en WhatsApp se pierde. Sin esa memoria, no hay inteligencia. Y sin inteligencia, el crecimiento tiene un techo invisible.",
        quality: 'perfect',
        feedback: "PERFECTO ✅ — Diagnóstico poderoso. 'Imperio no tiene memoria' es una frase que no va a olvidar.",
        quote: "Priestley: 'Tu FRAME es tu foso competitivo. Ningún otro proveedor dice esto.'",
        nextMauricio: "Mirá... nunca lo había pensado así. ¿Y cómo se le da esa memoria?"
      },
      {
        text: "El problema es que no tienen un sistema integrado para gestionar todo.",
        quality: 'ok',
        feedback: "REGULAR ⚠️ — Correcto pero técnico. 'Sistema integrado' no conecta emocionalmente.",
        quote: "BlueIA FRAME: 'El negocio no tiene memoria. Cada día empieza de cero.'",
        nextMauricio: "Bueno... ¿y eso qué costaría?"
      },
      {
        text: "La solución es un dashboard con sus métricas clave y automatizaciones de WhatsApp.",
        quality: 'bad',
        feedback: "INCORRECTO ❌ — Saltaste al AIM antes del FRAME. Mauricio no entiende por qué lo necesita.",
        quote: "Sin FRAME, el AIM suena a venta de software. Con FRAME, suena a diagnóstico de médico.",
        nextMauricio: "¿Cuánto sale?"
      }
    ]
  },
  aim: {
    mauricio: [
      { text: "¿Y cuánto tiempo lleva ver resultados?", type: 'curioso' },
      { text: "¿Cuánto sale esto?", type: 'economico' },
      { text: "Sonó complicado. ¿Vos lo implementás todo?", type: 'esceptico' },
      { text: "Ok, ¿qué gano yo concretamente?", type: 'neutral' },
      { text: "Tengo que revisar mis números antes de decidir.", type: 'ocupado' }
    ],
    hint: "Nombrá la transformación concreta: tiempo, plata, tranquilidad. Sé específico.",
    options: [
      {
        text: "En el primer mes, mi objetivo es devolverle horas reales de su semana. Las consultas repetitivas de WhatsApp se responden solas. Tiene un tablero simple con sus números clave. Y recibe alertas cuando algo importante se desvía. No tiene que estar en todo.",
        quality: 'perfect',
        feedback: "PERFECTO ✅ — Tres transformaciones concretas: tiempo, claridad, autonomía. Exactamente lo que quiere escuchar.",
        quote: "Priestley: 'Ligá tu producto a más dinero, más tiempo o mejor calidad de vida. Sé específico.'",
        nextMauricio: "Hmm... eso de las consultas solas me interesa. Nos matan por WhatsApp."
      },
      {
        text: "BlueIA le da inteligencia de negocios avanzada con análisis predictivo y machine learning.",
        quality: 'bad',
        feedback: "INCORRECTO ❌ — Demasiado técnico. 'Machine learning' no le dice nada a Mauricio.",
        quote: "'Hablá del resultado, no de la tecnología.' — Principio fundacional BlueIA",
        nextMauricio: "No entiendo bien eso... ¿y cuánto sale?"
      },
      {
        text: "El resultado es menos tiempo en tareas repetitivas y más claridad para tomar decisiones.",
        quality: 'ok',
        feedback: "BIEN ⚠️ — Correcto pero vago. Faltó especificidad: ¿cuánto tiempo? ¿cuáles decisiones?",
        quote: "'Sin AIM concreto, el pitch muere en el FRAME.' — Guion BlueIA",
        nextMauricio: "Ok, suena bien. ¿Y qué significa eso en mi día a día?"
      }
    ]
  },
  game: {
    mauricio: [
      { text: "¿Y Imperio sería el primero en la zona?", type: 'curioso' },
      { text: "¿Qué inversión estamos hablando?", type: 'economico' },
      { text: "Todo eso suena muy lindo, pero...", type: 'esceptico' },
      { text: "Interesante. ¿Cómo seguimos?", type: 'abierto' },
      { text: "Ok, mandame algo por escrito.", type: 'ocupado' }
    ],
    hint: "Convertí la venta en una causa. Él no compra tecnología — es el primero inteligente de la zona.",
    options: [
      {
        text: "Mi juego es que cualquier PyME de Canelones pueda tomar decisiones con la misma claridad que una gran cadena. Imperio ya es el referente en precio y cercanía. Yo quiero que sea también el primer supermercado verdaderamente inteligente de la zona. Con datos y automatización al nivel de Tienda Inglesa, pero a un costo de PyME.",
        quality: 'perfect',
        feedback: "PERFECTO ✅ — Identidad poderosa: 'el primero inteligente de Canelones'. Eso no se negocia por precio.",
        quote: "Priestley: 'El GAME convierte una venta en una causa. Identidad > precio.'",
        nextMauricio: "Mire, me interesa. ¿Cuándo me puede mostrar algo concreto?"
      },
      {
        text: "Estamos ayudando a que las PyMEs de Uruguay sean más competitivas con inteligencia artificial.",
        quality: 'ok',
        feedback: "REGULAR ⚠️ — Buena intención pero genérica. Faltó hacer a Imperio protagonista del GAME.",
        quote: "'El cliente debe sentir que está siendo parte de algo más grande.' — Priestley",
        nextMauricio: "Sí, suena bien. Mándeme información."
      },
      {
        text: "Tenemos un precio especial para los primeros clientes del programa.",
        quality: 'bad',
        feedback: "INCORRECTO ❌ — Cerraste con descuento en lugar de con visión. Eso convierte el pitch en venta de software.",
        quote: "'Cerrá siempre con el GAME antes de la oferta.' — Guion BlueIA",
        nextMauricio: "¿Cuánto es ese precio especial?"
      }
    ]
  }
};

// ─── PERSONALIDADES ───────────────────────────────────────────────────────────
const personalities = {
  curioso:   { name: 'Curioso',    responseStyle: (arr) => arr.find(m => m.type === 'curioso')   || arr[0] },
  ocupado:   { name: 'Ocupado',    responseStyle: (arr) => arr.find(m => m.type === 'ocupado')   || arr[0] },
  esceptico: { name: 'Escéptico',  responseStyle: (arr) => arr.find(m => m.type === 'esceptico') || arr[0] },
  economico: { name: 'Economista', responseStyle: (arr) => arr.find(m => m.type === 'economico') || arr[0] },
  abierto:   { name: 'Abierto',    responseStyle: (arr) => arr.find(m => m.type === 'abierto')   || arr[0] },
  dificil:   { name: '😤 Difícil', responseStyle: (arr) => arr.find(m => m.type === 'esceptico') || arr[arr.length - 1] }
};

// ─── KOKORO TTS ENGINE ────────────────────────────────────────────────────────
const KOKORO_VOICE_MAP = { 'hm_omega': 'hm_omega', 'hm_psi': 'hm_psi', 'hf_alpha': 'hf_alpha' };

function _setTTSBadge(mode, voiceName) {
  const badge  = document.getElementById('ttsEngineBadge');
  const status = document.getElementById('ttsEngineStatus');
  const picker = document.getElementById('voicePicker');
  if (!badge) return;
  if (mode === 'kokoro') {
    badge.className = 'badge-enhanced';
    badge.textContent = '⭐ Kokoro TTS — voz premium';
    if (status) status.textContent = '✅ Kokoro listo';
    if (picker) picker.style.display = 'block';
  } else if (mode === 'loading') {
    badge.className = 'badge-enhanced';
    badge.textContent = '⏳ Cargando Kokoro...';
    if (status) status.textContent = 'Descargando modelo. Solo ocurre la primera vez.';
  } else {
    badge.className = 'badge-enhanced';
    badge.style.background = '#6366f122';
    badge.style.color = '#818cf8';
    const isSiri = voiceName && voiceName.toLowerCase().includes('siri');
    badge.textContent = isSiri ? `⭐ Siri activa · ${voiceName}` : voiceName ? `🔄 Sistema · ${voiceName}` : '🔄 Voz del sistema';
    if (status) status.textContent = voiceName ? `Voz activa: ${voiceName}` : 'Usando voces del dispositivo.';
  }
}

async function initKokoro() {
  if (state.kokoroLoading || state.kokoroReady) return;
  state.kokoroLoading = true;
  _setTTSBadge('loading');
  try {
    const { KokoroTTS } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1/dist/kokoro.js');
    const pipeline = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'auto' });
    state.kokoroPipeline = pipeline;
    state.kokoroReady = true;
    state.useKokoro = true;
    state.kokoroLoading = false;
    _setTTSBadge('kokoro');
  } catch (err) {
    state.kokoroLoading = false;
    state.useKokoro = false;
    _waitForVoicesAndPopulate();
  }
}

async function speakWithKokoro(text, onEnd) {
  if (!state.kokoroPipeline) { if (onEnd) onEnd(); return; }
  try {
    const voice  = KOKORO_VOICE_MAP[state.selectedKokoroVoice] || 'hm_omega';
    const result = await state.kokoroPipeline(text, { voice, speed: 0.95 });
    const ctx    = new (window.AudioContext || window.webkitAudioContext)();
    const buf    = ctx.createBuffer(1, result.audio.length, result.sampling_rate);
    buf.getChannelData(0).set(result.audio);
    const src    = ctx.createBufferSource();
    src.buffer   = buf;
    src.connect(ctx.destination);
    _setSpeakingUI(true);
    src.onended = () => { _setSpeakingUI(false); ctx.close(); if (onEnd) onEnd(); };
    src.start();
  } catch (err) {
    state.isSpeaking = false;
    speakWithSystem(text, onEnd);
  }
}

// ─── WEB SPEECH API ──────────────────────────────────────────────────────────────

// PRIORIDAD DE VOCES:
// 1. Siri (cualquier variante) → score 200  ← PRIORIDAD MÁXIMA ABSOLUTA
// 2. Voces masculinas es-MX (Eddy, Reed, Rocko...) → score 100-90
// 3. Voces masculinas es-ES → score 80-70
// 4. Femeninas es-MX → score 20
// 5. Resto → score 10
const MALE_VOICE_NAMES = ['eddy','reed','rocko','grandpa','jorge','juan','diego','carlos','miguel','pedro'];

function _scoreVoice(v) {
  const n = v.name.toLowerCase();
  // Siri SIEMPRE gana, sin importar el idioma
  if (n.includes('siri')) return 200;
  // Masculinas es-MX
  const maleIdx = MALE_VOICE_NAMES.findIndex(m => n.includes(m));
  if (maleIdx !== -1 && v.lang === 'es-MX') return 100 - maleIdx;
  if (maleIdx !== -1 && v.lang.startsWith('es')) return 80 - maleIdx;
  if (v.lang === 'es-MX') return 20;
  if (v.lang === 'es-AR') return 15;
  if (v.lang.startsWith('es')) return 10;
  return 0;
}

function _getBestVoice(voices) {
  const esVoices = voices.filter(v => v.lang.startsWith('es'));
  if (!esVoices.length) return voices[0] || null;
  return esVoices.sort((a, b) => _scoreVoice(b) - _scoreVoice(a))[0];
}

function _getActiveSystemVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (state.selectedSystemVoiceName) {
    const found = voices.find(v => v.name === state.selectedSystemVoiceName);
    if (found) return found;
  }
  return _getBestVoice(voices);
}

let _speakDebounce = null;
function speakWithSystem(text, onEnd) {
  if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
  clearTimeout(_speakDebounce);
  _speakDebounce = setTimeout(() => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending)
      window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = 'es-MX';
    utt.rate  = 0.92;
    utt.pitch = 0.9;
    const voice = _getActiveSystemVoice();
    if (voice) utt.voice = voice;
    utt.onstart = () => _setSpeakingUI(true);
    utt.onend   = () => { _setSpeakingUI(false); if (onEnd) onEnd(); };
    utt.onerror = () => { state.isSpeaking = false; if (onEnd) onEnd(); };
    window.speechSynthesis.speak(utt);
  }, 80);
}

function _setSpeakingUI(active) {
  const ring = document.getElementById('speakingRing');
  const lbl  = document.getElementById('speakingLabel');
  state.isSpeaking = active;
  if (ring) ring.classList.toggle('active', active);
  if (lbl)  lbl.textContent = active ? '🔊 Hablando...' : '🔊 Listo';
}

function _populateSystemPicker(voices) {
  const select = document.getElementById('voicePicker');
  if (!select) return;
  const esVoices = voices.filter(v => v.lang.startsWith('es'));
  // Incluir también Siri aunque su lang no empiece con 'es' (en Safari puede ser 'es-419' u otro)
  const siriVoices = voices.filter(v => v.name.toLowerCase().includes('siri') && !esVoices.includes(v));
  const allVoices = [...esVoices, ...siriVoices];
  if (!allVoices.length) return;

  const sorted = [...allVoices].sort((a, b) => _scoreVoice(b) - _scoreVoice(a));

  select.style.display = 'block';
  select.innerHTML = sorted.map(v => {
    const n      = v.name.toLowerCase();
    const isSiri = n.includes('siri');
    const isMale = MALE_VOICE_NAMES.some(m => n.includes(m));
    const prefix = isSiri ? '⭐' : isMale ? '♂' : '♀';
    const label  = isSiri ? `${prefix} ${v.name} — 🎯 RECOMENDADA` : `${prefix} ${v.name} (${v.lang})`;
    return `<option value="${v.name}">${label}</option>`;
  }).join('');

  const best = _getBestVoice(allVoices);
  if (best && best.name !== state.selectedSystemVoiceName) {
    select.value = best.name;
    state.selectedSystemVoiceName = best.name;
    _setTTSBadge('system', best.name);
  }

  select.onchange = () => {
    state.selectedSystemVoiceName = select.value;
    _setTTSBadge('system', select.value);
    speakWithSystem('Hola, soy Mauricio. Cuénteme.');
  };
}

// Re-scan periódico: Safari carga Siri de forma diferida (hasta 3-4s después del DOMContentLoaded)
// Cuando Siri aparece, actualizamos el selector automáticamente
function _startVoiceRescan() {
  let scansLeft = 8; // escanear hasta 8 veces (cada 1.5s = hasta 12s)
  state.voiceScanInterval = setInterval(() => {
    if (state.useKokoro) { clearInterval(state.voiceScanInterval); return; }
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    const hasSiri = voices.some(v => v.name.toLowerCase().includes('siri'));
    if (hasSiri) {
      clearInterval(state.voiceScanInterval);
      // Siri encontrada — repoblar selector y seleccionarla
      _populateSystemPicker(voices);
      // Si aún no hay elección manual, forzar Siri
      if (!state.selectedSystemVoiceName || !state.selectedSystemVoiceName.toLowerCase().includes('siri')) {
        const siriVoice = voices.find(v => v.name.toLowerCase().includes('siri'));
        if (siriVoice) {
          state.selectedSystemVoiceName = siriVoice.name;
          const sel = document.getElementById('voicePicker');
          if (sel) sel.value = siriVoice.name;
          _setTTSBadge('system', siriVoice.name);
        }
      }
    }
    scansLeft--;
    if (scansLeft <= 0) clearInterval(state.voiceScanInterval);
  }, 1500);
}

function _waitForVoicesAndPopulate() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) _populateSystemPicker(voices);
  window.speechSynthesis.onvoiceschanged = () => {
    if (!state.useKokoro) _populateSystemPicker(window.speechSynthesis.getVoices());
  };
  // Re-scan diferido para Siri en Safari
  _startVoiceRescan();
}

// ─── FUNCIÓN PRINCIPAL DE SÍNTESIS ───────────────────────────────────────────
function speakText(text, onEnd) {
  if (state.useKokoro && state.kokoroReady) speakWithKokoro(text, onEnd);
  else speakWithSystem(text, onEnd);
}

document.addEventListener('change', (e) => {
  if (e.target.id !== 'voicePicker') return;
  // Solo manejar voces Kokoro; las del sistema las maneja select.onchange
  if (e.target.value.startsWith('kokoro_')) state.selectedKokoroVoice = e.target.value.replace('kokoro_', '');
});

// ─── RECONOCIMIENTO DE VOZ ────────────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'es-UY';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onstart  = () => { state.recognitionActive = true; };
  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    const el = document.getElementById('transcriptText');
    if (el) el.textContent = transcript;
    if (e.results[e.results.length - 1].isFinal) handleVoiceInput(transcript);
  };
  recognition.onend = () => { state.recognitionActive = false; if (state.isListening) { _cleanupListeningUI(); state.isListening = false; } };
  recognition.onerror = (e) => { state.recognitionActive = false; state.isListening = false; _cleanupListeningUI(); };
}

function _cleanupListeningUI() {
  const btn = document.getElementById('btnVoice');
  const lbl = document.getElementById('voiceLabel');
  const vt  = document.getElementById('voiceTranscript');
  if (btn) btn.classList.remove('listening');
  if (lbl) lbl.textContent  = 'Hablar';
  if (vt)  vt.style.display = 'none';
}

// ─── NAVEGACIÓN ───────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
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
  const el = document.getElementById('sessionCounter');
  if (el) el.textContent = 'Sesión #' + state.sessionCount + ' del día';
}
function resetState() {
  stopListening();
  if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) window.speechSynthesis.cancel();
  state.currentPhase = 'name';
  state.phaseIndex = 0;
  state.scores = { name: 0, same: 0, frame: 0, aim: 0, game: 0 };
  state.attempts = { name: 0, same: 0, frame: 0, aim: 0, game: 0 };
  state.totalScore = 0;
  state.streak = 0;
  state.sessionLog = [];
  updateScoreBadge();
  phases.forEach(p => {
    const el = document.getElementById('phase' + p.toUpperCase());
    const st = document.getElementById('status' + p.toUpperCase());
    if (el) el.classList.remove('active', 'done');
    if (st) st.textContent = '';
  });
  const sidebar = document.getElementById('sidebarScore');
  const streak  = document.getElementById('sidebarStreak');
  if (sidebar) sidebar.textContent = '0';
  if (streak)  streak.textContent  = '🔥 0';
}

// ─── FASES ────────────────────────────────────────────────────────────────────
function loadPhase(phase) {
  state.currentPhase = phase;
  const data = arbol[phase];
  const personality = personalities[state.difficulty] || personalities['curioso'];
  const badge = document.getElementById('currentPhaseBadge');
  if (badge) badge.textContent = phase.toUpperCase();
  phases.forEach(p => {
    const el = document.getElementById('phase' + p.toUpperCase());
    if (el) { el.classList.remove('active'); if (p === phase) el.classList.add('active'); }
  });
  const mauricioMsg = personality.responseStyle(data.mauricio);
  const mtEl = document.getElementById('mauricioText');
  if (mtEl) mtEl.textContent = mauricioMsg.text;
  const fb = document.getElementById('feedbackArea');
  if (fb) fb.style.display = 'none';
  const tip = document.getElementById('contextTip');
  if (tip) tip.style.display = 'flex';
  const tipText = document.getElementById('contextTipText');
  if (tipText) tipText.textContent = data.hint;
  speakText(mauricioMsg.text);
  const opts = [...data.options].sort(() => Math.random() - 0.5);
  state.currentOptions = opts;
  renderOptions(opts);
}
function renderOptions(opts) {
  const grid = document.getElementById('optionsGrid');
  const labels = ['A', 'B', 'C'];
  if (!grid) return;
  grid.innerHTML = opts.map((opt, i) => `
    <button class="option-btn" onclick="selectOption(${i})">
      <span class="option-label">${labels[i]}</span>
      <span>${opt.text}</span>
    </button>
  `).join('');
}
function selectOption(index) { state.attempts[state.currentPhase]++; processChoice(state.currentOptions[index]); }
function processChoice(opt) {
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  const isCorrect = opt.quality === 'perfect';
  const isOk      = opt.quality === 'ok';
  const points    = isCorrect ? 3 : isOk ? 1 : 0;
  state.scores[state.currentPhase] += points;
  state.totalScore += points;
  if (isCorrect) { state.streak++; state.bestStreak = Math.max(state.streak, state.bestStreak); } else state.streak = 0;
  state.phaseHistory[state.currentPhase].push(opt.quality);
  state.sessionLog.push({ phase: state.currentPhase, quality: opt.quality });
  updateScoreBadge();
  const sS = document.getElementById('sidebarScore');
  const sT = document.getElementById('sidebarStreak');
  if (sS) sS.textContent = state.totalScore;
  if (sT) sT.textContent = '🔥 ' + state.streak;
  const fb  = document.getElementById('feedbackArea');
  const fbc = document.getElementById('feedbackContent');
  if (fb && fbc) {
    fb.style.display = 'block';
    fbc.className = 'feedback-content ' + (isCorrect ? 'success' : isOk ? 'warning' : 'error');
    fbc.innerHTML = `<strong>${opt.feedback}</strong><div class="feedback-quote">${opt.quote}</div>`;
  }
  if (opt.nextMauricio) setTimeout(() => { const el = document.getElementById('mauricioText'); if (el) el.textContent = opt.nextMauricio; speakText(opt.nextMauricio); }, 1500);
  const phaseEl  = document.getElementById('phase' + state.currentPhase.toUpperCase());
  const statusEl = document.getElementById('status' + state.currentPhase.toUpperCase());
  if (phaseEl && statusEl) { phaseEl.classList.remove('active'); phaseEl.classList.add('done'); statusEl.textContent = isCorrect ? '✅' : isOk ? '⚠️' : '❌'; }
  setTimeout(() => {
    const nextIndex = phases.indexOf(state.currentPhase) + 1;
    if (nextIndex < phases.length) loadPhase(phases[nextIndex]); else showResults();
  }, isCorrect ? 2500 : 3500);
}

// ─── VOZ ─────────────────────────────────────────────────────────────────────────
function toggleVoice() { state.isListening ? stopListening() : startListening(); }
function startListening() {
  if (!recognition) { alert('Usá Safari en macOS para voz.'); return; }
  if (state.recognitionActive) return;
  state.isListening = true;
  const btn = document.getElementById('btnVoice');
  const lbl = document.getElementById('voiceLabel');
  const vt  = document.getElementById('voiceTranscript');
  const tt  = document.getElementById('transcriptText');
  if (btn) btn.classList.add('listening');
  if (lbl) lbl.textContent = 'Escuchando...';
  if (vt)  vt.style.display = 'flex';
  if (tt)  tt.textContent   = 'Esperando...';
  try { recognition.start(); } catch (e) { state.isListening = false; _cleanupListeningUI(); }
}
function stopListening() {
  if (!state.isListening) return;
  state.isListening = false;
  _cleanupListeningUI();
  if (state.recognitionActive) { try { recognition.stop(); } catch (e) {} }
}
function handleVoiceInput(transcript) {
  stopListening();
  const t = transcript.toLowerCase();
  let bestMatch = null, bestScore = 0;
  state.currentOptions.forEach((opt, i) => {
    const words = opt.text.toLowerCase().split(' ');
    let matches = 0;
    words.forEach(w => { if (t.includes(w) && w.length > 4) matches++; });
    const score = matches / Math.max(words.length, 1);
    if (score > bestScore) { bestScore = score; bestMatch = i; }
  });
  if (bestScore > 0.12 && bestMatch !== null) selectOption(bestMatch);
  else { const rl = document.getElementById('responseLabel'); if (rl) rl.textContent = '"' + transcript.substring(0, 60) + '..." — Elegí la opción más cercana:'; }
}
function toggleVoiceChat() {
  state.isVoiceChatMode = !state.isVoiceChatMode;
  const btn = document.getElementById('btnVoiceChat');
  const lbl = document.getElementById('voiceChatLabel');
  if (state.isVoiceChatMode) { if (btn) btn.classList.add('active'); if (lbl) lbl.textContent = '🎤 Modo voz activo'; startListening(); }
  else { if (btn) btn.classList.remove('active'); if (lbl) lbl.textContent = 'Modo voz libre'; stopListening(); }
}
function repeatMauricio() { const el = document.getElementById('mauricioText'); if (el) speakText(el.textContent); }

// ─── RESULTADOS ───────────────────────────────────────────────────────────────────
function calcPhaseAvg(phase) {
  const hist = state.phaseHistory[phase];
  if (!hist.length) return null;
  const sum = hist.reduce((a, q) => a + (q === 'perfect' ? 3 : q === 'ok' ? 1 : 0), 0);
  return Math.round((sum / (hist.length * 3)) * 100);
}
function showResults() {
  showScreen('screenResults');
  const total = state.totalScore;
  const maxScore = phases.length * 3;
  const pct = Math.round((total / maxScore) * 100);
  let icon = '🏆', title = '¡Pitch dominado!', subtitle = 'Estás listo para el lunes.';
  if (pct < 40) { icon = '😅'; title = 'Hay que practicar más'; subtitle = 'Repetí antes del lunes.'; }
  else if (pct < 70) { icon = '💪'; title = '¡Buen progreso!'; subtitle = 'Enfocate en las fases débiles.'; }
  const rIcon = document.getElementById('resultsIcon'); if (rIcon) rIcon.textContent = icon;
  const rTitle = document.getElementById('resultsTitle'); if (rTitle) rTitle.textContent = title;
  const rSub = document.getElementById('resultsSubtitle'); if (rSub) rSub.textContent = subtitle;
  updateScoreBadge();
  const grid = document.getElementById('resultsGrid');
  if (grid) grid.innerHTML = phases.map(p => {
    const s = state.scores[p]; const avg = calcPhaseAvg(p);
    const cls = s >= 3 ? 'good' : s >= 1 ? 'ok' : 'bad';
    const lbl = s >= 3 ? 'Perfecto' : s >= 1 ? 'Mejorable' : 'Repasar';
    const trend = avg !== null ? `<div class="result-trend">${avg}% histórico</div>` : '';
    return `<div class="result-card"><div class="result-phase">${p.toUpperCase()}</div><div class="result-score ${cls}">${s >= 3 ? '✅' : s >= 1 ? '⚠️' : '❌'}</div><div class="result-label">${lbl}</div>${trend}</div>`;
  }).join('');
  const weak = phases.filter(p => state.scores[p] < 3).map(p => p.toUpperCase());
  const rSum = document.getElementById('resultsSummary');
  if (rSum) rSum.innerHTML = `<strong>Sesión #${state.sessionCount} · ${total}/${maxScore} (${pct}%)</strong><br>Mejor racha: 🔥 ${state.bestStreak}<br>${weak.length ? '⚠️ Repasar: <strong>' + weak.join(', ') + '</strong>' : '✅ Todo dominado'}`;
  let rec = '💡 ';
  if (pct >= 80) rec += 'Estás listo. Confiá en tu NAME y tu FRAME.';
  else if (pct >= 50) rec += 'Repetí ' + (weak[0] || 'FRAME') + '. Es tu fase más débil.';
  else rec += 'Practicá 3 sesiones más. SAME es donde más se gana.';
  const rRec = document.getElementById('resultsRecommendation'); if (rRec) rRec.textContent = rec;
  buildCheatsheet();
}
function restartSameConfig() { startTraining(); }

// ─── CHEATSHEET ───────────────────────────────────────────────────────────────
const cheatsheetData = [
  { phase: 'NAME',  text: 'Soy Adrián Mariotti, fundador de BlueIA. Soy el ingeniero de IA que convierte el caos de tu comercio en un sistema que trabaja solo.' },
  { phase: 'SAME',  text: 'Estuve mirando Imperio. Tienen 9.500 seguidores en Facebook, sorteos, videos. Toda esa fuerza hoy no le dice nada: qué promo dejó más margen, qué clientes volvieron. Cada día empieza de cero.' },
  { phase: 'FRAME', text: 'El problema no es que trabajás poco. Es que Imperio no tiene memoria. Lo que pasa en caja, stock, redes y WhatsApp se pierde. Sin esa memoria, no hay inteligencia. Y sin inteligencia, el crecimiento tiene un techo invisible.' },
  { phase: 'AIM',   text: 'En el primer mes: las consultas repetitivas de WhatsApp se responden solas. Tenés un tablero con tus números clave. Y recibís alertas cuando algo importante se desvía. No tenés que estar en todo.' },
  { phase: 'GAME',  text: 'Mi juego es que cualquier PyME de Canelones tome decisiones con la misma claridad que una gran cadena. Imperio ya es el referente en precio y cercanía. Yo quiero que sea también el primer supermercado verdaderamente inteligente de la zona. Nivel Tienda Inglesa, costo de PyME.' }
];
function buildCheatsheet() {
  const el  = document.getElementById('cheatsheet');
  const fcC = document.getElementById('fcContent');
  const html = cheatsheetData.map(d => `<h3>${d.phase}</h3><p>${d.text}</p>`).join('');
  if (el)  el.innerHTML  = html;
  if (fcC) fcC.innerHTML = cheatsheetData.map(d => `<div class="fc-phase">${d.phase}</div><div class="fc-text">${d.text}</div>`).join('');
}
function toggleCheatsheet() { const el = document.getElementById('cheatsheet'); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }
function toggleFloatingCheatsheet() {
  const el = document.getElementById('floatingCheatsheet');
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
  if (el.style.display === 'block') buildCheatsheet();
}
function exportGuion() {
  const lines = [
    '=== GUION BlueIA — VISITA A MAURICIO · Imperio del Este, Salinas ===', '',
    ...cheatsheetData.map(d => [`[ ${d.phase} ]`, d.text, ''].join('\n')),
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

function updateScoreBadge() { const el = document.getElementById('scoreBadge'); if (el) el.textContent = 'Score: ' + state.totalScore; }

// ─── INIT ─────────────────────────────────────────────────────────────────────
(function init() {
  const html = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  let theme = html.getAttribute('data-theme') || 'dark';
  html.setAttribute('data-theme', theme);
  if (toggle) toggle.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; html.setAttribute('data-theme', theme); });
  buildCheatsheet();
  updateSessionCounter();
  _waitForVoicesAndPopulate(); // inicia re-scan periódico para Siri
  initKokoro();                // intenta Kokoro en background
})();
