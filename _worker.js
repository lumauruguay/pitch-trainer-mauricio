// BlueIA Pitch Trainer — Cloudflare Worker proxy para ElevenLabs
// La API key vive como variable de entorno EL_API_KEY en el Worker.
// El browser llama a /tts con { text, voiceId, model, settings } y recibe audio/mpeg.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // ── Proxy TTS ─────────────────────────────────────────────────────────────
    if (url.pathname === '/tts' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return err(400, 'JSON inválido'); }

      const { text, voiceId, model, settings } = body;
      if (!text || !voiceId) return err(400, 'Faltan text o voiceId');

      const apiKey = env.EL_API_KEY;
      if (!apiKey) return err(500, 'EL_API_KEY no configurada en el Worker');

      const elRes = await fetch(
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

      if (!elRes.ok) {
        const msg = await elRes.text();
        return err(elRes.status, `ElevenLabs: ${msg}`);
      }

      // Devolver el audio al browser con headers CORS
      return new Response(elRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      });
    }

    // ── Servir archivos estáticos (comportamiento por defecto) ────────────────
    return env.ASSETS.fetch(request);
  },
};

function err(status, msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
