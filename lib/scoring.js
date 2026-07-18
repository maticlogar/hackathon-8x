// Real scoring: Whisper transcription + GPT judging, blended with a
// Levenshtein similarity check. FALLBACK IS CRITICAL — ASR is unreliable and
// venue wifi is bad, so any failure or timeout must degrade to a local
// heuristic instead of stalling the demo.
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const HARD_TIMEOUT_MS = 8000;
const MIN_SHIMMER_MS = 500;

const ROASTS_HIGH = [
  'Local level unlocked.',
  'Native speakers wept with pride.',
  "Chef's kiss. Truly filthy.",
];
const ROASTS_MID = [
  'Passable. A tourist would believe you.',
  'Close enough to get punched.',
  'Solid effort, still sounds foreign.',
];
const ROASTS_LOW = [
  'That was legally a different word.',
  'Grandma winced. So did God.',
  'Try again, this time with feeling.',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

// Whisper transcribes what it hears into plain text, which will rarely match
// a target phrase's exact spelling/diacritics/punctuation even when the
// pronunciation was spot on — strip that noise before diffing.
function normalizeForCompare(s) {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents/diacritics
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedSimilarity(a, b) {
  const cleanA = normalizeForCompare(a);
  const cleanB = normalizeForCompare(b);
  const maxLen = Math.max(cleanA.length, cleanB.length, 1);
  const distance = levenshtein(cleanA, cleanB);
  return Math.max(0, 1 - distance / maxLen);
}

// Suspiciously short recordings almost certainly didn't capture real speech.
function localFallbackScore(durationMillis) {
  if (!durationMillis || durationMillis < 350) {
    const score = Math.floor(15 + Math.random() * 25); // 15-40
    return { score, roast_line: pick(ROASTS_LOW) };
  }
  const score = Math.floor(55 + Math.random() * 31); // 55-85
  const roast_line = score >= 70 ? pick(ROASTS_MID) : pick(ROASTS_LOW);
  return { score, roast_line };
}

async function transcribeAudio(uri, languageCode, targetWord, signal) {
  const form = new FormData();
  form.append('file', { uri, name: 'recording.m4a', type: 'audio/m4a' });
  form.append('model', 'whisper-1');
  form.append('language', languageCode);
  form.append('prompt', targetWord);

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
    signal,
  });
  if (!res.ok) throw new Error(`transcription failed: ${res.status}`);
  const data = await res.json();
  return data.text ?? '';
}

async function judgeWince(transcript, targetWord, meaning, signal) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a deadpan judge for a swearing-pronunciation game. Given a target word and what someone said, rate 0-100 how convincingly they nailed it — would a local wince at how authentic it sounded? Also give one punchy roast or praise line, under 12 words, in English. Respond ONLY as JSON: {"wince_rating": number, "roast_line": string}',
        },
        {
          role: 'user',
          content: `Target word: "${targetWord}" (means: ${meaning}). What they said: "${transcript}"`,
        },
      ],
    }),
    signal,
  });
  if (!res.ok) throw new Error(`judging failed: ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// { uri, durationMillis, targetWord, meaning, speechCode, forceFallback } -> { score, roast_line }
// forceFallback is the hidden rehearsal override — skips the network entirely.
export async function scoreRecording({
  uri,
  durationMillis,
  targetWord,
  meaning,
  speechCode,
  forceFallback,
}) {
  const fallback = () => localFallbackScore(durationMillis);

  if (forceFallback || !OPENAI_API_KEY) {
    const [result] = await Promise.all([Promise.resolve(fallback()), sleep(MIN_SHIMMER_MS)]);
    return result;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);

  const attempt = async () => {
    const languageCode = speechCode.split('-')[0];
    const transcript = await transcribeAudio(uri, languageCode, targetWord, controller.signal);
    const { wince_rating, roast_line } = await judgeWince(transcript, targetWord, meaning, controller.signal);
    const similarity = normalizedSimilarity(transcript, targetWord) * 100;
    // Judge weighted higher than raw transcript diffing: Whisper's spelling
    // of a foreign phrase rarely matches the target string even when the
    // pronunciation itself was good, so leaning on string similarity alone
    // was tanking scores that should've passed.
    const score = Math.round(0.35 * similarity + 0.65 * wince_rating);
    return { score: Math.max(0, Math.min(100, score)), roast_line };
  };

  try {
    const [result] = await Promise.all([attempt(), sleep(MIN_SHIMMER_MS)]);
    return result;
  } catch {
    return fallback();
  } finally {
    clearTimeout(timeout);
  }
}
