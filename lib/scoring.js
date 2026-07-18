// MOCK scoring — replaced by real ASR + GPT judging in a later build step.
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

export function getMockScore() {
  const score = Math.floor(30 + Math.random() * 66); // 30–95, so pass/fail both happen
  let roast_line;
  if (score >= 85) roast_line = pick(ROASTS_HIGH);
  else if (score >= 70) roast_line = pick(ROASTS_MID);
  else roast_line = pick(ROASTS_LOW);
  return { score, roast_line };
}
