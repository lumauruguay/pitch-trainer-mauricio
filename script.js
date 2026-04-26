// BlueIA Pitch Trainer — Lógica principal
// Árbol de decisiones NAME/SAME/FRAME/AIM/GAME para visita a Mauricio (Imperio del Este)

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
  speechRecognition: null,
  currentOptions: [],
  sessionLog: []
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
      { text: "¿Y qué tiene que ver eso con Empire?", type: 'curioso' },
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

// ─── PERSONALIDADES DE MAURICIO ───────────────────────────────────────────────
const personalities = {
  curioso: {
    name: 'Curioso',
    responseStyle: (arr) => arr.find(m => m.type === 'curioso') || arr[0],
    interrupt: false
  },
  ocupado: {
    name: 'Ocupado',
    responseStyle: (arr) => arr.find(m => m.type === 'ocupado') || arr[0],
    interrupt: true
  },
  esceptico: {
    name: 'Escéptico',
    responseStyle: (arr) => arr.find(m => m.type === 'esceptico') || arr[0],
    interrupt: false
  },
  economico: {
    name: 'Economista',
    responseStyle: (arr) => arr.find(m => m.type === 'economico') || arr[0],
    interrupt: false
  },
  abierto: {
    name: 'Abierto',
    responseStyle: (arr) => arr.find(m => m.type === 'abierto') || arr[0],
    interrupt: false
  }
};

// ─── WEB SPEECH API ───────────────────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'es-UY';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('transcriptText').textContent = transcript;
    if (e.results[e.results.length - 1].isFinal) {
      handleVoiceInput(transcript);
    }
  };
  recognition.onend = () => {
    if (state.isListening) stopListening();
  };
  recognition.onerror = (e) => {
    console.warn('Speech error:', e.error);
    stopListening();
  };
}

function speakText(text, onEnd) {
  if (!window.speechSynthesis) return onEnd && onEnd();
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'es-UY';
  utt.rate = 0.95;
  utt.pitch = 0.9;
  // Intentar voz masculina en español
  const voices = window.speechSynthesis.getVoices();
  const esVoice = voices.find(v => v.lang.startsWith('es') && v.name.toLowerCase().includes('male'))
    || voices.find(v => v.lang.startsWith('es'))
    || voices[0];
  if (esVoice) utt.voice = esVoice;
  utt.onstart = () => {
    document.getElementById('speakingRing').classList.add('active');
    document.getElementById('speakingLabel').textContent = '🔊 Hablando...';
    state.isSpeaking = true;
  };
  utt.onend = () => {
    document.getElementById('speakingRing').classList.remove('active');
    document.getElementById('speakingLabel').textContent = '🔊 Listo';
    state.isSpeaking = false;
    if (onEnd) onEnd();
  };
  window.speechSynthesis.speak(utt);
}

// Cargar voces (asíncrono en algunos browsers)
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// ─── NAVEGACIÓN ───────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function selectDifficulty(btn) {
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.difficulty = btn.dataset.difficulty;
}

function startTraining() {
  resetState();
  showScreen('screenTraining');
  loadPhase('name');
}

function resetState() {
  state.currentPhase = 'name';
  state.phaseIndex = 0;
  state.scores = { name: 0, same: 0, frame: 0, aim: 0, game: 0 };
  state.attempts = { name: 0, same: 0, frame: 0, aim: 0, game: 0 };
  state.totalScore = 0;
  state.streak = 0;
  state.sessionLog = [];
  updateScoreBadge();
  // Reset sidebar phases
  phases.forEach(p => {
    const el = document.getElementById('phase' + p.toUpperCase());
    if (el) {
      el.classList.remove('active', 'done');
      document.getElementById('status' + p.toUpperCase()).textContent = '';
    }
  });
}

// ─── FASES ────────────────────────────────────────────────────────────────────
function loadPhase(phase) {
  state.currentPhase = phase;
  const data = arbol[phase];
  const personality = personalities[state.difficulty];

  // Update UI fase
  document.getElementById('currentPhaseBadge').textContent = phase.toUpperCase();
  phases.forEach(p => {
    const el = document.getElementById('phase' + p.toUpperCase());
    if (el) {
      el.classList.remove('active');
      if (p === phase) el.classList.add('active');
    }
  });

  // Seleccionar respuesta de Mauricio según personalidad
  const mauricioMsg = personality.responseStyle(data.mauricio);
  const mauricioText = mauricioMsg.text;

  // Mostrar burbuja
  document.getElementById('mauricioText').textContent = mauricioText;
  document.getElementById('feedbackArea').style.display = 'none';
  document.getElementById('contextTip').style.display = 'flex';
  document.getElementById('contextTipText').textContent = data.hint;

  // Leer en voz alta
  speakText(mauricioText);

  // Shuffle y mostrar opciones
  const opts = [...data.options].sort(() => Math.random() - 0.5);
  state.currentOptions = opts;
  renderOptions(opts);
}

function renderOptions(opts) {
  const grid = document.getElementById('optionsGrid');
  const labels = ['A', 'B', 'C'];
  grid.innerHTML = opts.map((opt, i) => `
    <button class="option-btn" onclick="selectOption(${i})">
      <span class="option-label">${labels[i]}</span>
      <span>${opt.text}</span>
    </button>
  `).join('');
}

function selectOption(index) {
  const opt = state.currentOptions[index];
  state.attempts[state.currentPhase]++;
  processChoice(opt);
}

function processChoice(opt) {
  // Deshabilitar opciones
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

  const isCorrect = opt.quality === 'perfect';
  const isOk = opt.quality === 'ok';

  // Score
  let points = 0;
  if (isCorrect) points = 3;
  else if (isOk) points = 1;
  state.scores[state.currentPhase] += points;
  state.totalScore += points;

  // Streak
  if (isCorrect) {
    state.streak++;
    state.bestStreak = Math.max(state.streak, state.bestStreak);
  } else {
    state.streak = 0;
  }

  // Log
  state.sessionLog.push({ phase: state.currentPhase, quality: opt.quality, text: opt.text });

  // Update scores
  updateScoreBadge();
  document.getElementById('sidebarScore').textContent = state.totalScore;
  document.getElementById('sidebarStreak').textContent = '🔥 ' + state.streak;

  // Mostrar feedback
  const fb = document.getElementById('feedbackArea');
  const fbc = document.getElementById('feedbackContent');
  fb.style.display = 'block';
  fbc.className = 'feedback-content ' + (isCorrect ? 'success' : isOk ? 'warning' : 'error');
  fbc.innerHTML = `<strong>${opt.feedback}</strong><div class="feedback-quote">${opt.quote}</div>`;

  // Respuesta de Mauricio después de nuestra elección
  if (opt.nextMauricio) {
    setTimeout(() => {
      document.getElementById('mauricioText').textContent = opt.nextMauricio;
      speakText(opt.nextMauricio);
    }, 1500);
  }

  // Marcar fase en sidebar
  const phaseEl = document.getElementById('phase' + state.currentPhase.toUpperCase());
  const statusEl = document.getElementById('status' + state.currentPhase.toUpperCase());
  if (phaseEl && statusEl) {
    phaseEl.classList.remove('active');
    phaseEl.classList.add('done');
    statusEl.textContent = isCorrect ? '✅' : isOk ? '⚠️' : '❌';
  }

  // Avanzar a la siguiente fase
  setTimeout(() => {
    const nextIndex = phases.indexOf(state.currentPhase) + 1;
    if (nextIndex < phases.length) {
      loadPhase(phases[nextIndex]);
    } else {
      showResults();
    }
  }, isCorrect ? 2500 : 3500);
}

// ─── VOZ ──────────────────────────────────────────────────────────────────────
function toggleVoice() {
  if (state.isListening) {
    stopListening();
  } else {
    startListening();
  }
}

function startListening() {
  if (!recognition) {
    alert('Tu navegador no soporta reconocimiento de voz. Usá Chrome o Safari.');
    return;
  }
  state.isListening = true;
  const btn = document.getElementById('btnVoice');
  btn.classList.add('listening');
  document.getElementById('voiceLabel').textContent = 'Escuchando...';
  document.getElementById('voiceTranscript').style.display = 'flex';
  document.getElementById('transcriptText').textContent = 'Esperando...';
  try { recognition.start(); } catch(e) { console.warn(e); }
}

function stopListening() {
  state.isListening = false;
  const btn = document.getElementById('btnVoice');
  btn.classList.remove('listening');
  document.getElementById('voiceLabel').textContent = 'Hablar';
  document.getElementById('voiceTranscript').style.display = 'none';
  try { recognition.stop(); } catch(e) {}
}

function handleVoiceInput(transcript) {
  stopListening();
  // Comparar con opciones disponibles por similitud
  const t = transcript.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  state.currentOptions.forEach((opt, i) => {
    const words = opt.text.toLowerCase().split(' ');
    let matches = 0;
    words.forEach(w => { if (t.includes(w) && w.length > 4) matches++; });
    const score = matches / Math.max(words.length, 1);
    if (score > bestScore) { bestScore = score; bestMatch = i; }
  });
  if (bestScore > 0.15 && bestMatch !== null) {
    selectOption(bestMatch);
  } else {
    // Ninguna coincidencia — mostrar transcripción y pedir elegir
    document.getElementById('responseLabel').textContent = '"' + transcript.substring(0,60) + '..." — Elegí la opción más cercana:';
  }
}

function toggleVoiceChat() {
  state.isVoiceChatMode = !state.isVoiceChatMode;
  const btn = document.getElementById('btnVoiceChat');
  const label = document.getElementById('voiceChatLabel');
  if (state.isVoiceChatMode) {
    btn.classList.add('active');
    label.textContent = '🎤 Modo voz activo — hablá libremente';
    startListening();
  } else {
    btn.classList.remove('active');
    label.textContent = 'Modo voz libre';
    stopListening();
  }
}

function repeatMauricio() {
  const text = document.getElementById('mauricioText').textContent;
  speakText(text);
}

// ─── RESULTADOS ───────────────────────────────────────────────────────────────
function showResults() {
  showScreen('screenResults');

  const total = state.totalScore;
  const maxScore = phases.length * 3;
  const pct = Math.round((total / maxScore) * 100);

  // Icono según puntaje
  let icon = '🏆', title = '¡Pitch dominado!', subtitle = 'Estás listo para el lunes.';
  if (pct < 40) { icon = '😅'; title = 'Hay que practicar más'; subtitle = 'Repetí el entrenamiento antes del lunes.'; }
  else if (pct < 70) { icon = '💪'; title = '¡Buen progreso!'; subtitle = 'Enfocate en las fases débiles.'; }

  document.getElementById('resultsIcon').textContent = icon;
  document.getElementById('resultsTitle').textContent = title;
  document.getElementById('resultsSubtitle').textContent = subtitle;
  updateScoreBadge();

  // Cards por fase
  const grid = document.getElementById('resultsGrid');
  grid.innerHTML = phases.map(p => {
    const s = state.scores[p];
    const cls = s >= 3 ? 'good' : s >= 1 ? 'ok' : 'bad';
    const label = s >= 3 ? 'Perfecto' : s >= 1 ? 'Mejorable' : 'Repasar';
    return `<div class="result-card">
      <div class="result-phase">${p.toUpperCase()}</div>
      <div class="result-score ${cls}">${s >= 3 ? '✅' : s >= 1 ? '⚠️' : '❌'}</div>
      <div class="result-label">${label}</div>
    </div>`;
  }).join('');

  // Resumen
  const weak = phases.filter(p => state.scores[p] < 3).map(p => p.toUpperCase());
  document.getElementById('resultsSummary').innerHTML = `
    <strong>Puntaje total: ${total}/${maxScore} (${pct}%)</strong><br>
    Mejor racha: 🔥 ${state.bestStreak} decisiones correctas<br>
    ${weak.length ? '<br>⚠️ Fases a repasar: <strong>' + weak.join(', ') + '</strong>' : '✅ Todas las fases dominadas'}
  `;

  // Recomendación
  let rec = '💡 ';
  if (pct >= 80) rec += 'Estás listo. Mauricio te va a escuchar. Confiá en tu NAME y tu FRAME.';
  else if (pct >= 50) rec += 'Repetí especialmente ' + (weak[0] || 'FRAME') + '. Es tu fase más débil para el lunes.';
  else rec += 'Practicá 3 sesiones más antes del lunes. Enfocate en el SAME — es donde más se gana o se pierde.';
  document.getElementById('resultsRecommendation').textContent = rec;

  // Llenar cheatsheet
  buildCheatsheet();
}

function restartSameConfig() {
  startTraining();
}

// ─── CHEATSHEET ───────────────────────────────────────────────────────────────
const cheatsheetData = [
  {
    phase: 'NAME',
    text: 'Soy Adrián Mariotti, fundador de BlueIA. Soy el ingeniero de IA que convierte el caos de tu comercio en un sistema que trabaja solo.'
  },
  {
    phase: 'SAME',
    text: 'Estuve mirando Imperio. Tienen 9.500 seguidores en Facebook, sorteos, videos. Toda esa fuerza hoy no le dice nada: qué promo dejó más margen, qué clientes volvieron. Cada día empieza de cero.'
  },
  {
    phase: 'FRAME',
    text: 'El problema no es que trabajás poco. Es que Imperio no tiene memoria. Lo que pasa en caja, stock, redes y WhatsApp se pierde. Sin esa memoria, no hay inteligencia. Y sin inteligencia, el crecimiento tiene un techo invisible.'
  },
  {
    phase: 'AIM',
    text: 'En el primer mes: las consultas repetitivas de WhatsApp se responden solas. Tenés un tablero con tus números clave. Recibís alertas cuando algo se desvía. No tenés que estar en todo.'
  },
  {
    phase: 'GAME',
    text: 'Imperio ya es el referente en precio y cercanía. Yo quiero que sea el primer supermercado verdaderamente inteligente de Canelones. Con datos al nivel de Tienda Inglesa, a costo de PyME.'
  }
];

function buildCheatsheet() {
  const html = cheatsheetData.map(item => `
    <h3>${item.phase}</h3>
    <p>${item.text}</p>
  `).join('');
  document.getElementById('cheatsheet').innerHTML = html;
  // Floating cheatsheet
  const fcHtml = cheatsheetData.map(item => `
    <div class="fc-phase">${item.phase}</div>
    <div class="fc-text">${item.text}</div>
  `).join('');
  document.getElementById('fcContent').innerHTML = fcHtml;
}
buildCheatsheet(); // Construir desde el inicio

function toggleCheatsheet() {
  const el = document.getElementById('cheatsheet');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function toggleFloatingCheatsheet() {
  const el = document.getElementById('floatingCheatsheet');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ─── SCORE BADGE ─────────────────────────────────────────────────────────────
function updateScoreBadge() {
  document.getElementById('scoreBadge').textContent = 'Score: ' + state.totalScore;
}

// ─── THEME TOGGLE ────────────────────────────────────────────────────────────
(function() {
  const t = document.getElementById('themeToggle');
  const r = document.documentElement;
  let d = 'dark';
  r.setAttribute('data-theme', d);
  if (t) {
    t.addEventListener('click', () => {
      d = d === 'dark' ? 'light' : 'dark';
      r.setAttribute('data-theme', d);
      t.innerHTML = d === 'dark'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    });
  }
})();
