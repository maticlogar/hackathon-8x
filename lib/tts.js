import { createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

// Voice IDs verified live against this ElevenLabs account's plan — a couple
// of newer library voices 402 on this free-tier key, these don't.
export const ELEVENLABS_VOICE_IDS = {
  sl: 'pNInz6obpgDQGcFmaJgB', // Adam
  de: 'EXAVITQu4vr4xnSDxMaL', // Sarah
  ru: 'N2lVS1w4EtoT3dr4eOWO', // Callum
  es: 'IKne3meq5aSn9XLyUdCD', // Charlie
  sh: 'SOYHLrjzK2X1ezoPC6cr', // Harry
};

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const MODEL_ID = 'eleven_multilingual_v2';
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Hermes doesn't reliably provide btoa, so encode manually.
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let result = '';
  let i;
  for (i = 0; i + 2 < bytes.length; i += 3) {
    result += BASE64_CHARS[bytes[i] >> 2];
    result += BASE64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += BASE64_CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    result += BASE64_CHARS[bytes[i + 2] & 63];
  }
  if (i < bytes.length) {
    result += BASE64_CHARS[bytes[i] >> 2];
    if (i + 1 < bytes.length) {
      result += BASE64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      result += BASE64_CHARS[(bytes[i + 1] & 15) << 2];
      result += '=';
    } else {
      result += BASE64_CHARS[(bytes[i] & 3) << 4];
      result += '==';
    }
  }
  return result;
}

async function fetchElevenLabsAudioUri(text, voiceId) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, model_id: MODEL_ID }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return `data:audio/mpeg;base64,${arrayBufferToBase64(buffer)}`;
}

function playDataUri(dataUri) {
  const player = createAudioPlayer(dataUri);
  const subscription = player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) {
      subscription.remove();
      player.remove();
    }
  });
  player.play();
}

// Speaks `text` via ElevenLabs (multilingual model) if a voice is configured
// and the network call succeeds; falls back to expo-speech otherwise so the
// Play button never goes silent on bad wifi.
export async function speakWord(text, languageCode, speechCode) {
  const voiceId = ELEVENLABS_VOICE_IDS[languageCode];
  if (ELEVENLABS_API_KEY && voiceId) {
    try {
      const dataUri = await fetchElevenLabsAudioUri(text, voiceId);
      playDataUri(dataUri);
      return;
    } catch {
      // fall through to expo-speech
    }
  }
  Speech.speak(text, { language: speechCode });
}
