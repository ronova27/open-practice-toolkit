import { buildClickTimeline, getTimelineDuration, normalizeMetronomeConfig } from "./timing.js";

const DEFAULT_SAMPLE_RATE = 44100;
const DEFAULT_CLICK_DURATION = 0.09;
const DEFAULT_TAIL_SECONDS = 0.14;

function writeAscii(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function encodePcm16Wav(samples, sampleRate = DEFAULT_SAMPLE_RATE) {
  const audio = samples instanceof Float32Array ? samples : Float32Array.from(samples);
  const buffer = new ArrayBuffer(44 + audio.length * 2);
  const view = new DataView(buffer);
  const dataLength = audio.length * 2;

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);

  for (let index = 0; index < audio.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, audio[index]));
    view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}

export function renderClickTrackWav(input = {}, options = {}) {
  const config = normalizeMetronomeConfig(input);
  const sampleRate = Math.round(Number(options.sampleRate) || DEFAULT_SAMPLE_RATE);
  const clickDuration = Math.max(0.03, Number(options.clickDuration) || DEFAULT_CLICK_DURATION);
  const tailSeconds = Math.max(0.02, Number(options.tailSeconds) || DEFAULT_TAIL_SECONDS);
  const events = buildClickTimeline(config);
  const duration = Math.max(0.25, getTimelineDuration(events, tailSeconds));
  const samples = new Float32Array(Math.ceil(duration * sampleRate));

  for (const event of events) {
    const startSample = Math.max(0, Math.floor(event.time * sampleRate));
    const clickSamples = Math.min(samples.length - startSample, Math.ceil(clickDuration * sampleRate));
    const decaySamples = Math.max(1, Math.floor(sampleRate * 0.045));

    for (let offset = 0; offset < clickSamples; offset += 1) {
      const envelope = Math.exp(-offset / decaySamples);
      const phase = (2 * Math.PI * event.frequency * offset) / sampleRate;
      samples[startSample + offset] += event.gain * envelope * Math.sin(phase);
    }
  }

  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0.98) {
    const scale = 0.98 / peak;
    for (let index = 0; index < samples.length; index += 1) samples[index] *= scale;
  }

  return encodePcm16Wav(samples, sampleRate);
}
