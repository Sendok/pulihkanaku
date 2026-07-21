export type MatchingInput = {
  skillMatch: number;
  availabilityMatch: number;
  distanceScore: number;
  reliabilityScore: number;
  experienceScore: number;
  preferenceMatch: number;
  businessRepeatScore: number;
};

const weights: Readonly<Record<keyof MatchingInput, number>> = {
  skillMatch: 0.3,
  availabilityMatch: 0.2,
  distanceScore: 0.15,
  reliabilityScore: 0.15,
  experienceScore: 0.1,
  preferenceMatch: 0.05,
  businessRepeatScore: 0.05,
};

export type MatchingResult = { score: number; reasons: string[] };

export function calculateMatchingScore(input: MatchingInput): MatchingResult {
  for (const [key, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError(`${key} harus berada antara 0 dan 100.`);
  }
  const score = Math.round((Object.keys(weights) as (keyof MatchingInput)[]).reduce((total, key) => total + input[key] * weights[key], 0));
  const reasons: string[] = [];
  if (input.skillMatch >= 75) reasons.push("Sesuai dengan kemampuan Anda");
  if (input.availabilityMatch >= 75) reasons.push("Cocok dengan jadwal Anda");
  if (input.distanceScore >= 75) reasons.push("Berjarak dekat");
  if (input.experienceScore >= 75) reasons.push("Pernah mengerjakan tugas serupa");
  if (!reasons.length) reasons.push("Sesuai dengan preferensi dasar Anda");
  return { score, reasons };
}
