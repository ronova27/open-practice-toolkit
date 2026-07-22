import {
  DEFAULT_METRONOME_CONFIG,
  buildClickTimeline,
  estimateTapTempo,
  getTimelineDuration,
  normalizeMetronomeConfig
} from "./metronome/timing.js";
import { buildCalibrationPlan, summarizeCalibration } from "./metronome/calibration.js";
import { planTransportWindow, TRANSPORT_DEFAULTS } from "./metronome/transport.js";
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
const continuousTransport = document.querySelector("#continuous-transport");
const toggleButton = document.querySelector("#toggle-metronome");
const exportButton = document.querySelector("#export-wav");
const calibrationStartButton = document.querySelector("#start-calibration");
const calibrationTapButton = document.querySelector("#tap-calibration");
const calibrationResult = document.querySelector("#calibration-result");
const status = document.querySelector("#status");
const monitorTitle = document.querySelector("#monitor-title");
const pulseStage = document.querySelector(".pulse-stage");
const pulseLabel = document.querySelector("#pulse-label");
const metricTempo = document.querySelector("#metric-tempo");
const metricMeter = document.querySelector("#metric-meter");
const metricEvents = document.querySelector("#metric-events");
const metricDuration = document.querySelector("#metric-duration");

const CALIBRATION_STORAGE_KEY = "openpractice-calibration-v1";

let audioContext = null;
let run = null;
let calibrationRun = null;
let storedCalibration = loadCalibration();
let tapTimes = [];
let pulseTimer = null;

function loadCalibration() {
  try {
    const value = JSON.parse(window.localStorage.getItem(CALIBRATION_STORAGE_KEY) || "null");
    if (value && Number.isFinite(Number(value.offsetMs))) {
      return {
        offsetMs: Math.round(Number(value.offsetMs)),
        jitterMs: Math.max(0, Math.round(Number(value.jitterMs) || 0)),
        samples: Math.max(0, Math.round(Number(value.samples) || 0))
      };
    }
  } catch {
    // Private browsing and storage-disabled contexts should keep the tool usable.
  }
  return null;
}

function saveCalibration(summary) {
  storedCalibration = summary;
  try {
    window.localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(summary));
  } catch {
    // A calibration result is still useful for this session when storage is unavailable.
  }
}

function describeCalibration(summary) {
  if (!summary) return "Not calibrated yet. Hear eight beats, then tap each beat as it arrives.";
  const direction = summary.offsetMs > 15 ? `${summary.offsetMs} ms late` : summary.offsetMs < -15 ? `${Math.abs(summary.offsetMs)} ms early` : "on time";
  return `Median response: ${direction} · ${summary.samples} taps · ${summary.jitterMs} ms spread. Stored only in this browser.`;
}

function updateCalibrationResult(message = null) {
  calibrationResult.textContent = message || describeCalibration(storedCalibration);
}

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

function scheduleEvent(context, event, startTime, owner = null) {
  const when = startTime + event.time;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(event.frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.01, event.gain), when + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
  oscillator.connect(gain).connect(context.destination);
  if (owner) {
    owner.sources.add(oscillator);
    oscillator.addEventListener("ended", () => owner.sources.delete(oscillator), { once: true });
  }
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

  const currentTime = audioContext.currentTime;
  while (run.visualEvents.length && run.visualEvents[0].time <= currentTime + 0.015) {
    setPulse(run.visualEvents.shift().event);
  }

  if (!run.continuous && currentTime >= run.endTime) {
    stopMetronome(true);
    return;
  }

  run.frame = window.requestAnimationFrame(animateRun);
}

function scheduleTransportWindow() {
  if (!run || !audioContext) return;

  const now = audioContext.currentTime;
  const horizon = run.continuous
    ? now + TRANSPORT_DEFAULTS.lookaheadSeconds
    : run.endTime - 0.000001;
  const plan = planTransportWindow({
    events: run.events,
    cycleDuration: run.cycleDuration,
    startTime: run.startTime,
    horizonTime: horizon,
    minimumTime: now - 0.02,
    nextEventIndex: run.nextEventIndex,
    cycleIndex: run.cycleIndex,
    maxEvents: TRANSPORT_DEFAULTS.maxEventsPerWindow
  });

  for (const item of plan.scheduled) {
    scheduleEvent(audioContext, item.event, item.time, run);
    run.visualEvents.push(item);
  }
  run.nextEventIndex = plan.nextEventIndex;
  run.cycleIndex = plan.cycleIndex;

  if (run.continuous) {
    run.scheduleTimer = window.setTimeout(() => {
      run.scheduleTimer = null;
      scheduleTransportWindow();
    }, TRANSPORT_DEFAULTS.schedulerIntervalMs);
  }
}

function stopOwnedSources(owner) {
  for (const source of owner.sources) {
    try {
      source.stop();
    } catch {
      // Sources that have already ended cannot be stopped again.
    }
  }
  owner.sources.clear();
}

async function startMetronome() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    announce("This browser does not expose Web Audio. WAV export is still available.", "error");
    return;
  }

  if (calibrationRun) cancelCalibration();
  const config = readConfig();
  const events = buildClickTimeline(config);
  audioContext ||= new AudioContextClass();
  await audioContext.resume();
  const startTime = audioContext.currentTime + 0.06;
  const continuous = continuousTransport.checked;

  run = {
    config,
    events,
    startTime,
    continuous,
    cycleDuration: getTimelineDuration(events, 0.1),
    endTime: startTime + (continuous ? Number.POSITIVE_INFINITY : getTimelineDuration(events, 0.1)),
    nextEventIndex: 0,
    cycleIndex: 0,
    visualEvents: [],
    sources: new Set(),
    scheduleTimer: null,
    frame: null
  };
  scheduleTransportWindow();
  run.frame = window.requestAnimationFrame(animateRun);
  toggleButton.textContent = "Stop metronome";
  monitorTitle.textContent = continuous ? "Transport is running." : "Cycle in progress.";
  announce(continuous
    ? `Transport running at ${config.bpm} BPM. The pattern repeats while this tab stays active.`
    : `Playing ${config.bars} ${config.bars === 1 ? "bar" : "bars"} at ${config.bpm} BPM.`);
}

function stopMetronome(natural = false) {
  if (!run) return;
  window.cancelAnimationFrame(run.frame);
  if (run.scheduleTimer) window.clearTimeout(run.scheduleTimer);
  stopOwnedSources(run);
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

function audioTimeMapping(context) {
  const timestamp = typeof context.getOutputTimestamp === "function" ? context.getOutputTimestamp() : null;
  if (timestamp && Number.isFinite(timestamp.contextTime) && Number.isFinite(timestamp.performanceTime) && timestamp.performanceTime > 0) {
    return { audioTime: timestamp.contextTime, performanceTime: timestamp.performanceTime };
  }
  return { audioTime: context.currentTime, performanceTime: performance.now() };
}

function performanceTimeForAudioTime(mapping, audioTime) {
  return mapping.performanceTime + (audioTime - mapping.audioTime) * 1000;
}

function animateCalibration() {
  if (!calibrationRun || !audioContext) return;

  const currentTime = audioContext.currentTime;
  while (calibrationRun.nextEventIndex < calibrationRun.plan.length) {
    const item = calibrationRun.plan[calibrationRun.nextEventIndex];
    if (calibrationRun.startAudioTime + item.time > currentTime + 0.015) break;
    setPulse(item);
    calibrationRun.nextEventIndex += 1;
  }

  const lastExpected = calibrationRun.expectedTimes[calibrationRun.expectedTimes.length - 1];
  if (performance.now() > lastExpected + 1500 && calibrationRun.taps.length < calibrationRun.plan.length) {
    finishCalibration(false);
    return;
  }

  calibrationRun.frame = window.requestAnimationFrame(animateCalibration);
}

function releaseCalibrationRun() {
  if (!calibrationRun) return null;
  const active = calibrationRun;
  window.cancelAnimationFrame(active.frame);
  stopOwnedSources(active);
  calibrationRun = null;
  calibrationStartButton.textContent = "Start calibration";
  calibrationTapButton.disabled = true;
  return active;
}

function cancelCalibration() {
  if (!calibrationRun) return;
  releaseCalibrationRun();
  updateCalibrationResult();
  announce("Calibration cancelled.");
  if (audioContext?.state === "running" && !run) audioContext.suspend();
}

function finishCalibration(complete) {
  const active = releaseCalibrationRun();
  if (!active) return;

  const summary = complete ? summarizeCalibration(active.expectedTimes, active.taps) : null;
  if (summary) {
    saveCalibration(summary);
    updateCalibrationResult();
    announce(`Calibration complete: ${describeCalibration(summary)}`);
  } else {
    updateCalibrationResult("Calibration incomplete. Start again and tap each of the eight beats.");
    announce("Calibration incomplete. No new offset was saved.", "error");
  }
  if (audioContext?.state === "running" && !run) audioContext.suspend();
}

async function startCalibration() {
  if (calibrationRun) {
    cancelCalibration();
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    announce("This browser does not expose Web Audio calibration.", "error");
    return;
  }

  if (run) stopMetronome();
  const config = readConfig();
  const plan = buildCalibrationPlan({ bpm: config.bpm });
  audioContext ||= new AudioContextClass();
  await audioContext.resume();
  const mapping = audioTimeMapping(audioContext);
  const startAudioTime = audioContext.currentTime + 0.06;
  calibrationRun = {
    plan,
    startAudioTime,
    expectedTimes: plan.map((item) => performanceTimeForAudioTime(mapping, startAudioTime + item.time)),
    taps: [],
    nextEventIndex: 0,
    sources: new Set(),
    frame: null
  };

  for (const item of plan) scheduleEvent(audioContext, item, startAudioTime, calibrationRun);
  calibrationStartButton.textContent = "Cancel calibration";
  calibrationTapButton.disabled = false;
  updateCalibrationResult(`Calibration running at ${config.bpm} BPM. Tap each heard beat: 0 of ${plan.length}.`);
  announce(`Calibration started at ${config.bpm} BPM. Tap when you hear each beat.`);
  calibrationRun.frame = window.requestAnimationFrame(animateCalibration);
}

function recordCalibrationTap() {
  if (!calibrationRun) return;
  if (calibrationRun.taps.length >= calibrationRun.expectedTimes.length) return;
  calibrationRun.taps.push(performance.now());
  const taps = calibrationRun.taps.length;
  if (taps === calibrationRun.expectedTimes.length) {
    finishCalibration(true);
    return;
  }
  updateCalibrationResult(`Calibration running. Tap each heard beat: ${taps} of ${calibrationRun.plan.length}.`);
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
    if (calibrationRun) recordCalibrationTap();
    else recordTap();
  }
});
calibrationStartButton.addEventListener("click", () => {
  startCalibration().catch(() => {
    releaseCalibrationRun();
    updateCalibrationResult("Calibration could not start. Try again after pressing the button.");
    announce("The calibration audio could not start. Try again.", "error");
  });
});
calibrationTapButton.addEventListener("click", recordCalibrationTap);
window.addEventListener("pagehide", () => {
  stopMetronome();
  if (calibrationRun) releaseCalibrationRun();
});

updateSummary();
updateCalibrationResult();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
