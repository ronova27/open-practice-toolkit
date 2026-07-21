export const TIMING_LIMITS = Object.freeze({
  minBpm: 20,
  maxBpm: 320,
  minBars: 1,
  maxBars: 64,
  minBeatsPerBar: 1,
  maxBeatsPerBar: 16,
  minSubdivision: 1,
  maxSubdivision: 8,
  minPolyrhythmParts: 2,
  maxPolyrhythmParts: 9,
  minPolyrhythmSpan: 1,
  maxPolyrhythmSpan: 16
});

export const DEFAULT_METRONOME_CONFIG = Object.freeze({
  bpm: 96,
  endBpm: 96,
  bars: 4,
  beatsPerBar: 4,
  beatUnit: 4,
  subdivisions: 1,
  accentPattern: [3, 1, 1, 1],
  polyrhythm: null
});

function clampNumber(value, minimum, maximum, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(maximum, Math.max(minimum, numericValue));
}

function integerInRange(value, minimum, maximum, fallback) {
  return Math.round(clampNumber(value, minimum, maximum, fallback));
}

function defaultAccentPattern(beatsPerBar) {
  return Array.from({ length: beatsPerBar }, (_, index) => (index === 0 ? 3 : 1));
}

function normalizeAccentPattern(pattern, beatsPerBar) {
  const fallback = defaultAccentPattern(beatsPerBar);
  if (!Array.isArray(pattern)) return fallback;

  return Array.from({ length: beatsPerBar }, (_, index) =>
    integerInRange(pattern[index], 0, 3, fallback[index])
  );
}

function normalizePolyrhythm(polyrhythm) {
  if (!polyrhythm || polyrhythm.enabled === false) return null;

  return {
    parts: integerInRange(
      polyrhythm.parts,
      TIMING_LIMITS.minPolyrhythmParts,
      TIMING_LIMITS.maxPolyrhythmParts,
      3
    ),
    spanBeats: integerInRange(
      polyrhythm.spanBeats ?? polyrhythm.span,
      TIMING_LIMITS.minPolyrhythmSpan,
      TIMING_LIMITS.maxPolyrhythmSpan,
      2
    )
  };
}

export function normalizeMetronomeConfig(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const beatsPerBar = integerInRange(
    source.beatsPerBar,
    TIMING_LIMITS.minBeatsPerBar,
    TIMING_LIMITS.maxBeatsPerBar,
    DEFAULT_METRONOME_CONFIG.beatsPerBar
  );
  const bpm = clampNumber(source.bpm, TIMING_LIMITS.minBpm, TIMING_LIMITS.maxBpm, DEFAULT_METRONOME_CONFIG.bpm);
  const endBpm = clampNumber(source.endBpm, TIMING_LIMITS.minBpm, TIMING_LIMITS.maxBpm, bpm);

  return {
    bpm,
    endBpm,
    bars: integerInRange(source.bars, TIMING_LIMITS.minBars, TIMING_LIMITS.maxBars, DEFAULT_METRONOME_CONFIG.bars),
    beatsPerBar,
    beatUnit: [1, 2, 4, 8, 16].includes(Number(source.beatUnit)) ? Number(source.beatUnit) : DEFAULT_METRONOME_CONFIG.beatUnit,
    subdivisions: integerInRange(
      source.subdivisions,
      TIMING_LIMITS.minSubdivision,
      TIMING_LIMITS.maxSubdivision,
      DEFAULT_METRONOME_CONFIG.subdivisions
    ),
    accentPattern: normalizeAccentPattern(source.accentPattern, beatsPerBar),
    polyrhythm: normalizePolyrhythm(source.polyrhythm)
  };
}

function bpmAtBeat(normalizedConfig, beatPosition) {
  const totalBeats = normalizedConfig.bars * normalizedConfig.beatsPerBar;
  const progress = totalBeats === 0 ? 0 : clampNumber(beatPosition / totalBeats, 0, 1, 0);
  return normalizedConfig.bpm + (normalizedConfig.endBpm - normalizedConfig.bpm) * progress;
}

export function getBpmAtBeat(input, beatPosition) {
  return bpmAtBeat(normalizeMetronomeConfig(input), Number(beatPosition) || 0);
}

function beatToSecondsNormalized(normalizedConfig, beatPosition) {
  const beat = Math.max(0, Number(beatPosition) || 0);
  const totalBeats = normalizedConfig.bars * normalizedConfig.beatsPerBar;
  const startBpm = normalizedConfig.bpm;
  const slope = (normalizedConfig.endBpm - startBpm) / totalBeats;

  if (Math.abs(slope) < 1e-9) return (beat * 60) / startBpm;

  return (60 / slope) * Math.log((startBpm + slope * beat) / startBpm);
}

export function beatToSeconds(input, beatPosition) {
  return beatToSecondsNormalized(normalizeMetronomeConfig(input), beatPosition);
}

function beatEvent(config, beat, accent) {
  const beatInBar = beat % config.beatsPerBar;
  const isDownbeat = beatInBar === 0;
  const strength = accent / 3;

  return {
    kind: "beat",
    time: beatToSecondsNormalized(config, beat),
    beat,
    bar: Math.floor(beat / config.beatsPerBar),
    beatInBar,
    subdivision: 0,
    accent,
    isDownbeat,
    bpm: bpmAtBeat(config, beat),
    frequency: isDownbeat ? 1320 : 880,
    gain: isDownbeat ? 0.28 * strength : 0.2 * strength
  };
}

function subdivisionEvent(config, beat, subdivision) {
  const position = beat + subdivision / config.subdivisions;

  return {
    kind: "subdivision",
    time: beatToSecondsNormalized(config, position),
    beat,
    bar: Math.floor(beat / config.beatsPerBar),
    beatInBar: beat % config.beatsPerBar,
    subdivision,
    accent: 0,
    isDownbeat: false,
    bpm: bpmAtBeat(config, position),
    frequency: subdivision % 2 === 0 ? 720 : 660,
    gain: 0.1
  };
}

function polyrhythmEvent(config, startBeat, spanBeats, index, parts) {
  const position = startBeat + (index * spanBeats) / parts;

  return {
    kind: "polyrhythm",
    time: beatToSecondsNormalized(config, position),
    beat: Math.floor(position),
    bar: Math.floor(startBeat / config.beatsPerBar),
    beatInBar: Math.floor(position) % config.beatsPerBar,
    subdivision: index,
    accent: index === 0 ? 2 : 0,
    isDownbeat: false,
    bpm: bpmAtBeat(config, position),
    frequency: 540,
    gain: index === 0 ? 0.13 : 0.09
  };
}

export function buildClickTimeline(input = {}) {
  const config = normalizeMetronomeConfig(input);
  const totalBeats = config.bars * config.beatsPerBar;
  const events = [];

  for (let beat = 0; beat < totalBeats; beat += 1) {
    const accent = config.accentPattern[beat % config.beatsPerBar];
    if (accent > 0) events.push(beatEvent(config, beat, accent));

    for (let subdivision = 1; subdivision < config.subdivisions; subdivision += 1) {
      events.push(subdivisionEvent(config, beat, subdivision));
    }
  }

  if (config.polyrhythm) {
    for (let bar = 0; bar < config.bars; bar += 1) {
      const startBeat = bar * config.beatsPerBar;
      const spanBeats = Math.min(config.polyrhythm.spanBeats, config.beatsPerBar);
      for (let index = 0; index < config.polyrhythm.parts; index += 1) {
        events.push(polyrhythmEvent(config, startBeat, spanBeats, index, config.polyrhythm.parts));
      }
    }
  }

  const priority = { beat: 0, polyrhythm: 1, subdivision: 2 };
  events.sort((left, right) => left.time - right.time || priority[left.kind] - priority[right.kind]);
  return events;
}

export function getTimelineDuration(events, tailSeconds = 0) {
  const lastEvent = Array.isArray(events) && events.length ? events[events.length - 1] : null;
  return Math.max(0, (lastEvent?.time ?? 0) + Math.max(0, Number(tailSeconds) || 0));
}

export function estimateTapTempo(timestamps, options = {}) {
  const minBpm = clampNumber(options.minBpm, 20, 320, 40);
  const maxBpm = clampNumber(options.maxBpm, minBpm, 320, 240);
  const maxGapMs = clampNumber(options.maxGapMs, 500, 10000, 2500);
  const times = (Array.isArray(timestamps) ? timestamps : [])
    .map(Number)
    .filter(Number.isFinite)
    .sort((left, right) => left - right);

  if (times.length < 2) return null;

  let segmentStart = times.length - 1;
  while (segmentStart > 0 && times[segmentStart] - times[segmentStart - 1] <= maxGapMs) {
    segmentStart -= 1;
  }

  const minimumInterval = 60000 / maxBpm;
  const maximumInterval = 60000 / minBpm;
  const intervals = [];
  for (let index = segmentStart + 1; index < times.length; index += 1) {
    const interval = times[index] - times[index - 1];
    if (interval >= minimumInterval && interval <= maximumInterval) intervals.push(interval);
  }

  if (!intervals.length) return null;
  const sortedIntervals = [...intervals].sort((left, right) => left - right);
  const trimmed = sortedIntervals.length >= 5 ? sortedIntervals.slice(1, -1) : sortedIntervals;
  const middle = Math.floor(trimmed.length / 2);
  const median = trimmed.length % 2 ? trimmed[middle] : (trimmed[middle - 1] + trimmed[middle]) / 2;
  return Math.round(clampNumber(60000 / median, minBpm, maxBpm, minBpm));
}
