# Architecture

OpenPractice Toolkit should begin as a web/PWA-first application with local-first processing and a clear boundary between core practice tools and optional experiments.

## Initial Shape

- Browser-first application.
- Offline-capable shell where practical.
- Web Audio API for timing, playback, recording, and click generation.
- Local file import/export for MIDI, MusicXML, WAV, and structured project data.
- No required backend for core practice features.

## Current Prototype Shape

The first executable slice is deliberately dependency-free and static:

- `app/index.html` owns the accessible practice surface and control semantics.
- `app/app.js` adapts browser input to the timing engine, schedules clicks, updates the visual pulse, and owns local WAV download behavior.
- `app/metronome/timing.js` is a pure deterministic compiler for beat, subdivision, tempo-ramp, accent, and polyrhythm events.
- `app/metronome/wav.js` renders the same event timeline to mono PCM WAV without a backend.
- `app/sw.js` caches only the app shell and version-bumps when shipped assets change.
- `test/metronome.test.mjs` verifies the pure timing and export contracts in Node's built-in test runner.

The browser schedules a complete finite cycle a short distance ahead in the `AudioContext` clock. This keeps the first slice small and predictable; it is not yet a claim that long-running transport or every device has laboratory-grade timing.

## Module Boundaries

### Metronome Engine

Responsible for timing models, scheduling, subdivisions, accents, tempo ramps, polyrhythms, visual pulse coordination, and click-track export.

### Notation Prehearing

Responsible for note entry, visual notation, playback, looping, slow practice, MIDI export, and MusicXML export.

### Practice Feedback

Responsible for recording, onset detection, latency compensation, timing comparison, and early/late feedback.

### Audio-To-Notes

Responsible for monophonic-first pitch and onset analysis, approximate note/rhythm output, MIDI export, and manual correction workflow.

### Video-To-Rhythm

Responsible for experimental local motion or hit timing analysis, optional audio alignment, and clear privacy constraints.

### Web/PWA Shell

Responsible for navigation, offline behavior, storage boundaries, accessibility, and beginner-friendly interaction patterns.

## Privacy Boundary

Audio, video, and practice history should stay local unless a user explicitly chooses an optional export or network-enabled workflow. Future AI-assisted features must be optional and must explain what leaves the device.

## Data And Export Formats

- Use MIDI for approximate notes, timing data, and practice material.
- Use MusicXML for notation interchange.
- Use WAV for rendered click tracks.
- Prefer plain structured formats for project/session metadata when possible.

## Early Technical Questions

- Which Web Audio scheduling strategy gives acceptable timing stability across common browsers?
- How should a long-running transport replace the current finite-cycle scheduling without introducing duplicate events?
- How should latency calibration be represented without confusing beginners?
- Which notation renderer best balances accessibility, maintainability, and export compatibility?
- How can manual correction make imperfect transcription useful instead of misleading?
- What is the minimum video-to-rhythm prototype that remains honest about limitations?
