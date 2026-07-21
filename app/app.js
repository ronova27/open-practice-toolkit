import {
  DEFAULT_METRONOME_CONFIG,
  buildClickTimeline,
  estimateTapTempo,
  getTimelineDuration,
  normalizeMetronomeConfig
} from "./metronome/timing.js";
import { renderClickTrackWav } from "./metronome/wav.js";

const form = document.querySelector("#metronome-form");
const bpm = document.querySelector("#bpm");
const bpmRange = document.querySelector("#bpm-range");
const bpmOutput = document.querySelector("#bpm-output");
const endBpm = document.querySelector("#end-bpm");
const tempoRamp = document.querySelector("#tempo-ramp");
const beatsPerBar = document.querySelector("#beats-per-bar");
const beatUnit = document.querySelector("#beat-unit");
const subdivisions = document.querySelector("#subdivisions");
const bars = document.querySelector("#bars");
const accentDownbeat = document.querySelector("#accent-downbeat");
const polyrhythmEnabled = document.querySelector("#polyrhythm-enabled");
const polyParts = document.querySelector("#poly-parts");
const polySpan = document.querySelector("#poly-span");
const tapTempoButton = document.querySelector("#tap-tempo");
const toggleButton = document.querySelector("#toggle-metronome");
const exportButton = document.querySelector("#export-wav");
const status = document.querySelector("#status");
const monitorTitle = document.querySelector("#monitor-title");
const pulseStage = document.querySelector(".pulse-stage");
const pulseLabel = document.querySelector("#pulse-label");
const metricTempo = document.querySelector("#metric-tempo");
const metricMeter = document.querySelector("#metric-meter");
const metricEvents = document.querySelector("#metric-events");
const metricDuration = document.querySelector("#metric-duration");

let audioContext = null;
let run = null;
let tapTimes = [];
let pulseTimer = null;

function setBpm(value) {
  const nextValue = Math.round(Math.min(320, Math.max(20, Number(value) || DEFAULT_METRONOME_CONFIG.bpm)));
  bpm.value = String(nextValue);
  bpmRange.value = String(nextValue);
  bpmOutput.value = String(nextValue);
  bpmOutput.textContent = String(nextValue);
  if (!tempoRamp.checked) endBpm.value = String(nextValue);
}

function readConfig() {
  const beats = Math.min(16, Math.max(1, Math.round(Number(beatsPerBar.value) || 4)));
  const accentPattern = Array.from({ length: beats }, (_, index) => (index === 0 && accentDownbeat.checked ? 3 : 1));
  return normalizeMetronomeConfig({
    bpm: bpm.value,
    endBpm: tempoRamp.checked ? endBpm.value : bpm.value,
    bars: bars.value,
    beatsPerBar: beats,
    beatUnit: beatUnit.value,
    subdivisions: subdivisions.value,
    accentPattern,
    polyrhythm: polyrhythmEnabled.checked ? { parts: polyParts.value, spanBeats: polySpan.value } : null
  });
}

function updateDisabledStates() {
  endBpm.disabled = !tempoRamp.checked;
  polyParts.disabled = !polyrhythmEnabled.checked;
  polySpan.disabled = !polyrhythmEnabled.checked;
}

function updateSummary() {
  const config = readConfig();
  const events = buildClickTimeline(config);
  metricTempo.textContent = config.bpm === config.endBpm ? `${config.bpm} BPM` : `${config.bpm} → ${config.endBpm}`;
  metricMeter.textContent = `${config.beatsPerBar}/${config.beatUnit}`;
  metricEvents.textContent = String(events.length);
  metricDuration.textContent = `${getTimelineDuration(events, 0.14).toFixed(2)} s`;
  bpmOutput.value = bpm.value;
  bpmOutput.textContent = bpm.value;
  updateDisabledStates();
}

function announce(message, tone = "normal") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function eventLabel(event) {
  if (event.kind === "polyrhythm") return "POLY";
  if (event.kind === "subdivision") return "SUBDIVISION";
  return event.isDownbeat ? "DOWNBEAT" : "BEAT";
}

function scheduleEvent(context, event, startTime) {
  const when = startTime + event.time;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(event.frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.01, event.gain), when + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + 0.085);
}

function setPulse(event) {
  pulseStage.dataset.kind = event.kind;
  pulseStage.dataset.active = "true";
  pulseLabel.textContent = eventLabel(event);
  if (pulseTimer) window.clearTimeout(pulseTimer);
  pulseTimer = window.setTimeout(() => {
    pulseStage.dataset.active = "false";
    pulseTimer = null;
  }, 110);
}

function animateRun() {
  if (!run || !audioContext) return;

  const elapsed = audioContext.currentTime - run.startTime;
  while (run.nextEventIndex < run.events.length && run.events[run.nextEventIndex].time <= elapsed + 0.015) {
    setPulse(run.events[run.nextEventIndex]);
    run.nextEventIndex += 1;
  }

  if (elapsed >= run.duration) {
    stopMetronome(true);
    return;
  }

  run.frame = window.requestAnimationFrame(animateRun);
}

async function startMetronome() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    announce("This browser does not expose Web Audio. WAV export is still available.", "error");
    return;
  }

  const config = readConfig();
  const events = buildClickTimeline(config);
  audioContext ||= new AudioContextClass();
  await audioContext.resume();
  const startTime = audioContext.currentTime + 0.06;
  for (const event of events) scheduleEvent(audioContext, event, startTime);

  run = {
    config,
    events,
    startTime,
    duration: getTimelineDuration(events, 0.1),
    nextEventIndex: 0,
    frame: window.requestAnimationFrame(animateRun)
  };
  toggleButton.textContent = "Stop metronome";
  monitorTitle.textContent = "Cycle in progress.";
  announce(`Playing ${config.bars} ${config.bars === 1 ? "bar" : "bars"} at ${config.bpm} BPM.`);
}

function stopMetronome(natural = false) {
  if (!run) return;
  window.cancelAnimationFrame(run.frame);
  run = null;
  toggleButton.textContent = "Start metronome";
  monitorTitle.textContent = natural ? "Cycle complete." : "Ready when you are.";
  pulseStage.dataset.active = "false";
  if (pulseTimer) window.clearTimeout(pulseTimer);
  pulseTimer = null;
  if (audioContext?.state === "running") audioContext.suspend();
  announce(natural ? "Cycle complete. Start again or adjust the pattern." : "Metronome stopped.");
}

function toggleMetronome() {
  if (run) stopMetronome();
  else startMetronome().catch(() => announce("The audio context could not start. Try pressing Start again.", "error"));
}

function recordTap() {
  const now = performance.now();
  if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2500) tapTimes = [];
  tapTimes.push(now);
  tapTimes = tapTimes.slice(-8);
  const estimate = estimateTapTempo(tapTimes);
  if (estimate) {
    setBpm(estimate);
    announce(`Tap tempo set to ${estimate} BPM.`);
    updateSummary();
  } else {
    announce("Keep tapping to estimate the tempo.");
  }
}

function exportWav() {
  const config = readConfig();
  const wav = renderClickTrackWav(config);
  const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `openpractice-${config.bpm}bpm-${config.beatsPerBar}x${config.beatUnit}.wav`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  announce("WAV click track exported locally.");
}

bpm.addEventListener("input", () => { setBpm(bpm.value); updateSummary(); });
bpmRange.addEventListener("input", () => { setBpm(bpmRange.value); updateSummary(); });
tempoRamp.addEventListener("change", () => { updateDisabledStates(); updateSummary(); });
polyrhythmEnabled.addEventListener("change", updateSummary);
form.addEventListener("input", updateSummary);
form.addEventListener("change", updateSummary);
tapTempoButton.addEventListener("click", recordTap);
toggleButton.addEventListener("click", toggleMetronome);
exportButton.addEventListener("click", exportWav);
document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTextEntry = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
  if (event.code === "Space" && !isTextEntry) {
    event.preventDefault();
    recordTap();
  }
});
window.addEventListener("pagehide", () => stopMetronome());

updateSummary();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
