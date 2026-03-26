export const EMERGENCY_NOTICE =
  "⚠️ EMERGENCY: If your bearded dragon is showing signs of distress, contact an exotic vet immediately.";

const EMERGENCY_KEYWORDS = [
  "not moving",
  "unresponsive",
  "seizure",
  "paralyzed",
  "dying",
  "emergency",
  "not breathing",
  "bleeding",
  "collapsed",
  "limp",
  "unconscious"
];

export function needsEmergencyNotice(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
}
