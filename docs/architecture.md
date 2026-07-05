# Architecture

OpenPractice Toolkit should begin as a web/PWA-first application with local-first processing and a clear boundary between core practice tools and optional experiments.

## Initial Shape

- Browser-first application.
- Offline-capable shell where practical.
- Web Audio API for timing, playback, recording, and click generation.
- Local file import/export for MIDI, MusicXML, WAV, and structured project data.
- No required backend for core practice features.

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
- How should latency calibration be represented without confusing beginners?
- Which notation renderer best balances accessibility, maintainability, and export compatibility?
- How can manual correction make imperfect transcription useful instead of misleading?
- What is the minimum video-to-rhythm prototype that remains honest about limitations?
