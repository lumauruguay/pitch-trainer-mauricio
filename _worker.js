// BlueIA Pitch Trainer — Cloudflare Pages Worker proxy para ElevenLabs
// Sintaxis addEventListener — compatible con Cloudflare Pages sin build step.
// Variable de entorno requerida: EL_API_KEY (Secret en Pages > Settings)

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  // Proxy TTS
  if (url.pathname === '/tts' && request.method === 'POST') {
    let body;
    try { body = await request.json(); }
    catch { return errResponse(400, 'JSON inválido'); }

    const { text, voiceId, model, settings } = body;
    if (!text || !voiceId) return errResponse(400, 'Faltan text o voiceId');

    // EL_API_KEY inyectada como variable de entorno en Cloudflare Pages
    const apiKey = typeof EL_API_KEY !== 'undefined' ? EL_API_KEY : '';
    if (!apiKey) return errResponse(500, 'EL_API_KEY no configurada');

    let elRes;
    try {
      elRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: model || 'eleven_multilingual_v2',
            voice_settings: settings || {
              stability: 0.55,
              similarity_boost: 0.80,
              style: 0.20,
              use_speaker_boost: true,
            },
          }),
        }
      );
    } catch (e) {
      return errResponse(502, 'No se pudo conectar a ElevenLabs: ' + e.message);
    }

    if (!elRes.ok) {
      const msg = await elRes.text();
      return errResponse(elRes.status, 'ElevenLabs: ' + msg);
    }

    return new Response(elRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  }

  // Todo lo demás: pasar al handler estático
  return fetch(request);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function errResponse(status, msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
