export const CALIBRATION_DEFAULTS = Object.freeze({
  bpm: 60,
  beats: 8,
  leadInSeconds: 0.25
});

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildCalibrationPlan({
  bpm = CALIBRATION_DEFAULTS.bpm,
  beats = CALIBRATION_DEFAULTS.beats,
  leadInSeconds = CALIBRATION_DEFAULTS.leadInSeconds
} = {}) {
  const safeBpm = Math.min(320, Math.max(20, finiteNumber(bpm, CALIBRATION_DEFAULTS.bpm)));
  const safeBeats = Math.min(16, Math.max(4, Math.round(finiteNumber(beats, CALIBRATION_DEFAULTS.beats))));
  const leadIn = Math.max(0, finiteNumber(leadInSeconds, CALIBRATION_DEFAULTS.leadInSeconds));
  const beatSeconds = 60 / safeBpm;

  return Array.from({ length: safeBeats }, (_, beat) => ({
    kind: "beat",
    time: leadIn + beat * beatSeconds,
    beat,
    bar: 0,
    beatInBar: beat,
    subdivision: 0,
    accent: beat === 0 ? 3 : 1,
    isDownbeat: beat === 0,
    bpm: safeBpm,
    frequency: beat === 0 ? 1320 : 880,
    gain: beat === 0 ? 0.28 : 0.2
  }));
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeCalibration(expectedTimes, tapTimes) {
  const expected = Array.isArray(expectedTimes) ? expectedTimes : [];
  const taps = Array.isArray(tapTimes) ? tapTimes : [];
  const offsets = [];
  const samples = Math.min(expected.length, taps.length);

  for (let index = 0; index < samples; index += 1) {
    const expectedTime = Number(expected[index]);
    const tapTime = Number(taps[index]);
    if (Number.isFinite(expectedTime) && Number.isFinite(tapTime)) offsets.push(tapTime - expectedTime);
  }

  if (!offsets.length) return null;

  const trimmed = offsets.length >= 5 ? [...offsets].sort((left, right) => left - right).slice(1, -1) : offsets;
  const offsetMs = median(trimmed);
  const jitterMs = median(offsets.map((offset) => Math.abs(offset - offsetMs)));

  return {
    offsetMs: Math.round(offsetMs),
    jitterMs: Math.round(jitterMs),
    samples: offsets.length
  };
}
