import assert from "node:assert/strict";
import test from "node:test";

import {
  beatToSeconds,
  buildClickTimeline,
  estimateTapTempo,
  getBpmAtBeat,
  normalizeMetronomeConfig
} from "../app/metronome/timing.js";
import { renderClickTrackWav } from "../app/metronome/wav.js";

test("normalizes metronome values into safe limits", () => {
  const config = normalizeMetronomeConfig({
    bpm: 999,
    endBpm: 1,
    bars: 0,
    beatsPerBar: 99,
    subdivisions: 99,
    accentPattern: [3, 0]
  });

  assert.equal(config.bpm, 320);
  assert.equal(config.endBpm, 20);
  assert.equal(config.bars, 1);
  assert.equal(config.beatsPerBar, 16);
  assert.equal(config.subdivisions, 8);
  assert.equal(config.accentPattern.length, 16);
  assert.equal(config.accentPattern[1], 0);
});

test("builds beat and subdivision events on a deterministic grid", () => {
  const config = { bpm: 120, bars: 1, beatsPerBar: 4, subdivisions: 4 };
  const events = buildClickTimeline(config);
  const beatEvents = events.filter((event) => event.kind === "beat");
  const subdivisionEvents = events.filter((event) => event.kind === "subdivision");

  assert.equal(beatEvents.length, 4);
  assert.equal(subdivisionEvents.length, 12);
  assert.equal(events[0].time, 0);
  assert.equal(events[0].isDownbeat, true);
  assert.ok(Math.abs(events[1].time - 0.125) < 1e-9);
  assert.ok(Math.abs(beatEvents[1].time - 0.5) < 1e-9);
});

test("tempo ramps shorten beat intervals as the ending BPM rises", () => {
  const config = { bpm: 60, endBpm: 120, bars: 1, beatsPerBar: 4 };
  const events = buildClickTimeline(config).filter((event) => event.kind === "beat");
  const firstInterval = events[1].time - events[0].time;
  const lastInterval = events[3].time - events[2].time;

  assert.equal(getBpmAtBeat(config, 0), 60);
  assert.equal(getBpmAtBeat(config, 4), 120);
  assert.ok(firstInterval > lastInterval);
  assert.ok(beatToSeconds(config, 4) > beatToSeconds(config, 3));
});

test("adds a polyrhythm layer without changing the primary beat grid", () => {
  const events = buildClickTimeline({
    bpm: 120,
    bars: 1,
    beatsPerBar: 4,
    polyrhythm: { parts: 3, spanBeats: 2 }
  });
  const polyEvents = events.filter((event) => event.kind === "polyrhythm");
  const beatEvents = events.filter((event) => event.kind === "beat");

  assert.equal(polyEvents.length, 3);
  assert.equal(beatEvents.length, 4);
  assert.ok(Math.abs(polyEvents[1].time - 1 / 3) < 1e-9);
});

test("tap tempo uses the latest contiguous taps and rejects stale gaps", () => {
  assert.equal(estimateTapTempo([0, 500, 1000, 1500]), 120);
  assert.equal(estimateTapTempo([0, 500, 1000, 5000, 5500, 6000]), 120);
  assert.equal(estimateTapTempo([0]), null);
});

test("renders a mono PCM WAV with a valid RIFF header", () => {
  const wav = renderClickTrackWav({ bpm: 120, bars: 1, beatsPerBar: 4 }, { sampleRate: 8000 });
  const riff = new TextDecoder().decode(wav.slice(0, 4));
  const wave = new TextDecoder().decode(wav.slice(8, 12));
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);

  assert.equal(riff, "RIFF");
  assert.equal(wave, "WAVE");
  assert.equal(view.getUint16(20, true), 1);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 8000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), wav.length - 44);
  assert.ok(wav.length > 44);
});
