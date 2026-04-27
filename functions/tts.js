// BlueIA — Cloudflare Pages Function
// Ruta: POST /tts → proxy a ElevenLabs
// env.EL_API_KEY inyectada por Pages (Settings > Variables y secretos)

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return errResponse(400, 'JSON inválido'); }

  const { text, voiceId, model, settings } = body;
  if (!text || !voiceId) return errResponse(400, 'Faltan text o voiceId');

  const apiKey = env.EL_API_KEY || '';
  if (!apiKey) return errResponse(500, 'EL_API_KEY no configurada en Pages');

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
    return errResponse(elRes.status, 'ElevenLabs error: ' + msg);
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

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function errResponse(status, msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
